// Promise的三个状态常量
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
    constructor(executor) {
        // 执行器，传入后立即执行
        try {
            executor(this.resolve, this.reject);
        } catch (error) {
            // 执行器发生错误直接reject
            this.reject(error);
        }
    };

    value = null;
    reason = null;
    status = PENDING;

    onFulfilledCallbacks = []
    onRejectedCallbacks = [];
    // 箭头函数，自动继承上街的this
    // 普通函数，默认为this;
    resolve = (value) => {
        if (this.status === PENDING) {
            this.status = FULFILLED;
            this.value = value;

            // 处理status处于pending的时候的情况
            while (this.onFulfilledCallbacks.length) {
                this.onFulfilledCallbacks.shift()(value);
            }
        }
    }

    reject = (reason) => {
        if (this.status === PENDING) {
            this.status = REJECTED;
            this.reason = reason;

            // 处理status处于pending的时候的情况,出队，执行
            while (this.onRejectedCallbacks.length) {
                this.onRejectedCallbacks.shift()(reason)
            }
        }
    }

    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : error => { throw error }
        const promise2 = new MyPromise((resolve, reject) => {

            // 创建微任务等待promise2的完成
            const fulfilledMicrotask = () => {
                queueMicrotask(() => {
                    try {
                        // 获取成功回调的执行结果
                        const x = onFulfilled(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                });
            };
            const rejectedMicrotask = () => {
                queueMicrotask(() => {
                    try {
                        const x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                })
            };
            // 更具当前实例的状态判断
            if (this.status === FULFILLED) {
                fulfilledMicrotask();
            } else if (this.status === REJECTED) {
                rejectedMicrotask();
            } else if (this.status === PENDING) {
                // 处理同一个promise加入多个回调函数的情况
                this.onFulfilledCallbacks.push(fulfilledMicrotask)
                this.onRejectedCallbacks.push(rejectedMicrotask);
            }

        });

        return promise2;
    }





    static resolve(param) {
        if (param instanceof MyPromise) {
            return parm;
        }
        return new MyPromise((resolve, reject) => {
            resovle(param);
        })
    }

    static reject(reason) {
        return new MyPromise((resolve, reject) => {
            reject(reason);
        })
    }
}
// 方便promise-aplus-tests 测试
MyPromise.deferred = function() {
    var result = {};
    result.promise = new MyPromise(function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
}

function resolvePromise(promise, x, resolve, reject) {
    if (promise === x) {
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
    }
    if (typeof x === 'object' || typeof x === 'function') {
        if (x == null) {
            return resolve(x);
        }
        let then;

        try {
            then = x.then;
        } catch (error) {
            return reject(error)
        }

        if (typeof then === 'function') {
            let called = false;
            try {
                then.call(
                    x,
                    y => {
                        if (called) return;
                        called = true;
                        resolvePromise(promise, y, resolve, reject);
                    },
                    r => {
                        if (called) return;
                        called = true;
                        reject(r);
                    }
                )
            } catch (e) {
                if (called) return;
                reject(e);
            }

        } else {
            resolve(x);
        }
    } else {
        resovle(x);
    }
}




module.exports = MyPromise;