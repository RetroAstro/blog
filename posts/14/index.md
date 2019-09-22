前言
-----

很早以前就尝试过使用 TypeScript 来进行日常编码，但自己对静态类型语言的了解并不深入，再加上 TypeScript 的类型系统有着一定的复杂度，因此感觉自己并没有发挥好这门语言的优势，将代码写得更具**可读性**与**可维护性**。于是这几天便想着好好研究下这门语言，希望能够总结出一些特别的语言特性与高级技巧。

操作符
-----

typeof - 获取变量的类型

```ts
const colors = {
  red: 'red',
  blue: 'blue'
}

// type res = { red: string; blue: string }
type res = typeof colors
```

keyof - 获取类型的键

```ts
const data = {
  a: 3,
  hello: 'world'
}

// 类型保护
function get<T extends object, K extends keyof T>(o: T, name: K): T[K] {
  return o[name]
}

get(data, 'a') // 3
get(data, 'b') // Error
```

组合 typeof 与 keyof - 捕获键的名称

```ts
const colors = {
  red: 'red',
  blue: 'blue'
}

type Colors = keyof typeof colors

let color: Colors // 'red' | 'blue'
color = 'red' // ok
color = 'blue' // ok
color = 'anythingElse' // Error
```

in - 遍历键名

```ts
interface Square {
  kind: 'square'
  size: number
}

// type res = (radius: number) => { kind: 'square'; size: number }
type res = (radius: number) => { [T in keyof Square]: Square[T] }
```

特殊类型
-----

嵌套接口类型

```ts
interface Producer {
  name: string
  cost: number
  production: number
}

interface Province {
  name: string
  demand: number
  price: number
  producers: Producer[]
}

let data: Province = {
  name: 'Asia',
  demand: 30,
  price: 20,
  producers: [
    { name: 'Byzantium', cost: 10, production: 9 },
    { name: 'Attalia', cost: 12, production: 10 },
    { name: 'Sinope', cost: 10, production: 6 }
  ]
}
```

```ts
interface Play {
  name: string
  type: string
}

interface Plays {
  [key: string]: Play
}

let plays: Plays = {
  'hamlet': { name: 'Hamlet', type: 'tragedy' },
  'as-like': { name: 'As You Like It', type: 'comedy' },
  'othello': { name: 'Othello', type: 'tragedy' }
}
```

条件类型

```ts
type isBool<T> = T extends boolean ? true : false

// type t1 = false
type t1 = isBool<number>

// type t2 = true
type t2 = isBool<false>
```

字典类型

```ts
interface Dictionary<T> {
  [index: string]: T
}

const data: Dictionary<number> = {
  a: 3,
  b: 4,
}
```

infer - 延迟推断类型

```ts
type ParamType<T> = T extends (param: infer P) => any ? P : T

interface User {
  name: string
  age: number
}

type Func = (user: User) => void

type Param = ParamType<Func> // Param = User
type AA = ParamType<string> // string
```

```ts
type ElementOf<T> = T extends Array<infer E> ? E : never

type TTuple = [string, number]

type ToUnion = ElementOf<TTuple> // string | number
```

常用技巧
-----

使用 const enum 维护常量列表

```ts
const enum STATUS {
  TODO = 'TODO',
  DONE = 'DONE',
  DOING = 'DOING'
}

function todos(status: STATUS): Todo[] {
  // ...
}

todos(STATUS.TODO)
```

Partial & Pick

```ts
type Partial<T> = {
  [P in keyof T]?: T[P]
}

type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

interface User {
  id: number
  age: number
  name: string
}

// type PartialUser = { id?: number; age?: number; name?: string }
type PartialUser = Partial<User>

// type PickUser = { id: number; age: number }
type PickUser = Pick<User, 'id'|'age'>
```

Exclude & Omit  

```ts
type Exclude<T, U> = T extends U ? never : T

// type A = 'a'
type A = Exclude<'x' | 'a', 'x' | 'y' | 'z'>
```

```ts
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface User {
  id: number
  age: number
  name: string
}

// type PickUser = { age: number; name: string }
type OmitUser = Omit<User, 'id'>
```

巧用 never 

```ts
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]

interface Part {
  id: number
  name: string
  subparts: Part[]
  updatePart(newName: string): void
}

type T40 = FunctionPropertyNames<Part>  // 'updatePart'
type T41 = NonFunctionPropertyNames<Part>  // 'id' | 'name' | 'subparts'
```

混合类 ( mixins )

```ts
// 所有 mixins 都需要
type Constructor<T = {}> = new (...args: any[]) => T

// 添加属性的混合例子
function TimesTamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    timestamp = Date.now()
  }
}

// 添加属性和方法的混合例子
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActivated = false
    activate() {
      this.isActivated = true
    }
    deactivate() {
      this.isActivated = false
    }
  }
}

// 简单的类
class User {
  name = ''
}

// 添加 TimesTamped 的 User
const TimestampedUser = TimesTamped(User)

// 添加 TimesTamped 和 Activatable 的类
const TimestampedActivatableUser = TimesTamped(Activatable(User))

// 使用组合类
const timestampedUserExample = new TimestampedUser()
console.log(timestampedUserExample.timestamp)

const timestampedActivatableUserExample = new TimestampedActivatableUser()
console.log(timestampedActivatableUserExample.timestamp)
console.log(timestampedActivatableUserExample.isActivated)
```

类型转换
-----

下面来求解一道 LeetCode 上关于 TypeScript 的面试题，题目的大致内容为有一个叫做 EffectModule 的类，它的实现如下：

```ts
interface Action<T> {
  payload?: T
  type: string
}

class EffectModule {
  count = 1
  message = 'hello!'
  delay(input: Promise<number>) {
    return input.then(i => ({
      payload: `hello ${i}!`,
      type: 'delay'
    }))
  }
  setMessage(action: Action<Date>) {
    return {
      payload: action.payload.getMilliseconds(),
      type: 'set-message'
    }
  }
}
```

现在有一个 connect 函数接收 EffectModule 类的实例对象作为参数，且该函数会返回新的对象，相关的实现如下：

```ts
const connect: Connect = _m => ({
  delay: (input: number) => ({
    type: 'delay',
    payload: `hello ${input}`
  }),
  setMessage: (input: Date) => ({
    type: 'set-message',
    payload: input.getMilliseconds()
  })
})

type Connected = {
  delay(input: number): Action<string>
  setMessage(action: Date): Action<number>
}

const connected: Connected = connect(new EffectModule())
```

可以看到在调用 connect 函数之后，返回的新对象只包含 EffectModule 的同名方法，并且方法的类型签名改变了：

```ts
asyncMethod<T, U>(input: Promise<T>): Promise<Action<U>>  变成了
asyncMethod<T, U>(input: T): Action<U> 
```

```ts
syncMethod<T, U>(action: Action<T>): Action<U>  变成了
syncMethod<T, U>(action: T): Action<U>
```

现在就需要我们来编写 `type Connect = (module: EffectModule) => any` 使得最终的编译能够顺利通过。不难看出，这个题目主要考察两点：

* 从类中挑选出函数
* 巧用 infer 进行类型转换

下面是我解这道题的答案：

```ts
type FuncName<T> = { [P in keyof T]: T[P] extends Function ? P : never }[keyof T]

type Middle = { [T in FuncName<EffectModule>]: EffectModule[T] }

type Transfer<T> = {
  [P in keyof T]: T[P] extends (input: Promise<infer J>) => Promise<infer K>
  ? (input: J) => K
  : T[P] extends (action: Action<infer J>) => infer K
  ? (input: J) => K
  : never
}

type Connect = (module: EffectModule) => { [T in keyof Transfer<Middle>]: Transfer<Middle>[T] }
```

控制反转与依赖注入
-----

**装饰器** 

```ts
function classDecorator(): ClassDecorator {
  return (target) => {}
}

function propsDecorator(): PropertyDecorator {
  return (target, key) => {}
}

function methodDecorator(): MethodDecorator {
  return (target, key, descriptor) => {}
}

@classDecorator()
export class SomeClass {
  @propsDecorator()
  name: string
  @methodDecorator()
  someMethod() {}
}
```

**Reflect Metadata** 

Reflect Metadata 的 API 只能用于类或者类的属性、方法上。

```ts
// 获取属性类型
Reflect.getMetadata('design:type', target, key)

// 获取函数参数类型
Reflect.getMetadata('design:paramtypes', target, key)

// 获取函数返回值类型
Reflect.getMetadata('design:returntype', target, key)

// 用于自定义 metadataKey
Reflect.defineMetadata('key', 'value', target, key)
```
