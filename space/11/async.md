> ### JavaScript 异步编程

### 前言

自己着手准备写这篇文章的初衷是觉得如果想要更深入的理解 JS，异步编程则是必须要跨过的一道坎。由于这里面涉及到的东西很多也很广，在初学 JS 的时候可能无法完整的理解这一概念，即使在现在来看还是有很多自己没有接触和理解到的知识点，但是为了跨过这道坎，我仍然愿意鼓起勇气用我已经掌握的部分知识尽全力讲述一下 JS 中的异步编程。如果我所讲的一些概念或术语有错误，请读者向我指出问题所在，我会立即纠正更改。

### 同步与异步

我们知道无论是在浏览器端还是在服务器 ( Node ) 端，JS 的执行都是在单线程下进行的。我们以浏览器中的 JS 执行线程为例，在这个线程中 JS 引擎会创建执行上下文栈 ( 全局、函数、eval )，这个时候我们的代码则会像一系列的任务一样在这些执行栈中按照后进先出 ( LIFO ) 的方式依次执行。而同步最大的特性就是会阻塞后面任务的执行，比如此时 JS 正在执行大量的计算，这个时候就会使线程阻塞从而导致页面渲染加载不连贯 ( 在浏览器端的 Event Loop 中每次执行栈中的任务执行完毕后都会去检查并执行事件队列里面的任务直到队列中的任务为空，而事件队列中的任务又分为微队列与宏队列，当微队列中的任务执行完后才会去执行宏队列中的任务，而在微队列任务执行完到宏队列任务开始之前浏览器的 GUI 线程会执行一次页面渲染 ( UI rendering )，这也就解释了为什么在执行栈中进行大量的计算时会阻塞页面的渲染 ) 。

与同步相对的异步则可以理解为在异步操作完成后所要做的任务，它们通常以回调函数或者 Promise 的形式被放入事件队列，再由事件循环 ( Event Loop ) 机制在每次轮询时检查异步操作是否完成，若完成则按事件队列里面的执行规则来依次执行相应的任务。也正是得益于事件循环机制的存在，才使得异步任务不会像同步任务那样完全阻塞 JS 执行线程。

异步操作一般包括  **网络请求** 、**文件读取** 、**数据库处理**

异步任务一般包括  **setTimout / setInterval** 、**Promise** 、**requestAnimationFrame ( 浏览器独有 )** 、**setImmediate ( Node 独有 )** 、**process.nextTick ( Node 独有 )** 、**etc ...**

> **注意：** 在浏览器端与在 Node 端的 Event Loop 机制是有所不同的，下面给出的两张图简要阐述了在不同环境下事件循环的运行机制，由于 Event Loop 不是本文内容的重点，但是 JS 异步编程又是建立在它的基础之上的，故在下面给出相应的阅读链接，希望能够帮助到有需要的读者。

**浏览器端**

![](https://user-gold-cdn.xitu.io/2018/1/20/16112dee30db2997?imageslim)

**Node 端**

![](https://user-gold-cdn.xitu.io/2018/5/21/163817de4a1ca52c?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

**阅读链接**

* **[深入理解 JS 事件循环机制 ( 浏览器篇 )](http://lynnelv.github.io/js-event-loop-browser)**
* **[深入理解 JS 事件循环机制 ( Node.js 篇 )](http://lynnelv.github.io/js-event-loop-nodejs)**

### 为异步而生的 JS 语法

回望历史，在最近几年里 ECMAScript 标准几乎每年都有版本的更新，也正是因为有像 ES6 这种在语言特性上大版本的更新，到了现今的 8102 年， JS 中的异步编程相对于那个只有回调函数的远古时代有了很大的进步。下面我将介绍 callback 、Promise 、generator 、async / await 的基本用法，为后文几种异步模式不同版本的逻辑代码实现打下基础。

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
        setTimeout(() => {
            resolve(x + y)
        }, 2000)
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

显然在这里 `request` 模块属于第三方库是不能够完全信任的，假如某一天该模块出了 `bug` , 原本只会向目标 `url` 发送一次请求却变成了多次，相应的我们的 `chargeUser` 函数也就是收费操作就会被执行多次，最终导致用户被多次收费，这样的结果完全就是噩梦！然而这就是控制反转，即把自己的代码交给第三方掌控，因此是完全不可信任的。

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

更改代码之后我们会发现控制反转的恢复其实是更好的实现了关注点分离，我们不用去关心 `purchase` 函数内部具体发生了什么，只需要知道它在什么时候完成，之后我们的关注点就从 `purchase` 函数转移到了 `listener` 对象上。我们可以把 `listener` 对象提供给代码中多个独立的部分，在 `purchase` 函数完成后，它们也能收到通知并进行下一步的操作。以下是维基百科上关于关注点分离的一部分介绍。

> 关注点分离的价值在于简化计算机程序的开发和维护。当关注点分开时，各部分可以重复使用，以及独立开发和更新。具有特殊价值的是能够稍后改进或修改一段代码，而无需知道其他部分的细节必须对这些部分进行相应的更改。
>
> *一一    维基百科*

显然在 `Promise` 中 `new Promise()` 返回的对象就是关注点分离中分离出来的那个关注对象。

**要点二：不可变性 ( 值得信任 )**

细心的读者可能会发现，要点一中基于事件监听的反控制反转仍然没有解决最重要的信任问题，收费操作仍旧可以因为第三方 API 的多次调用而被触发且执行多次。幸运的是现在我们拥有 `Promise` 这样强大的机制，才得以让我们从信任危机中解脱出来。所谓不可变性就是：

##### Promise 只能被决议一次，如果代码中试图多次调用 `resolve(..)` 或者 `reject(..)` ，Promise 只会接受第一次决议，决议后就是外部不可变的值，因此任何通过 `then(..)` 注册的回调只会被调用一次。

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

首先我们说下 `then(..)` ，它的第一个参数接受 `promise` 对象中 `resolve(..)` 的值，第二个参数则作为错误处理函数处理在 Promise 中可能发生的错误。

而在 Promise 中有两种错误可能会出现，一种是显式 `reject(..)` 抛出的错误，另一种则是代码自身有错误会被 Promise 捕捉，通过 `then(..)` 中的错误处理函数我们可以接受到它前面 `promise` 对象中出现的错误，而如果在 `then(..)` 接受 `resolve(..)` 值的函数中也出现错误，该错误则会被下一个 `then(..)` 的错误处理函数所接受 ( 有两个前提，第一是要写出这个 `then(..)` 否则该错误最终会在全局被抛出，第二个则是要确保前一个`then(..)` 在它的 Promise 决议后调用的是第一个参数而不是错误处理函数 )。

`catch(..)` 相当于 `then(..)` 中的错误处理函数 ，只是省略了第一个参数。

`finally(..)` 在 Promise 一旦决议后 ( 无论是 `resolve` 还是 `reject` ) 都会被执行。

`then(..)` 、`catch(..)` 、`finally(..)` 都是异步调用，作为事件循环中的微队列任务执行。

### 常见异步模式

在 JS 异步编程的世界里，很多时候我们会遇到因为是异步操作而出现的特定问题，而针对这些问题所提出的解决方案 ( 逻辑代码 ) 就是异步编程的核心，在这里我更愿意把一个问题和对应的解决方案统称为模式，在一种模式中问题总是一样的，但是解决方案却因为 JS 强大的语言特性而变得多样化。下面我将介绍常见的几种异步模式，并通过上文所讲的几种 JS 语法来实现每一种模式下四个版本的逻辑代码。

**并发交互模式**

当我们在同时执行多个异步任务时，这些任务的返回结果到达的时间往往是不确定的，因而会产生以下两种常见的场景：

1. 多个异步任务同时执行，等待所有任务都返回结果后才开始进行下一步的操作。
2. 多个异步任务同时执行，只返回最先完成异步操作的那个任务的结果然后再进行下一步的操作。

**并发协作模式**

有时候我们会遇到在异步任务中处理大量数据的情景，由于会阻塞线程故我们可以将其分割成多个步骤或多批任务，使得其他并发进程 ( 如渲染进程 ) 有机会将自己的运算插入到事件循环队列中交替进行。

**事件监听模式**

采用事件驱动的形式，任务的执行不取决于代码的顺序，而取决于某个事件是否发生，若事件发生则该事件指定的回调函数就会被执行。

**发布 / 订阅模式**

我们假定，存在一个"信号中心"，某个任务执行完成，就向信号中心"发布" ( publish ) 一个信号，其他任务可以向信号中心"订阅" ( subscribe ) 这个信号，从而知道什么时候自己可以开始执行。这种方法与"事件监听"类似，但是明显优于后者，因为我们可以通过查看"消息中心"，了解存在多少信号、每个信号有多少订阅者，从而监控程序的运行。