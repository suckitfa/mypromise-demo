const PENDING = 'pending';
const FULFILED = 'fulfiled';
const REJECTED = 'rejected';

function MyPromise(executor) {
    const self = this;
    self.status = PENDING
    self.error = null;
    self.value = null;
    self.onFulfiledCallbacks = [];
    self.onRejectedCallbacks = [];

    const resolve = (value) => {
        if (self.status !== PENDING) return;
        setTimeout(() => {
            self.value = value;
            self.status = FULFILED;
            self.onFulfiledCallbacks.forEach(cb => cb(self.value))
        })
    }

    const reject = (error) => {
        if (self.status !== PENDING) rerturn;
        setTimeout(() => {
            self.error = error;
            self.status = REJECTED;
            self.onRejectedCallbacks.forEach(cb => cb(self.error));
        })
    }
    executor(resolve, reject);
}

MyPromise.prototype.then = function(onFulfilled, onRejected) {
    // 对两个参数的处理情况
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : error => { throw error };

    const self = this;
    let bridgePromise;
    if (self.status === PENDING) {
        return bridgePromise = new MyPromise((resolve, reject) => {
            self.onFulfiledCallbacks.push((value) => {
                try {
                    let x = onFulfilled(value);
                    resovlePromise(bridgePromise, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });
            self.onRejectedCallbacks.push((error) => {
                try {
                    let x = onRejected(error);
                    resovlePromise(bridgePromise, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            })
        });
    }
    if (self.status === FULFILED) {
        return bridgePromise = new MyPromise((resovle, reject) => {
            setTimeout(() => {
                try {
                    let x = onFulfilled(self.value);
                    resovlePromise(bridgePromise, x, resovle, reject);
                } catch (e) {
                    reject(e);
                }
            })
        })
    }

    if (self.status === REJECTED) {
        return bridgePromise = new MyPromise((resovle, reject) => {
            setTimeout(() => {
                try {
                    let x = onRejected(self.value);
                    resovlePromise(bridgePromise, x, resovle, reject);
                } catch (e) {
                    reject(e);
                }
            })
        })
    }
}

function resovlePromise(bridgePromise, x, resovle, reject) {
    if (x instanceof MyPromise) {
        if (x.status === PENDING) {
            x.then(y => {
                    resovlePromise(bridgePromise, y, resolve, reject);
                },
                error => {
                    reject(error);
                }
            );
        } else {
            x.then(resovle, reject);
        }
    } else {
        resovle(x);
    }
}
// 静态方法
// 1. 传入promise，则返回
// 2. 传入thenable,则返回promie会跟随这个对象，采用它的最终状态作为自己的状态
// 3. 其他情况，则直接返回以该值为成功状态promise对象。
MyPromise.resolve = (parma) => {
    if (param instanceof MyPromise) return param;
    return new MyPromise((resolve, reject) => {
        if (param && parma.then && typeof param.then === 'function') {
            param.then(resovle, reject);
        } else {
            resolve(param);
        }
    });
}

// 将错误原因原封不动的向下传递
MyPromise.reject = (reason) => {
    return new MyPromise((resolve, reject) => {
        reject(reason);
    })
}

MyPromise.prototype.finally = (callback => {
    this.then(value => {
        return new MyPromise.resolve(
                callback().then(() => {
                    return value;
                })),
            error => {
                return MyPromise.resolve(callback()).then(() => {
                    throw error;
                })
            }
    });
});

// 传入一个空的可迭代对象，直接resolve
// 传入一个失败的promise，Promise.all返回promise对象失败
// 任何情况下， Promise.all返回的promise完成的状态结果都为一个数组

MyPromise.all = function(promises) {
    return new MyPromise((resolve, reject) => {
        let result = []
        let index = 0; // 记录成功的promise
        let len = promises.length;
        if (len === 0) {
            resolve(resolve)
            return;
        }
        for (let i = 0; i < len; i++) {
            // 使用Promise
            MyPromise.resolve(promises[i]).then(data => {
                result[i] = data;
                index++;
                if (index === len) resolve(result);
            }).catch(err => {
                reject(err);
            })
        }
    })
}

// 只要一个promise完成就搞定了
MyPromise.race = function(promises) {
    let len = promises.length;
    if (len === 0) return;
    for (let i = 0; i < len; i++) {
        Promise.resolve(promises[i]).then(data => {
            resovle(data);
            return;
        }).catch(error => {
            reject(err);
            return;
        })
    }
}

MyPromise.deferred = function() {
    const result = {}
    result.promise = new MyPromise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    })
    return result;
}

module.exports = MyPromise;