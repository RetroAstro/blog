> ### 对象的深浅拷贝

对象的深拷贝与浅拷贝的区别：

* 浅拷贝：仅仅复制对象的引用, 而不是对象本身。
* 深拷贝：把复制的对象所引用的全部对象都复制一遍

##### 浅拷贝的实现：

````javascript
var obj = {
   age : 18,
   person : {
     hobby : "movie",
     skill : "Java"
   }
}
//方法一
function shallowClone(initial) {
   var obj = {};
   for( var i in initial ) {
      obj[i] = initial[i];
   }
   return obj;
}
//方法二
var newobj = Object.assign({}, obj);
console.log(newobj);

var clone = shallowClone(obj);
console.log(clone.age); //18
clone.person.skill = "JavaScript";
console.log(obj.person.skill); //JavaScript
````

##### 深拷贝的实现：

````javascript
var obj = {
   age : 18,
   person : {
     hobby : "movie",
     skill : "Java"
   }
}

/* 方法一：
 * 这种方法能正确处理的对象只有 Number, String, Boolean, Array, 扁平对象。
 * 即那些能够被 json 直接表示的  数据结构。RegExp对象是无法通过这种方式深拷贝。
 */
function deepCopy(initial) {
   var obj = {};
   obj = JSON.parse(JSON.stringify(initial));
   return obj;
}
var copy = deepCopy(obj);
console.log(copy);

//方法二 (递归拷贝)
function deepClone(initial, final) {
    var obj = final || {};
    for( var i in initial ) {
       var prop = initial[i];
       //避免相互引用导致死循环
       if( prop === obj ) {
           continue;
       }
       if( typeof prop === 'object' ) {
           obj[i] = ( prop.constructor === Array ) ? prop : Object.create(prop);
       }else {
           obj[i] = prop;
       }
    }
  return obj;
}
var now = {}
deepClone(obj, now);
now.person.hobby = "sport";
console.log(obj.person.hobby); //movie
````



> ### 函数的防抖与节流

我们经常会遇到这样一种情景, 用户高频率触发一些JS事件。但是在一定时间内执行代码的次数太多往往会导致浏览器的性能下降甚至造成卡顿的现象, 所以我们可以把js执行代码的次数控制在合理的范围内, 在实现相同效果的情况下使页面交互变得更加流畅。这就是函数防抖和节流要做的事情。

##### 函数防抖：

````javascript
//debounce
function debounce(func, context) {
   clearTimeout(func.setTime);
   func.setTime = setTimeout(() => {
      func.call(context); 
   }, 300);
}

window.onscroll = function() {
   debounce(doSomething);
}

function doSomething() {
   console.log("函数防抖");
   //执行一些耗费性能的事件...
}
````

从上面代码可以看出函数防抖的核心思想是在调用定时器执行某个函数之前首先清除这个定时器。当函数多次被调用时, 每一次都会将之前的定时器清除, 即只有在执行函数的请求停止了一段时间之后才会真正执行函数。

##### 函数节流：

````javascript
//throttle
function throttle(func, time, context) {
   let start = Date.now();
   return function() {
      if (Date.now() - start > time && time > 0) {
          func.call(context);
          start = Date.now();
      }
   }
}
window.onscroll = throttle(doSomething, 300);

function doSomething() {
   console.log("函数节流");
   //执行一些耗费性能的事件...
}
````

函数节流的思想是设置一个执行函数间隔时间`time`, 当多次触发某个事件时便将执行函数的频率降低到`time`。

这样一来就达到了我们所想要的效果了。

````javascript
/*函数节流的另一种实现方式*/
var flag = true;

function throttle(fn, context) {
   if(!flag) {
      return;
   }
   flag = false;
   setTimeout(() => {
      fn.call(context);
      flag = true;
   }, 300)
}

window.onscroll = function() {
   throttle(doSomething);
}

function doSomething() {
   console.log("函数节流");
   //执行一些耗费性能的事件...
}
````

值得注意的是这两种方法在具体浏览器中的运行下效果有所不同。函数防抖当触发频率过高时函数基本停止执行, 而函数节流则是按照一定的频率执行js事件。

````javascript
/* @防抖与节流混合版 
--- 有第三个参数时为节流效果, 若没有则为防抖效果 ---
*/
var tdmixer = function(fn, delay, reqDelay, context) {
    var timer = null;
    var start;
    return function() {
        var args = arguments;
        var current = +new Date();
        clearTimeout(timer);
        if ( !start ) {
            start = current;
        }
        if ( current - start >= reqDelay ) {
            fn.apply(context, args);
            start = current;
        }else {
            timer = setTimeout( function() {
                fn.apply(context, args);
            }, delay);
        }
    }
}

window.onscroll = tdmixer(doSomething, 100, 300);

function doSomething() {
   console.log("This is a mix version.");
   //执行一些耗费性能的事件...
}
````



> ### 函数柯里化

它与函数绑定紧密相关, 用于创建已经设置好了一个或多个参数的函数, 其具体做法时使用一个闭包返回一个函数, 当函数被调用时, 返回的函数还需要设置一些传入的参数。

###### 柯里化的三个作用 :  1.参数复用  2. 提前返回  3.延迟计算

````javascript
function curry(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
        var innerargs = Array.prototype.slice.call(arguments);
        var finalargs = args.concat(innerargs);
        return fn.apply(null, finalargs);
    }
}

function addAll(x,y,z) {
    return x + y + z;
}
var excute = curry(addAll,5,10);
excute(50); //65

````

ES5中的bind方法也用到过柯里化, 下面是简单的函数绑定的实现。

````javascript
function bind(fn, context) {
    var args = Array.prototype.slice.call(arguments, 2);
    return function() {
        var innerargs = Array.prototype.slice.call(arguments);
        var finalargs = args.concat(innerargs);
        return fn.apply(context, finalargs);
    }
}
var handler = {
    message: "PIPI",
    handleClick(name) {
        console.log(name + "and" + this.message);
    }
}
var excute = bind(handler.handleClick, handler);
excute("POP");  //POPandPIPI
````

> ### 图片预加载与懒加载

##### 1. 预加载：

顾名思义, 图片的预加载就是将图片预先加载到浏览器的本地缓存中, 当需要时直接从本地加载图片到页面中, 如此一来就很好的提高了用户的体验。但缺点是增加了服务器端的开销。

##### 2. 懒加载：

也叫延迟加载, 即延迟加载图片或者当符合某些条件时才开始加载图片, 它与预加载相反, 其作用是对服务器端的性能优化, 减少请求数或延迟请求数, 从而达到缓解服务器端压力的效果。

--- preload code ---

````javascript

//对预加载图片进行一些回调事件处理
function preLoadImg(url, callback) {
    var img = new Image();
    if ( img.complete ) { //若图片已经在本地缓存, 则直接调用回调函数
        callback.call(img);
        return;
    }
    img.onload = function() { //图片下载完之后异步调用callback
        img.onload = null;
        callback.call(img);
    }
    img.src = url; 
}

//大量图片预加载
var arr = ['pic1.png', 'pic2.png', 'pic3.png'];
function fn() { console.log('Do something...') };

function preLoadImages(urls, callback) {
    var wrap = Array.prototype.slice.call(arguments, 0, 1);
    var urls = [].concat.apply([], wrap);  //将其转化为一维数组
    for ( var i = 0; i < urls.length; i++) { 
        var img = new Image(); 
        img.onload = function() {
            callback.call(img);
        }
        img.src = urls[i];   
    }
}
preLoadImages(arr, fn);

````

--- lazyload code --- 

````javascript
//懒加载的实现
var lazyload = {
    //初始化
    init() {
        this.container = document.querySelector('Container'); //获取容器元素
        this.images = this.getImages();
        this.update();
        this.bindEvent();
    },
    //获取图片
    getImages() {
        var arr = [];
        var images = this.container.querySelectorAll('img');
        images.forEach( (img) => {
            arr.push(img);
        });
        return arr;
    },
    //加载图片
    update() {
        if ( !this.images.length ) { return };
        var i  = this.images.length;
        for ( i--; i >= 0; i-- ) {
            if ( this.couldShow(i) ) {
                this.images[i].src = this.images[i].getAttribute('data-src'); //需事先设置路径
                this.images.splice(i, 1);
            }
        }
    },
    //判断图片是否在可视区域并赋予src值
    couldShow(i) {
        var img = this.images[i];
        scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        scrollBottom = scrollTop + document.documentElement.clientHeight;
        imgTop = this.rectY(img);
        imgBottom = imgTop + img.offsetHeight;
        if ( imgBottom < scrollBottom && imgBottom > scrollTop 
        || imgTop > scrollTop && imgTop < scrollBottom ) {
            return true;
        }else {
            return false;
        }
    },
    //递归调用获取图片顶部到整个页面的最顶端的距离
    rectY(el) {
        if ( el.offsetParent ) {
            return el.offsetTop + this.rectY(el.offsetParent);
        }else {
            return el.offsetTop;
        }
    },
    //事件绑定
    bindEvent() {
        var that = this;
        that.on(window, "scroll", () => {
          var fn = tdmixer(that.update, 100, 300, that); //函数节流
          fn();
        } ) 
    },
    //监听
    on(el, type, fn) {
        if ( el.addEventListener ) {
            el.addEventListener(type, fn);
        }else {
            el.attachEvent("on" + type, fn);
        }
    }
}

lazyload.init();

//上文所给出的混合节流函数
var tdmixer = function(fn, delay, reqDelay, context) {
    var timer = null;
    var start;
    return function() {
        var args = arguments;
        var current = +new Date();
        clearTimeout(timer);
        if ( !start ) {
            start = current;
        }
        if ( current - start >= reqDelay ) {
            fn.apply(context, args);
            start = current;
        }else {
            timer = setTimeout( function() {
                fn.apply(context, args);
            }, delay);
        }
    }
}
````

从上面的两段代码可以看出, 图片预加载实现起来要简单许多, 当然两种功能都有很多种不同的实现方法, 有简单的也有复杂的, 这都需要根据具体的情景来编写代码。预加载一次性就加载需要的图片到本地储存从而提高了用户的体验却也加大了服务器端的负担,  而懒加载则需要根据某些具体的条件来判断何时向服务器端请求图片数据, 虽然减少了服务器端的开销, 但具体实现的步骤也变得更加复杂。所以在实际情况下两者最好混合使用且用在正确的地方上最为合适。 







