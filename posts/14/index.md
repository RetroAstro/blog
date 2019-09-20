**混合类 ( mixins )**

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

**嵌套接口类型**

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

**typeof - 获取变量的类型** 

```ts
const colors = {
  red: 'red',
  blue: 'blue'
}

// type res = { red: string; blue: string }
type res = typeof colors
```

**keyof - 获取类型的键**

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

**in - 遍历键名**

```ts
interface Square {
  kind: 'square'
  size: number
}

// type res = (radius: number) => { kind: 'square'; size: number }
type res = (radius: number) => { [T in keyof Square]: Square[T] }
```

**条件类型**

```ts
type isBool<T> = T extends boolean ? true : false

// type t1 = false
type t1 = isBool<number>

// type t2 = true
type t2 = isBool<false>
```

**字典类型**

```ts
interface Dictionary<T> {
  [index: string]: T
}

const data: Dictionary<number> = {
  a: 3,
  b: 4,
}
```

**使用 const enum 维护常量列表**

```ts
// 使用 const enum 维护常量
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

**Partial & Pick**

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

**infer - 延迟推断类型**

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

**never 类型**  

```ts
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]

interface Part {
  id: number
  name: string
  subparts: Part[]
  updatePart(newName: string): void
}

type T40 = FunctionPropertyNames<Part>  // "updatePart"
type T41 = NonFunctionPropertyNames<Part>  // "id" | "name" | "subparts"
```

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
type OmitUser = Omit<User, "id">
```

装饰器

Reflect Metadata

控制反转与依赖注入

协变与逆变
