function iPromise(fn) {
    let state = 'pending',
        value = null,
        error = null,
        callbacks = []

    this.then = function (onFulfilled, onRejected) {
        return new iPromise((resolve, reject) => {
            transition({
                onFulfilled: onFulfilled,
                onRejected: onRejected,
                resolve: resolve,
                reject: reject
            })
        })
    }

    function transition(callback) {
        let result
        switch (state) {
            case 'pending':
                callbacks.push(callback)
                return
            case 'resolved':
                try {
                    if (callback.onFulfilled) result = callback.onFulfilled(value)
                } catch (e) {
                    if (callback.onRejected) result = callback.onRejected(e)
                }
                break
            case 'rejected':
                if (callback.onRejected) result = callback.onRejected(error)
                break
        }
        if (result instanceof iPromise) {
            result.then(callback.resolve, callback.reject)
            return
        }
        state === 'resolved' ? callback.resolve(result) : callback.reject(result)
    }

    function resolve(newValue) {
        state = 'resolved'
        value = newValue
        execute()
    }

    function reject(err) {
        state = 'rejected'
        error = err
        execute()
    }

    function execute() {
        callbacks.length ? callbacks.map(callback => transition(callback)) : null
    }

    fn(resolve, reject)
}

var p = new iPromise((resolve) => {
    setTimeout(() => resolve(2333), 1000)
})

p.then(res =>
    new iPromise((resolve) => {
        setTimeout(() => {
            resolve(res)
        }, 2000)
    })
).then(res =>
    new iPromise((resolve, reject) => {
        reject(res)
    })
).then(null, err => console.error(err)) // 2333

