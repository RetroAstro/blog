前言
-----

很早以前就尝试过使用 TypeScript 来进行日常编码，但自己对静态类型语言的了解并不深入，再加上 TypeScript 的类型系统有着一定的复杂度，因此感觉自己并没有发挥好这门语言的优势，使代码变得更具**可读性**与**可维护性**。于是这几天便想着好好研究下这门语言，希望能够总结出一些特别的语言特性与实用技巧。

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

巧用 never 类型

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

控制反转 ( Inversion of Control ) 与依赖注入 ( Dependency Injection ) 是面向对象编程中十分重要的思想和法则。维基百科上给出的解释是 IoC 能够降低计算机代码之间的耦合度，DI 代表的则是在一个对象被创建时，注入该对象所依赖的所有对象的过程。前端框架 Angular 与基于 Node.js 的后端框架 Nest 都引用了这一思想。对于这两个概念的具体阐述在这里就不再展开，但读者可以看看这两篇文章 [[1]](https://segmentfault.com/a/1190000008626680#articleHeader2) [[2]](https://juejin.im/post/5c16004ae51d45485a098ef8#heading-2) 。下面我们基于 Angular 5 以前的 [Dependency Injection](https://github.com/mgechev/injection-js) 来实现简版的控制反转与依赖注入。

首先让我们来编写一段相关的测试代码：

```ts
import { expect } from 'chai'
import { Injectable, createInjector } from './injection'

class Engine {}

class DashboardSoftware {}

@Injectable()
class Dashboard {
  constructor(public software: DashboardSoftware) {}
}

@Injectable()
class Car {
  constructor(public engine: Engine) {}
}

@Injectable()
class CarWithDashboard {
  constructor(public engine: Engine, public dashboard: Dashboard) {}
}

class NoAnnotations {
  constructor(_secretDependency: any) {}
}

describe('injector', () => {
  it('should instantiate a class without dependencies', () => {
    const injector = createInjector([Engine])
    const engine = injector.get(Engine)
    expect(engine instanceof Engine).to.be.true
  })

  it('should resolve dependencies based on type information', () => {
    const injector = createInjector([Engine, Car])
    const car = injector.get(Car)
    expect(car instanceof Car).to.be.true
    expect(car.engine instanceof Engine).to.be.true
  })

  it('should resolve nested dependencies based on type information', () => {
    const injector = createInjector([CarWithDashboard, Engine, Dashboard, DashboardSoftware])
    const _CarWithDashboard = injector.get(CarWithDashboard)
    expect(_CarWithDashboard.dashboard.software instanceof DashboardSoftware).to.be.true
  })

  it('should cache instances', () => {
    const injector = createInjector([Engine])
    const e1 = injector.get(Engine)
    const e2 = injector.get(Engine)
    expect(e1).to.equal(e2)
  })

  it('should show the full path when no provider', () => {
    const injector = createInjector([CarWithDashboard, Engine, Dashboard])
    expect(() => injector.get(CarWithDashboard)).to.throw('No provider for DashboardSoftware!')
  })

  it('should throw when no type', () => {
    expect(() => createInjector([NoAnnotations])).to.throw(
      'Make sure that NoAnnotations is decorated with Injectable.'
    )
  })

  it('should throw when no provider defined', () => {
    const injector = createInjector([])
    expect(() => injector.get('NonExisting')).to.throw('No provider for NonExisting!')
  })
})
```

可以看到我们要实现的核心功能有三个：

* 根据提供的类创建 IoC 容器并且能够管理类之间的依赖关系
* 在通过 IoC 容器获取类的实例对象时注入相关的依赖对象
* 实现多级依赖与处理边缘情况

首先来实现最简单的 `@Injectable` 装饰器：

```ts
export const Injectable = (): ClassDecorator => target => {
  Reflect.defineMetadata('Injectable', true, target)
}
```

然后我们来实现根据提供的 provider 类创建能够管理类之间依赖关系的 IoC 容器：

```ts
abstract class ReflectiveInjector implements Injector {
  abstract get(token: any): any
  static resolve(providers: Provider[]): ResolvedReflectiveProvider[] {
    return providers.map(resolveReflectiveProvider)
  }
  static fromResolvedProviders(providers: ResolvedReflectiveProvider[]): ReflectiveInjector {
    return new ReflectiveInjector_(providers)
  }
  static resolveAndCreate(providers: Provider[]): ReflectiveInjector {
    const resolvedReflectiveProviders = ReflectiveInjector.resolve(providers)
    return ReflectiveInjector.fromResolvedProviders(resolvedReflectiveProviders)
  }
}

class ReflectiveInjector_ implements ReflectiveInjector {
  _providers: ResolvedReflectiveProvider[]
  keyIds: number[]
  objs: any[]
  constructor(_providers: ResolvedReflectiveProvider[]) {
    this._providers = _providers

    const len = _providers.length

    this.keyIds = new Array(len)
    this.objs = new Array(len)

    for (let i = 0; i < len; i++) {
      this.keyIds[i] = _providers[i].key.id
      this.objs[i] = undefined
    }
  }
  // ...
}

function resolveReflectiveProvider(provider: Provider): ResolvedReflectiveProvider {
  return new ResolvedReflectiveProvider_(
    ReflectiveKey.get(provider),
    resolveReflectiveFactory(provider)
  )
}

function resolveReflectiveFactory(provider: Provider): ResolvedReflectiveFactory {
  let factoryFn: Function
  let resolvedDeps: ReflectiveDependency[]
  
  factoryFn = factory(provider)
  resolvedDeps = dependenciesFor(provider)

  return new ResolvedReflectiveFactory(factoryFn, resolvedDeps)
}

function factory<T>(t: Type<T>): (args: any[]) => T {
  return (...args: any[]) => new t(...args)
}

function dependenciesFor(type: Type<any>): ReflectiveDependency[] {
  const params = parameters(type)
  return params.map(extractToken)
}

function parameters(type: Type<any>) {
  if (noCtor(type)) return []

  const isInjectable = Reflect.getMetadata('Injectable', type)
  const res = Reflect.getMetadata('design:paramtypes', type)

  if (!isInjectable) throw noAnnotationError(type)

  return res ? res : []
}

export const createInjector = (providers: Provider[]): ReflectiveInjector_ => {
  return ReflectiveInjector.resolveAndCreate(providers) as ReflectiveInjector_
}
```

从上面的代码不难看出当 IoC 容器创建时会将提供的每个类以及该类所依赖的其他类作为 `ResolvedReflectiveProvider_` 的实例对象存储在容器中，对外返回的则是容器对象 `ReflectiveInjector_` 。

接下来让我们来实现通过 IoC 容器获取类的实例对象的逻辑：

```ts
class ReflectiveInjector_ implements ReflectiveInjector {
  // ...
  get(token: any): any {
    return this._getByKey(ReflectiveKey.get(token))
  }
  private _getByKey(key: ReflectiveKey, isDeps?: boolean) {
    for (let i = 0; i < this.keyIds.length; i++) {
      if (this.keyIds[i] === key.id) {
        if (this.objs[i] === undefined) {
          this.objs[i] = this._new(this._providers[i])
        }
        return this.objs[i]
      }
    }

    let res = isDeps ? (key.token as Type).name : key.token

    throw noProviderError(res)
  }
  _new(provider: ResolvedReflectiveProvider) {
    const resolvedReflectiveFactory = provider.resolvedFactory
    const factory = resolvedReflectiveFactory.factory

    let deps = resolvedReflectiveFactory.dependencies.map(dep => this._getByKey(dep.key, true))

    return factory(...deps)
  }
}
```

可以看到当我们调用 `injector.get()` 方法时 IoC 容器会根据给定类查找对应的 `ResolvedReflectiveProvider_` 对象，找到之后便会在实例化给定类之前注入该类依赖的所有类的实例对象，最后再返回给定类的实例化对象。

现在我们再回头看上文的代码，多级依赖的功能其实早已实现。虽然在初始化 loC 容器时我们只能找到某个类的相关依赖，无法再通过依赖类找到更深层级的依赖，但是我们对提供的每个类遍历执行了相同的操作，因此很自然的就实现了多个类之间的依赖。

对于边缘情况我们也做了相应的处理，比如提供的 provider 类为空数组，类并没有被 `@Injectable` 装饰器修饰，提供的类并不完整等。对应上文的代码为：

```ts
let res = isDeps ? (key.token as Type).name : key.token

throw noProviderError(res)
```

```ts
if (!isInjectable) throw noAnnotationError(type)
```

至此，控制反转与依赖注入的核心功能就实现的差不多了，剩下的就是一些接口定义代码，还有就是 `ReflectiveKey` 类的实现，它的大致作用其实就是基于 ES6 中的 Map 存储 provider 类。感兴趣的读者可以看看完整的[代码示例](https://github.com/RetroAstro/cosmos-blog/tree/master/posts/14)。

------

参考内容：

[深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)

[TypeScript 高级技巧](https://juejin.im/post/5cffb431f265da1b7401f466)

[关于依赖注入](https://juejin.im/post/5c16004ae51d45485a098ef8#heading-2)

[IoC & DI](https://segmentfault.com/a/1190000008626680#articleHeader2)

[Dependency Injection](https://github.com/mgechev/injection-js) 