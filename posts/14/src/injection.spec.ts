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

  it('should throw when no all providers', () => {
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
