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

type FuncName<T> = { [P in keyof T]: T[P] extends Function ? P : never }[keyof T]

type InitialFunc = (module: EffectModule) => { [T in FuncName<EffectModule>]: EffectModule[T] }

type Middle = InitialFunc extends (module: EffectModule) => infer P ? P: never

type Transfer<T> = {
  [P in keyof T]: T[P] extends (input: Promise<infer J>) => Promise<infer K>
  ? (input: J) => K
  : T[P] extends (action: Action<infer J>) => infer K
  ? (input: J) => K
  : never
}

type Connect = (module: EffectModule) => { [T in keyof Transfer<Middle>]: Transfer<Middle>[T] }

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

export const connected: Connected = connect(new EffectModule())
