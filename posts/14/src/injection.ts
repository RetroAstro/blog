import 'reflect-metadata'

interface Type<T = object> extends Function {
  new (...args: any[]): T
}

interface Provider extends Type<any> {}

class KeyRegistry {
  private _allKeys = new Map<Object, ReflectiveKey>()
  get(token: Object): ReflectiveKey {
    if (this._allKeys.has(token)) {
      return this._allKeys.get(token)
    }

    const newKey = new ReflectiveKey(token, ReflectiveKey.numberOfKeys)
    
    this._allKeys.set(token, newKey)
    return newKey
  }
  get numberOfKeys(): number {
    return this._allKeys.size
  }
}

const _globalKeyRegistry = new KeyRegistry()

class ReflectiveKey {
  constructor(public token: Object, public id: number) {
    if (!token) {
      throw new Error('Token must be defined!')
    }
  }
  static get(token: Object): ReflectiveKey {
    return _globalKeyRegistry.get(token)
  }
  static get numberOfKeys(): number {
    return _globalKeyRegistry.numberOfKeys
  }
}

class ReflectiveDependency {
  constructor(public key: ReflectiveKey) {}
}

class ResolvedReflectiveFactory {
  constructor(
    public factory: Function,
    public dependencies: ReflectiveDependency[]
  ) {}
}

interface ResolvedReflectiveProvider {
  key: ReflectiveKey
  resolvedFactories: ResolvedReflectiveFactory[]
}

class ResolvedReflectiveProvider_ implements ResolvedReflectiveProvider {
  constructor(public key: ReflectiveKey, public resolvedFactories: ResolvedReflectiveFactory[]) {}
  get resolvedFactory(): ResolvedReflectiveFactory {
    return this.resolvedFactories[0]
  }
}

abstract class Injector {
  abstract get<T>(token: Type<T>): T
}

abstract class ReflectiveInjector implements Injector {
  abstract get(token: any): any
  static resolve(providers: Provider[]): ResolvedReflectiveProvider[] {
    const resolved = providers.map(resolveReflectiveProvider)
    return resolved
  }
  static fromResolvedProviders(providers: ResolvedReflectiveProvider[]): ReflectiveInjector {
    return new ReflectiveInjector_(providers)
  }
  static resolveAndCreate(providers: Provider[]): ReflectiveInjector {
    const ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers)
    return ReflectiveInjector.fromResolvedProviders(ResolvedReflectiveProviders)
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
    const ResolvedReflectiveFactory = provider.resolvedFactories[0]
    const factory = ResolvedReflectiveFactory.factory

    let deps = ResolvedReflectiveFactory.dependencies.map(dep => this._getByKey(dep.key, true))

    return factory(...deps)
  }
}

function resolveReflectiveProvider(provider: Provider): ResolvedReflectiveProvider {
  return new ResolvedReflectiveProvider_(
    ReflectiveKey.get(provider),
    [resolveReflectiveFactory(provider)]
  )
}

function factory<T>(t: Type<T>): (args: any[]) => T {
  return (...args: any[]) => new t(...args)
}

function resolveReflectiveFactory(provider: Provider): ResolvedReflectiveFactory {
  let factoryFn: Function
  let resolvedDeps: ReflectiveDependency[]
  
  factoryFn = factory(provider)
  resolvedDeps = _dependenciesFor(provider)

  return new ResolvedReflectiveFactory(factoryFn, resolvedDeps)
}

function _dependenciesFor(type: Type<any>): ReflectiveDependency[] {
  const params = parameters(type)
  return params.map(_extractToken)
}

function parameters(type: Type<any>) {
  if (noCtor(type)) return []

  const isInjectable = Reflect.getMetadata('Injectable', type)
  const res = Reflect.getMetadata('design:paramtypes', type)

  if (!isInjectable) throw noAnnotationError(type)

  return res ? res : []
}

function noCtor(type: any): boolean {
  return type
    .toString()
    .replace(/\s/ig, '')
    .includes(`function${type.name}()`)
}

function _extractToken(token: any) {
  return new ReflectiveDependency(ReflectiveKey.get(token))
}

function noProviderError(token: any) {
  return `No provider for ${token}!`
}

function noAnnotationError(type: any) {
  return `Make sure that ${type.name} is decorated with Injectable.`
}

export const Injectable = (): ClassDecorator => target => {
  Reflect.defineMetadata('Injectable', true, target)
}

export const createInjector = (providers: Provider[]): ReflectiveInjector_ => {
  return ReflectiveInjector.resolveAndCreate(providers) as ReflectiveInjector_
}
