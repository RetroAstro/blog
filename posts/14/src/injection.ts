import 'reflect-metadata'

type Constructor<T = any> = new (...args: any[]) => T

const Injectable = (): ClassDecorator => _target => {}

class OtherService {
  a = 1
}

@Injectable()
export class TestService {
  constructor(public readonly otherService: OtherService) {}
  testMethod() {
    return this.otherService.a
  }
}

export const Factory = <T>(target: Constructor<T>): T => {
  // 获取所有注入的服务
  const providers = Reflect.getMetadata('design:paramtypes', target)
  const args = providers.map((provider: Constructor) => new provider())
  return new target(...args)
}
