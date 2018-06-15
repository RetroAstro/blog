> #### ECMAScript中的变量值类型

+ ##### 基本类型   Number, String, Boolean, Undefined, Null

+ ##### 引用类型   Object, Array, Function, Date, RegExp

在将一个值赋给变量时解析器必须确定这个值是基本类型值还是引用类型值。

基本数据类型是按值访问的, 因为可以操作保存在变量中的实际的值。

引用类型则不同, 它的值是保存在堆内存中的对象, 而JavaScript不允许直接访问内存中的位置。

所以在操作对象时实际上是在操作对象的引用, 即引用类型的值是按引用访问的。



##### 基本类型的特点 :

1.值不会改变 2. 不可以添加属性和方法

```javascript
var name = "BarryAllen";

name.substring(5); //"Allen"
console.log(name) //BarryAllen  

name.identity = "Flash";
console.log(name.identity) //undefined 

name.skill = function() {
    console.log("Running very fast.")
}
name.skill(); //name.skill is not a function
```



##### 引用类型的特点 : 

1.值可以被修改 2. 可以添加属性和方法

````javascript
var obj = {};
obj.name = "BarryAllen";

var change = obj;
change.name = "OliverQueen";
console.log(obj.name); //OliverQueen

obj.identity = "Flash";
console.log(obj.identity) //Flash

obj.skill = function() {
    console.log("Running very fast.")
}
obj.skill(); //Running very fast.
````

从上面的代码不难看出在进行复制变量的时候基本类型进行的是类似创建副本的操作, 而引用类型则是对指向对象的指针的复制所以在复制操作结束后两个变量将引用同一个对象。因此改变其中一个变量就会影响到另一个变量。



##### 参数的传递

ECMAScript中规定所有函数的参数都是按值传递的。

````javascript
function setAge(obj) {
    obj.age = 18;
    obj = {};
    obj.age = 25;
}
var person = {}
setAge(person);
console.log(person.age) //18
````

在函数内部重新声明了对象并修改了` obj.age` 的值, 若参数传递是按引用传递的那么` person.age` 应该输出25, 但事实却不是这样。由于此时对象是按值传递, 故原始的引用仍然未变。事实上在函数被执行完毕后这个新创建的局部对象就会被立即销毁。



##### 检测类型

* typeof           用于检测基本类型
* instanceof    在检测引用类型时, 用于判断它是什么类型的对象( 因为所有引用类型的值都是Object的实例 )。

````javascript
var num = 786;
var bol = true;
var name = "Violet";
console.log(typeof num +"~"+ typeof bol +"~"+ typeof name); //number~boolean~string

var arr = [];
var func = new Function();
console.log(arr instanceof Array) //true
console.log(func instanceof Function) //true
````

> #### 执行环境(Execution Context)与作用域

执行环境也被称为执行上下文, 每一个执行环境中都有一个关联的变量对象, 环境中定义的所有变量和函数都保存在这个对象中。

在Javascript中有三种代码的执行环境 ：

* 全局执行环境  --- 默认的最外围的执行环境, 在浏览器中其关联的变量对象被认为是window对象 
* 函数执行环境  --- 每当调用一个函数时, 一个新的执行上下文就会被创建出来 
* Eval --- 接受字符串作为参数, 并将其作为javascript代码去运行, eval函数并不会创建新的作用域 

每次新创建的一个执行上下文会被添加到作用域链的顶部，有时也称为执行或调用栈。浏览器总是运行位于作用域链顶部的当前执行上下文。一旦完成，当前执行上下文将从栈顶被移除并且将控制权归还给之前的执行上下文。

下面来详细讲解一下函数执行环境的建立过程：

* ##### 建立阶段 

  * 建立arguments对象, 参数, 函数, 变量   (  注意创建的顺序 ！)
  * 建立作用域链
  * 确定this的值

* ##### 代码执行阶段

  * 变量赋值
  * 函数引用
  * 执行其他代码



````javascript
(function (obj) {
  console.log(typeof obj); //number
  console.log(typeof foo); //function
  console.log(typeof boxer); //undefined
  var foo = "Mashics";
   function foo() {
      document.write("This is a function.");
   }
  var boxer = function() {
      document.write("I am a boxer.");
   }
})(666);
````

这段代码充分说明了函数执行环境建立再到执行的过程, 即首先是参数的创建, 然后再是在函数体内去寻找函数的声明, 最后是变量声明。值得注意的是当javascript引擎在寻找函数声明时首先找到了`foo` 这个函数, 因而之后定义的变量则不会重新覆盖其属性, 引擎接下来就开始查找具体代码段里面的变量声明并添加到关联变量对象的属性中,并将其赋值为`undefined` , 因而像变量提升这种经典的问题又可以从执行环境创建过程的角度来回答并解决了。



##### 作用域链与闭包

###### 当代码在一个环境中执行时, 会创建变量对象的一个作用域链, 其用途就是保证对执行环境有权访问的所有变量和函数的有序访问。作用域的前端永远是当前执行代码所在环境的变量对象, 而全局执行环境的变量对象始终是作用域链中的最后一个对象。在进行变量查找的时候就是通过作用域链一级一级的向上查找。而闭包中的一部分特性则是由作用域链这个重要特性决定的。

````javascript
var outer = "Margin";
function foo() {
  var mider = "Padding";
    function baz() {
       var inner = "Content";
       console.log( "Gotcha! " + outer + " and " + mider + " . " );
    }
  return baz;
}
var fn = foo();
fn(); //Gotcha! Margin and Padding . 
console.log(inner); //inner is not defined.
````

###### 这段代码是一个简单的闭包, 但它却说明了作用域链中最重要的特性：

###### ！！即内部环境可以通过作用域链访问所有外部环境, 但外部环境不能访问内部环境中的任何变量和函数 ！！



PS : 另外再解释一下几个容易令人混淆或者说是难懂的概念。 

* ##### 变量对象与活动对象

  * 变量对象在执行环境的建立阶段被创建, 在未进入执行阶段之前其中的属性不能被访问, 而当其进入执行阶段后变量对象变为活动对象, 接下来就可以进行执行阶段中的步骤了。

* ##### 作用域与作用域链

  * 作用域与执行环境是两个完全不同的概念, javascript代码执行的过程其实有两个阶段即代码编译阶段和代码执行阶段, 作用域是在编译阶段创建的一套规则, 用来管理引擎如何在当前作用域以及嵌套的子作用域中根据标识符名称进行变量查找, 而执行上下文的创建则是在代码执行阶段进行的。作用域链是由一系列变量对象组成, 我们可以在这个单向通道中, 查询变量对象中的标识符, 这样就可以访问到上一层作用域中的变量了。



> #### this详解

在理解this的绑定过程之前, 必须要理解调用栈和调用位置这两个概念, 因为this的绑定完全取决于从调用栈中分析出的调用位置。而调用位置就在当前正在执行的函数的前一个调用中。

1. 调用栈：为了达到当前执行位置所调用的所有函数。
2. 调用位置：函数在代码中被调用的位置( 而不是声明的位置 )。

````javascript
function head() {
   //当前调用栈为head
   console.log("first");
   body(); //body的调用位置 --> head
}
function body() {
   //当前调用栈为head -> body
   console.log("second");
   footer(); //footer的调用位置 --> body
}
function footer() {
  //当前的调用栈为head -> body -> footer
   console.log("third");
}
head();  //head的调用位置 --> 全局作用域
````

##### this绑定规则：

1. 默认绑定
2. 隐式绑定
3. 显示绑定
4. new绑定

* #### 默认绑定

当函数独立调用, 即直接使用不带任何修饰的函数引用进行调用时this使用默认绑定, 此时this指向全局对象。

````javascript
var a = 2;
function foo() {
   console.log( this.a );
}
foo(); // 2
````

* #### 隐式绑定

当函数引用有上下文对象时, 隐式绑定规则会把函数调用中的this绑定到这个上下文对象。

````javascript
var obj = {
   a : 2,
   foo : foo
}
function foo() {
   console.log( this.a );
}
obj.foo(); //2
````

因为调用`foo()`时`this`被绑定到`obj`, 因此这里的`this` 相当于`obj` 。

##### 隐式丢失

当隐式绑定的函数被显式或者隐式赋值时会丢失绑定对象, 从而把this绑定到全局对象上或者undefined上。而在回调函数中的this绑定会丢失也正是因为参数传递其实就是一种隐式赋值。

````javascript
var a = "Global";
var obj = {
   a : 2,
   foo : foo
}
function foo() {
   console.log( this.a );
}
var bar = obj.foo;
bar(); //Global ->显示赋值

function doFoo(fn) {
   fn();
}
doFoo( obj.foo ); //Global ->隐式赋值

setTimeout(obj.foo, 1000); //Global ->内置函数中的隐式赋值,类似于下面这段代码

function setTimeout(fn, delay) {
  //等待delay毫秒
  fn();
}
````

* #### 显式绑定


通过` Function.prototype` 中的`call` , `apply` , `bind` 来直接指定`this`的绑定对象。

`call`和`apply`都是立即执行的函数, 并且接受参数的形式不同。

` bind`则是创建一个新的包装函数并且返回, 而不是执行。

````javascript
var obj = {
   a : 2
}
function foo() {
   console.log( this.a );
}
var bar = function() {
   foo.call(obj);
}
bar(); //2  -->硬绑定

function calculate(b, c) {
   console.log(this.a, b, c);
   return (this.a * b) + c;
}
var excute = function() {
   return calculate.apply(obj, arguments); //apply方法可接受参数并将变量传递到下层函数
}
excute(5,10); //2 5 10 20

var baz = calculate.bind(obj); //bind方法将this绑定到obj对象上
baz(8,5); //2 8 5 21
````

* #### new绑定

在JavaScript中构造函数只是一些使用new操作符时被调用的普通函数, 即发生构造函数调用时会执行以下操作：

1. 创建一个全新的对象
2. 新对象被执行[[Prototype]]连接
3. 新对象会绑定到函数调用的this
4. 若函数没有返回对象, new表达式中的函数调用会自动返回这个新对象


````javascript
function Foo(a) {
    this.a = a;
}
var bar = new Foo(6);
console.log( bar.a ); //6
````

* #### 优先级

#####    new绑定 > 显式绑定 > 隐式绑定 > 默认绑定

----



* #### this与箭头函数

ES6中的箭头函数并不使用this的四种标准原则,它是根据外层( 函数或者全局 )作用域来决定this。

先来看下一种常见的this绑定丢失情景：

````javascript
function foo() {
   setTimeout(function() {
     console.log( this.a );
   },1000);
}
var obj = {
   a : 2
}
foo.call(obj); //undefined 
````

这里由于`setTimeout`中发生的隐式丢失因而this应用了默认规则, 因而输出`undefined` 。那么如何将this绑定到我们想要的` obj`对象上呢？

````javascript
var obj = {
   a : 2
}
function foo() {
   setTimeout( () => {
      console.log( this.a );
   },1000);
}
foo.call(obj) //2
````

显然箭头函数中的`this` 在词法上继承了`foo` , 因而它会捕获调用时`foo`的this, 即this被绑定到obj对象上。

----

参考书籍：《你不知道的JavaScript》(上) 《JavaScript高级程序设计》









