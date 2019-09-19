import { expect } from 'chai'
import { connected } from './infer'

describe('connect specs:', () => {
  it('should connect async method', () => {
    const timeToDelay = 2
    expect(connected.delay(timeToDelay).payload).to.equal(`hello ${timeToDelay}`)
  })

  it('should connect sync method', () => {
    const date = new Date()
    expect(connected.setMessage(date).payload).to.equal(date.getMilliseconds())
  })
})
