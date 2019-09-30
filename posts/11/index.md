### 前言

自己着手准备写这篇文章的初衷是觉得如果想要更深入的理解 JS，异步编程则是必须要跨过的一道坎。由于这里面涉及到的东西很多也很广，在初学 JS 的时候可能无法完整的理解这一概念，即使在现在来看还是有很多自己没有接触和理解到的知识点，但是为了跨过这道坎，我仍然愿意鼓起勇气用我已经掌握的部分知识尽全力讲述一下 JS 中的异步编程。如果我所讲的一些概念或术语有错误，请读者向我指出问题所在，我会立即纠正更改。

### 同步与异步

我们知道无论是在浏览器端还是在服务器 ( Node ) 端，JS 的执行都是在单线程下进行的。我们以浏览器中的 JS 执行线程为例，在这个线程中 JS 引擎会创建执行上下文栈，之后我们的代码就会作为执行上下文 ( 全局、函数、eval ) 像一系列任务一样在执行上下文栈中按照后进先出 ( LIFO ) 的方式依次执行。而同步最大的特性就是会阻塞后面任务的执行，比如此时 JS 正在执行大量的计算，这个时候就会使线程阻塞从而导致页面渲染加载不连贯 ( 在浏览器端的 Event Loop 中每次执行栈中的任务执行完毕后都会去检查并执行事件队列里面的任务直到队列中的任务为空，而事件队列中的任务又分为微队列与宏队列，当微队列中的任务执行完后才会去执行宏队列中的任务，而在微队列任务执行完到宏队列任务开始之前浏览器的 GUI 线程会执行一次页面渲染 ( UI rendering )，这也就解释了为什么在执行栈中进行大量的计算时会阻塞页面的渲染 ) 。

与同步相对的异步则可以理解为在异步操作完成后所要做的任务，它们通常以回调函数或者 Promise 的形式被放入事件队列，再由事件循环 ( Event Loop ) 机制在每次轮询时检查异步操作是否完成，若完成则按事件队列里面的执行规则来依次执行相应的任务。也正是得益于事件循环机制的存在，才使得异步任务不会像同步任务那样完全阻塞 JS 执行线程。

异步操作一般包括  **网络请求** 、**文件读取** 、**数据库处理**

异步任务一般包括  **setTimout / setInterval** 、**Promise** 、**requestAnimationFrame ( 浏览器独有 )** 、**setImmediate ( Node 独有 )** 、**process.nextTick ( Node 独有 )** 、**etc ...**

> **注意：** 在浏览器端与在 Node 端的 Event Loop 机制是有所不同的，下面给出的两张图简要阐述了在不同环境下事件循环的运行机制，由于 Event Loop 不是本文内容的重点，但是 JS 异步编程又是建立在它的基础之上的，故在下面给出相应的阅读链接，希望能够帮助到有需要的读者。

**浏览器端**

![](https://s1.ax1x.com/2018/10/25/iym7Bq.png)

**Node 端**

![](https://s1.ax1x.com/2018/10/25/iymcHP.png)

**阅读链接**

* **[深入理解 JS 事件循环机制 ( 浏览器篇 )](http://lynnelv.github.io/js-event-loop-browser)**
* **[深入理解 JS 事件循环机制 ( Node.js 篇 )](http://lynnelv.github.io/js-event-loop-nodejs)**

### 为异步而生的 JS 语法

回望历史，在最近几年里 ECMAScript 标准几乎每年都有版本的更新，也正是因为有像 ES6 这种在语言特性上大版本的更新，到了现今的 8102 年， JS 中的异步编程相对于那个只有回调函数的远古时代有了很大的进步。下面我将介绍 callback 、Promise 、generator 、async / await 的基本用法以及如何在异步编程中使用它们。

#### callback

回调函数并不算是 JS 中的语法但它却是解决异步编程问题中最常用的一种方法，所以在这里有必要提出来，下面举一个例子，大家看一眼就懂。

```js
const foo = function (x, y, cb) {
    setTimeout(() => {
        cb(x + y)
    }, 2000)
}

// 使用 thunk 函数，有点函数柯里化的味道，在最后处理 callback。
const thunkify = function (fn) {
    return function () {
        let args = Array.from(arguments)
        return function (cb) {
            fn.apply(null, [...args, cb])
        }
    }
}

let fooThunkory = thunkify(foo)

let fooThunk1 = fooThunkory(2, 8)
let fooThunk2 = fooThunkory(4, 16)

fooThunk1((sum) => {
    console.log(sum) // 10
})

fooThunk2((sum) => {
    console.log(sum) // 20
})
```

#### Promise

在 ES6 没有发布之前，作为异步编程主力军的回调函数一直被人诟病，其原因有太多比如回调地狱、代码执行顺序难以追踪、后期因代码变得十分复杂导致无法维护和更新等，而 Promise 的出现在很大程度上改变了之前的窘境。话不多说先直接上代码提前感受下它的魅力，然后我再总结下自己认为在 Promise 中很重要的几个点。

```js
const foo = function () {
    let args = [...arguments]
    let cb = args.pop()
    setTimeout(() => {
        cb(...args)
    }, 2000)
}

const promisify = function (fn) {
    return function () {
        let args = [...arguments]
        return function (cb) {
            return new Promise((resolve, reject) => {
                fn.apply(null, [...args, resolve, reject, cb])
            })
        }
    }
}

const callback = function (x, y, isAdd, resolve, reject) {
    if (isAdd) {
        resolve(x + y)
    } else {
        reject('Add is not allowed.')
    }
}

let promisory = promisify(foo)

let p1 = promisory(4, 16, false)
let p2 = promisory(2, 8, true)

p1(callback)
.then((sum) => {
    console.log(sum)
}, (err) => {
    console.error(err) // Add is not allowed.
})
.finally(() => {
    console.log('Triggered once the promise is settled.')
})

p2(callback)
.then((sum) => {
    console.log(sum) // 10
    return 'evil 😡'
})
.then((unknown) => {
    throw new Error(unknown)
})
.catch((err) => {
    console.error(err) // Error: evil 😡
})
```

**要点一：反控制反转 ( 关注点分离 )**

什么是反控制反转呢？要理解它我们应该先弄清楚控制反转的含义，来看一段伪代码。

```js
const request = require('request')

// 某购物系统获取用户必要信息后执行收费操作
const purchase = function (url) {
    request(url, (err, response, data) => {
        if (err) return console.error(err)
        if (response.statusCode === 200) {
            chargeUser(data)
        }
    })
}

purchase('https://cosmos-alien.com/api/getUserInfo')
```

显然在这里 `request` 模块属于第三方库是不能够完全信任的，假如某一天该模块出了 `bug` , 原本只会向目标 `url` 发送一次请求却变成了多次，相应的我们的 `chargeUser` 函数也就是收费操作就会被执行多次，最终导致用户被多次收费，这样的结果完全就是噩梦！然而这就是控制反转，即把自己的代码交给第三方掌控，因此是不可完全信任的。

那么反控制反转现在我们可以猜测它的含义应该就是将控制权交还到我们自己写的代码中，而要实现这点通常我们会引入一个第三方协商机制，在 `Promise` 之前我们会通过事件监听的形式来解决这类问题。现在我们将代码更改如下：

```js
const request = require('request')
const events = require('events')

const listener = new events.EventEmitter()

listener.on('charge', (data) => {
    chargeUser(data)
})

const purchase = function (url) {
    request(url, (err, response, data) => {
        if (err) return console.error(err)
        if (response.statusCode === 200) {
            listener.emit('charge', data)
        }
    })
}

purchase('https://cosmos-alien.com/api/getUserInfo')
```

更改代码之后我们会发现控制反转的恢复其实是更好的实现了关注点分离，我们不用去关心 `purchase` 函数内部具体发生了什么，只需要知道它在什么时候完成，之后我们的关注点就从 `purchase` 函数转移到了 `listener` 对象上。我们可以把 `listener` 对象提供给代码中多个独立的部分，在 `purchase` 函数完成后，它们同样也能收到通知并进行下一步的操作。以下是维基百科上关于关注点分离的一部分介绍。

> 关注点分离的价值在于简化计算机程序的开发和维护。当关注点分开时，各部分可以重复使用，以及独立开发和更新。具有特殊价值的是能够稍后改进或修改一段代码，而无需知道其他部分的细节必须对这些部分进行相应的更改。
>
> *一一    维基百科*

显然在 `Promise` 中 `new Promise()` 返回的对象就是关注点分离中分离出来的那个关注对象。

**要点二：不可变性 ( 值得信任 )**

细心的读者可能会发现，要点一中基于事件监听的反控制反转仍然没有解决最重要的信任问题，收费操作仍旧可以因为第三方 API 的多次调用而被触发且执行多次。幸运的是现在我们拥有 `Promise` 这样强大的机制，才得以让我们从信任危机中解脱出来。所谓不可变性就是：

**Promise 只能被决议一次，如果代码中试图多次调用 `resolve(..)` 或者 `reject(..)` ，Promise 只会接受第一次决议，决议后就是外部不可变的值，因此任何通过 `then(..)` 注册的回调只会被调用一次。**

现在要点一中的示例代码就可以最终更改为：

```js
const request = require('request')

const purchase = function (url) {
    return new Promise((resolve, reject) => {
        request(url, (err, response, data) => {
            if (err) reject(err)
            if (response.statusCode === 200) {
                resolve(data)
            }
        })
    })
}

purchase('https://cosmos-alien.com/api/getUserInfo')
.then((data) => {
    chargeUser(data)
})
.catch((err) => {
    console.error(err)
})
```

**要点三：错误处理及一些细节**

还记得最开始讲 Promise 时的那一段代码吗？我们把打印结果的那部分代码再次拿出来看看。

```js
p1(callback)
.then((sum) => {
    console.log(sum)
}, (err) => {
    console.error(err) // Add is not allowed.
})
.finally(() => {
    console.log('Triggered once the promise is settled.')
})

p2(callback)
.then((sum) => {
    console.log(sum) // 10
    return 'evil 😡'
})
.then((unknown) => {
    throw new Error(unknown)
})
.catch((err) => {
    console.error(err) // Error: evil 😡
})
```

首先我们说下 `then(..)` ，它的第一个参数作为函数接收 `promise` 对象中 `resolve(..)` 的值，第二个参数则作为错误处理函数处理在 Promise 中可能发生的错误。

而在 Promise 中有两种错误可能会出现，一种是显式 `reject(..)` 抛出的错误，另一种则是代码自身有错误会被 Promise 捕捉，通过 `then(..)` 中的错误处理函数我们可以接收到它前面 `promise` 对象中出现的错误，而如果在 `then(..)` 接收 `resolve(..)` 值的函数中也出现错误，该错误则会被下一个 `then(..)` 的错误处理函数所接收 ( 有两个前提，第一是要写出这个 `then(..)` 否则该错误最终会在全局抛出，第二个则是要确保前一个 `then(..)` 在它的 Promise 决议后调用的是第一个参数即接收 `resolve(..)` 值的函数而不是错误处理函数 )。

一些值得注意的细节：

`catch(..)` 相当于 `then(..)` 中的错误处理函数 ，只是省略了第一个参数。

`finally(..)` 在 Promise 一旦决议后 ( 无论是 `resolve` 还是 `reject` ) 都会被执行。

`then(..)` 、`catch(..)` 、`finally(..)` 都是异步调用，作为 Event Loop 里事件队列中的微队列任务执行。

**补充：手写一个 Promise**

```js
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
```

可以看到实现 Promise 的关键就是为其设置 `pending` 、`resolved` 、`rejected` 三种状态，而且只能由 `pending` 转换到 `resolved` 或者 `rejected` 。需要注意的是我们用 `then(..)` 注册的那些回调函数早在执行同步代码的时候就已经被缓存在对应 Promise 中的 `callbacks` 数组里 ( 如果此时的状态为 `pending` )，当异步操作完成后我们执行从 Promise 传递出来的 `resolve` 或者 `rejected` 函数去触发 `callbacks` 数组中相应函数的执行。我们还会发现 `then(..)` 方法是链式调用的，即在 Promise 内部当前一个 Promise 的 `then(..)` 注册的回调函数执行完后就会自动调用下一个 Promise 中的 `resolve` 函数，然后再去执行该 Promise 中 `callbacks` 数组里缓存的回调函数。

#### generator

generator 也叫做生成器，它是 ES6 中引入的一种新的函数类型，在函数内部它可以多次启动和暂停，从而形成阻塞同步的代码。下面我将先讲述它的基本用法然后是它在异步编程中的使用最后会简单探究一下它的工作原理。

**生成器基本用法** 

```js
let a = 2

const foo = function *(x, y) {
    let b = (yield x) + a
    let c = (yield y) + b
    console.log(a + b + c)
}

let it = foo(6, 8)

let x = it.next().value
a++
let y = it.next(x * 5).value
a++

it.next(x + y) // 84
```

从上面的代码我们可以看到与普通的函数不同，生成器函数执行后返回的是一个迭代器对象，用来控制生成器的暂停和启动。在常见的设计模式中就有一种模式叫做迭代器模式，它指的是提供一种方法顺序访问一个聚合对象中的各个元素，而又不需要暴露该对象的内部表示。迭代器对象 `it` 包含一个 `next(..)` 方法且在调用之后返回一个 `{ done: .. , value: .. }` 对象，现在我们先来自己实现一个简单的迭代器。

```js
const iterator = function (obj) {
    let current = -1
    return {
        [Symbol.iterator]() {
            return this
        },
        next() {
            current++
            return { done: current < obj.length ? false : true, value: obj[current] }
        }
    }
}

let it1 = iterator([1,2,3,4])

it1.next().value // 1
it1.next().value // 2
it1.next().value // 3
it1.next().value // 4

let it2 = iterator([5,6,7,8])

for (let v of it2) { console.log(v) } // 5 6 7 8
```

可以看到我们自己实现的迭代器不仅能够手动进行迭代，还能被 `for..of` 自动迭代展开，这是因为在 ES6 中只要对象具有 `Symbol.iterator` 属性且该属性返回的是一个迭代器对象，就能够被 `for..of` 所消费。

回头来看最开始的那个 generator 示例代码中生成器产生的迭代器对象 `it` ，似乎它比普通的迭代器有着更强大的功能，其实就是与 `yield` 表达式紧密相连的**消息双向传递**。现在我先来总结一下自己认为在生成器中十分重要的点，然后再来分析下那段示例代码的完整执行过程。

**每次调用 `it.next()` 后生成器函数内的代码就会启动执行且返回一个 `{ done: .. , value: .. }` 对象，一旦遇到 `yield` 表达式就会暂停执行，如果此时 `yield` 表达式后面跟有值例如 `yield val`，那么这个 `val` 就会被传入返回对象中键名 `value` 对应的键值，当再次调用 `it.next()` 时 `yield` 的暂停效果就会被取消，如果此时的 `next` 为形如 `it.next(val)` 的调用，`yield` 表达式就会被 `val` 所替换。这就是生成器内部与迭代器对象外部之间的消息双向传递。**

弄清了生成器中重要的特性后要理解开头的那段代码就不难了，首先执行第一个 `it.next().value` ，遇到第一个 `yield` 后生成器暂停执行，此时变量 `x` 接受到的值为 6。在全局环境下执行 `a++` 后再次执行 `it.next(x * 5).value` 生成器继续执行且传入值 30，因此变量 `b` 的值就为 33，当遇到第二个 `yield` 后生成器又暂停执行，并且将值 8 传出给变量 `y` 。再次执行 `a++` ，然后执行 `it.next(x + y)` 恢复生成器执行并传入值 14，此时变量 `c` 的值就为 47，最终计算 `a + b + c` 便可得到值 84。

**在异步编程中使用生成器**

既然现在我们已经知道了生成器内部拥有能够多次启动和暂停代码执行的强大能力，那么将它用于异步编程中也便是理所当然的事情了。先来看一个异步迭代生成器的例子。

```js
const request = require('request')

const foo = function () {
    request('https://cosmos-alien.com/some.url', (err, response, data) => {
        if (err) it.throw(err)
        if (response.statusCode === 200) {
            it.next(data)
        }
    })
}

const main = function *() {
    try {
        let result = yield foo()
        console.log(result)
    }
    catch (err) {
        console.error(err)
    }
}

let it = main()

it.next()
```

这个例子的逻辑很简单，调用 `it.next()` 后生成器启动，遇到 `yield` 时生成器暂停运行，但此时 `foo` 函数已经执行即网络请求已经发出，等到有响应结果时如果出错则调用 `it.throw(err)` 将错误抛回生成器内部由 `try..catch` 同步捕获，否则将返回的 `data` 作为传回生成器的值在恢复执行的同时将 `data` 赋值给变量 `result` ，最后打印 `result` 得到我们想要的结果。 

在 ES6 中最完美的世界就是生成器 ( 看似同步的异步代码 ) 和 Promise ( 可信任可组合 ) 的结合，因此我们现在再来看一个由生成器 + Promise 实现异步操作的例子。

```js
const axios = require('axios')

const foo = function () {
    return axios({
        method: 'GET',
        url: 'https://cosmos-alien.com/some.url'
    })
}

const main = function *() {
    try {
        let result = yield foo()
        console.log(result)
    }
    catch (err) {
        console.error(err)
    }
}

let it = main()

let p = it.next().value

p.then((data) => {
    it.next(data)
}, (err) => {
    it.throw(err)
})
```

这个例子跟前面异步迭代生成器的例子几乎是差不多的，唯一不同的就是 `yield` 传递出去的是一个 `promise` 对象，之后我们在 `then(..)` 中来恢复执行生成器里下一步的操作或是抛出一个错误。

**生成器工作原理**

在讲了那么多关于 generator 生成器的使用后，相信读者也跟我一样想知道生成器究竟是如何实现能够控制函数内部代码的暂停和启动，从而形成阻塞同步的效果。

我们先来简单了解下有限状态机 ( FSM ) 这个概念，维基百科上给出的解释是表示有限个状态以及在这些状态之间的转移和动作等行为的数学模型。简单的来说，它有三个主要特征：

1. 状态总数 ( state ) 是有限的
2. 任一时刻，只处在一种状态之中
3. 某种条件下，会从一种状态转变 ( transition ) 到另一种状态

其实生成器就是通过暂停自己的作用域 / 状态来实现它的魔法的，下面我们就以上文的生成器 + Promise 的例子为基础，用有限状态机的方式来阐述生成器的基本工作原理。

```js
let stateRequest = {
    done: false,
    transition(message) {
        this.state = this.stateResult
        console.log(message)
        // state 1
        return foo()
    }
}

let stateResult = {
    done: true,
    transition(data) {
        // state 2
        let result = data
        console.log(result)
    }
}

let stateError = {
    transition(err) {
        // state 3
        console.error(err)
    }
}

let it = {
    init() {
        this.stateRequest = Object.create(stateRequest)
        this.stateResult = Object.create(stateResult)
        this.stateError = Object.create(stateError)
        this.state = this.stateRequest
    },
    next(data) {
        if (this.state.done) {
            return {
                done: true,
                value: undefined
            }
        } else {
            return {
                done: this.state.done,
                value: this.state.transition.call(this, data)
            }
        }
    },
    throw(err) {
        return {
            done: true,
            value: this.stateError.transition(err)
        }
    }
}

it.init()
it.next('The request begins !')
```

在这里我使用了行为委托模式和状态模式实现了一个简单的有限状态机，而它却展现了生成器中核心部分的工作原理，下面我们来逐步分析它是如何运行的。

首先这里我们自己创建的 `it` 对象就相当于生成器函数执行后返回的迭代器对象，我们把上文生成器 + Promise 示例中的 `main` 函数代码分为了三个状态并将跟该状态有关的行为封装到了 `stateRequest` 、`stateResult` 、`stateError` 三个对象中。然后我们再调用 `init(..)` 将 `it` 对象上的行为委托到这三个对象上并初始化当前的状态对象。在准备工作完成后调用 `next(..)` 启动生成器，这个时候我们就进入了状态一，即执行 `foo` 函数发出网络请求。在 `foo` 函数内部当得到请求响应数据后就执行 `it.next(data)` 触发状态机内部的状态改变，此时执行状态二内部的代码即打印网络请求返回的结果。如果网络请求中出现错误就会执行 `it.throw(err)` ，这个时候的状态就会转换到状态三即错误处理状态。

在这里我们似乎忽略了一个很重要的地方，就是生成器是如何做到将其内部的代码分为多个状态的，当然我们知道这肯定是 `yield` 表达式的功劳，但是其内部又是怎么实现的呢？由于本人能力还不够，而且还有很多东西来不及去学习和了解，因此暂时无法解决这个问题，但我还是愿意把这个问题提出来，如果读者确实有兴趣能够通过查阅资料找到答案或者已经知道它的原理还是可以分享出来，毕竟经历这样刨根问底的过程还是满有趣的。

#### async / await

终于讲到最后一个异步语法了，作为压轴的身份出场，据说 async / await 是 JS 异步编程中的终极解决方案。话不多说，先直接上代码看看它的基本用法，然后我们再来探讨一下它的实现原理。

```js
const foo = function (time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(time + 200)
        }, time)
    })
}

const step1 = time => foo(time)
const step2 = time => foo(time) 
const step3 = time => foo(time)

const main = async function () {
    try {
        console.time('run')
        let time1 = 200
        let time2 = await step1(time1)
        let time3 = await step2(time2)
        await step3(time3)
        console.log(`All steps took ${time1 + time2 + time3} ms.`)
        console.timeEnd('run')
    } catch(err) {
        console.error(err)
    }
}

main()
// All steps took 1200 ms.
// run: 1222.87939453125ms
```

我们可以看到 async 函数跟生成器函数极为相似，只是将之前的 `*` 变成了 `async` ，`yield` 变成了 `await` 。其实它就是一个能够自动执行的 generator 函数，我们不用再通过手动执行 `it.next(..)` 来控制生成器函数的暂停与启动。

`await` 帮我们做到了在同步阻塞代码的同时还能够监听 Promise 对象的决议，一旦 `promise` 决议，原本暂停执行的 async 函数就会恢复执行。这个时候如果决议是 `resolve` ，那么返回的结果就是 `resolve` 出来的值。如果决议是 `reject` ，我们就必须用 `try..catch` 来捕获这个错误，因为它相当于执行了 `it.throw(err)` 。

下面直接给出一种主流的 async / await 语法版本的实现代码：

```js
const runner = function (gen) {
    return new Promise((resolve, reject) => {
        var it = gen()
        const step = function (execute) {
            try {
                var next = execute()
            } catch (err) {
                reject(err)
            }
            
            if (next.done) return resolve(next.value)
            
            Promise.resolve(next.value)
            .then(val => step(() => it.next(val)))
            .catch(err => step(() => it.throw(err)))
        }
        step(() => it.next())
    })
}

async function fn() {
    // ...
}

// 等同于

function fn() {
    const gen = function *() {
        // ...
    }
    runner(gen)
}
```

从上面的代码我们可以看出 async 函数执行后返回的是一个 Promise 对象，然后使用递归的方法去自动执行生成器函数的暂停与启动。如果调用 `it.next().value` 传出来的是一个 `promise` ，则用 `Promise.resolve()` 方法将其异步展开，当这个 `promise` 决议时就可以重新启动执行生成器函数或者抛出一个错误被 `try..catch` 所捕获并最终在 async 函数返回的 Promise 对象的错误处理函数中处理。

**关于 async / await 的执行顺序**

下面给出一道关于 async / await 执行顺序的经典面试题，网上给出的解释给我感觉似乎很含糊。在这里我们结合上文所讲的 generator 函数运行机制和 async / await 实现原理来具体阐述下为什么执行顺序是这样的。

```js
async function async1(){
    console.log('async1 start')
    await async2()
    console.log('async1 end')
}

async function async2(){
    console.log('async2')
}

console.log('script start')

setTimeout(() => {
    console.log('setTimeout')
})

async1()

new Promise((resolve) => {
    console.log('promise1')
    resolve()
})
.then(() => {
    console.log('promise2')
})

console.log('script end')
```

将这段代码放在浏览器中运行，最终的结果这样的：

```js
script start
async1 start
async2
promise1
script end
promise2
async1 end
setTimeout
```

其实最主要的地方还是要分清在执行栈中同步执行的任务与事件队列中异步执行的任务。首先我们执行同步任务，打印 `script start` ，调用函数 `async1` ，在我们遇到 `await` 表达式后就会暂停函数 `async1` 的执行。因为在这里它相当于 `yield async2()` ，根据上文的 async / await 原理实现代码可以看出，当自动调用 `it.next()` 时遇到第一个 `yield` 后会暂停执行，但此时函数 `async2` 已经执行。上文还提到过 `async` 函数在执行完后会返回一个 Promise 对象，故此时 `it.next().value` 的值就是一个 `promise` 。接下来要讲的就是重点啦 ！！！

**我们用 `Promise.resolve()` 去异步地展开一个 `promise` ，因此第一个放入事件队列中的微队列任务其实就是这个 `promise` 。之后我们再继续运行执行栈中剩下的同步任务，此时打印出 `promise1` 和 `script end` ，同时第二个异步任务被加入到事件队列中的微队列。同步的任务执行完了，现在来执行异步任务，首先将微队列中第一个放入的那个 `promise` 拿到执行栈中去执行，这个时候之前 `Promise.resolve()` 后面注册的回调任务才会作为第三个任务加入到事件队列中的微队列里去。然后我们执行微队列中的第二个任务，打印 `promise2`，再执行第三个任务即调用 `step(() => it.next(val))` 恢复 `async` 函数的执行，打印 `async1 end` 。最后，因为微队列总是抢占式的在宏队列之前插入执行，故只有当微队列中没有了任务以后，宏队列中的任务才会开始执行，故最终打印出 `setTimeout` 。**   

### 常见异步模式

> 在软件开发中有着设计模式这一专业术语，通俗一点来讲设计模式其实就是在某种场合下针对某个问题的一种解决方案。

在 JS 异步编程的世界里，很多时候我们也会遇到因为是异步操作而出现的特定问题，而针对这些问题所提出的解决方案 ( 逻辑代码 ) 就是异步编程的核心，似乎在这里它跟设计模式的概念很相像，所以我把它叫做异步模式。下面我将介绍几种常见的异步模式在实际场景下的应用。

**并发交互模式**

当我们在同时执行多个异步任务时，这些任务返回响应结果的时间往往是不确定的，因而会产生以下两种常见的需求：

1. 多个异步任务同时执行，等待所有任务都返回结果后才开始进行下一步的操作。
2. 多个异步任务同时执行，只返回最先完成异步操作的那个任务的结果然后再进行下一步的操作。

**场景一：**

同时读取多个含有英文文章的 `txt` 文件内容，计算其中单词 `of` 的个数。

1. 等待所有文件中的 `of` 个数计算完毕，再计算输出总的 `of` 数。
2. 直接输出第一个计算完 `of` 的个数。

```js
const fs = require('fs')
const path = require('path')

const addAll = (result) => console.log(result.reduce((prev, cur) => prev + cur))

let dir = path.join(__dirname, 'files')

fs.readdir(dir, (err, files) => {
    if (err) return console.error(err)
    let promises = files.map((file) => {
        return new Promise((resolve, reject) => {
            let fileDir = path.join(dir, file)
            fs.readFile(fileDir, { encoding: 'utf-8' }, (err, data) => {
                if (err) reject(err)
                let count = 0
                data.split(' ').map(word => word === 'of' ? count++ : null)
                resolve(count)
            })
        })
    })
    Promise.all(promises).then(result => addAll(result)).catch(err => console.error(err))
    Promise.race(promises).then(result => console.log(result)).catch(err => console.error(err))
})
```

**并发控制模式**

有时候我们会遇到大量异步任务并发执行而且还要处理返回数据的情况，即使拥有事件循环 ( Event Loop ) 机制，在并发量过高的情况下程序仍然会崩溃，所以这个时候就应该考虑并发控制。

**场景二：**

利用 Node.js 实现图片爬虫，控制爬取时的并发量。一是防止 IP 被封掉 ，二是防止并发请求量过高使程序崩溃。

```js
const fs = require('fs')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')

const target = `http://www.zimuxia.cn/${encodeURIComponent('我们的作品')}`

const isError = (err, res) => (err || res.statusCode !== 200) ? true : false

const getImgUrls = function (pages) {
    return new Promise((resolve) => {
        let limit = 8, number = 0, imgUrls = []
        const recursive = async function () {
            pages = pages - limit
            limit = pages >= 0 ? limit : (pages + limit)
            let arr = []
            for (let i = 1; i <=limit; i++) {
                arr.push(
                    new Promise((resolve) => {
                        request(target + `?set=${number++}`, (err, res, data) => {
                            if (isError(err, res)) return console.log('Request failed.')
                            let $ = cheerio.load(data)
                            $('.pg-page-wrapper img').each((i, el) => {
                                let imgUrl = $(el).attr('data-cfsrc')
                                imgUrls.push(imgUrl)
                                resolve()
                            })
                        })
                    })
                )
            }
            await Promise.all(arr)
            if (limit === 8) return recursive()
            resolve(imgUrls)
        }
        recursive()
    })
}

const downloadImages = function (imgUrls) {
    console.log('\n Start to download images. \n')
    let limit = 5
    const recursive = async function () {
        limit = imgUrls.length - limit >= 0 ? limit : imgUrls.length
        let arr = imgUrls.splice(0, limit)
        let promises = arr.map((url) => {
            return new Promise((resolve) => {
                let imgName = url.split('/').pop()
                let imgPath = path.join(__dirname, `images/${imgName}`)
                request(url)
                .pipe(fs.createWriteStream(imgPath))
                .on('close', () => {
                    console.log(`${imgName} has been saved.`)
                    resolve()
                })
            })
        })
        await Promise.all(promises)
        if (imgUrls.length) return recursive()
        console.log('\n All images have been downloaded.')
    }
    recursive()
}

request({
    url: target,
    method: 'GET'
}, (err, res, data) => {
    if (isError(err, res)) return console.log('Request failed.')
    let $ = cheerio.load(data)
    let pageNum = $('.pg-pagination li').length
    console.log('Start to get image urls...')
    getImgUrls(pageNum)
    .then((result) => {
        console.log(`Finish getting image urls and the number of them is ${result.length}.`)
        downloadImages(result)
    })
})
```

**发布 / 订阅模式**

我们假定，存在一个"信号中心"，当某个任务执行完成，就向信号中心"发布" ( publish ) 一个信号，其他任务可以向信号中心"订阅" ( subscribe ) 这个信号，从而知道什么时候自己可以开始执行，当然我们还可以取消订阅这个信号。

我们先来实现一个简单的发布订阅对象：

```js
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

let listener = new Listener()

function foo(data) { console.log('Hello ' + data) }

listener.on('click', (data) => console.log(data))

listener.on('click', foo)

listener.emit('click', 'RetroAstro')

// Hello
// Hello RetroAstro

listener.remove('click', foo)

listener.emit('click', 'Barry Allen')

// Barry Allen
```

**场景三：**

监听 watch 文件夹，当里面的文件有改动时自动压缩该文件并保存到 done 文件夹中。

```js
// gzip.js
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const gzipFile = function (file) {
    let dir = path.join(__dirname, 'watch')
    fs.readdir(dir, (err, files) => {
        if (err) console.error(err)
        files.map((filename) => {
            let watchFile = path.join(dir, filename)
            fs.stat(watchFile, (err, stats) => {
                if (err) console.error(err)
                if (stats.isFile() && file === filename) {
                    let doneFile = path.join(__dirname, `done/${file}.gz`)
                    fs.createReadStream(watchFile)
                    .pipe(zlib.createGzip())
                    .pipe(fs.createWriteStream(doneFile))
                }
            })
        })
    })
}

module.exports = {
    gzipFile: gzipFile
}
```

开始监听 watch 文件夹中的文件

```js
// watch.js
const fs = require('fs')
const path = require('path')

const { gzipFile } = require('./gzip')
const { Listener } = require('./listener')

let listener = new Listener()

listener.on('gzip', (data) => gzipFile(data))

let dir = path.join(__dirname, 'watch')

let wait = true

fs.watch(dir, (event, filename) => {
    if (filename && event === 'change' && wait) {
        wait = false
        setTimeout(() => wait = true, 100)
        listener.emit('gzip', filename)
    }
})
```

### 结语

对于 JavaScript 异步编程在这里我就讲这么多了，当然还有很多东西自己没有了解和学习到，因此在本篇文章中没有涉及。最后还是给出上面三个场景代码的 [**GitHub 地址**](https://github.com/RetroAstro/cosmos-blog/tree/master/posts/11) ，总之在前端学习的路上还得继续加油嘞 😄。

---

参考书籍及文章：

《 你不知道的 JavaScript 》(上)  (中)

《 JavaScript 设计模式与开发实践 》

《 Node.js 实战 》( 第二版 )

&nbsp;&nbsp;[深入理解 JS 事件循环机制 ( 浏览器篇 )](http://lynnelv.github.io/js-event-loop-browser)

&nbsp;&nbsp;[深入理解 JS 事件循环机制 ( Node.js 篇 )](http://lynnelv.github.io/js-event-loop-nodejs) 

&nbsp;&nbsp;[JavaScript 异步编程的四种方法](http://www.ruanyifeng.com/blog/2012/12/asynchronous%EF%BC%BFjavascript.html)

&nbsp;&nbsp;[彻底理解 Promise 原理](https://segmentfault.com/a/1190000009478377#articleHeader4)

&nbsp;&nbsp;[async 函数的含义和用法](http://www.ruanyifeng.com/blog/2015/05/async.html)

&nbsp;&nbsp;[从浏览器多进程到 JS 单线程，JS 运行机制最全面的一次梳理](https://segmentfault.com/a/1190000012925872)



