
class Listener {
    constructor() {
        this.eventList = {}
    }
    on(event, fn) {
        if (!this.eventList[event]) this.eventList[event] = []
        if (fn.name) {
            let obj = {}
            obj[fn.name] = fn
            fn = obj
        }
        this.eventList[event].push(fn)
    }
    remove(event, fn) {
        if (!fn) return console.error('Choose a named function to remove!')
        this.eventList[event].map((item, index) => {
            if (typeof item === 'object' && item[fn.name]) {
                this.eventList[event].splice(index, 1)
            }
        })
    }
    emit(event, data) {
        this.eventList[event].map((fn) => {
            if (typeof fn === 'object') {
                Object.values(fn).map((f) => f.call(null, data))
            } else {
                fn.call(null, data)
            }
        })
    }
}

