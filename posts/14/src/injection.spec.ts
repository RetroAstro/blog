import { expect } from 'chai'
import { Factory, TestService } from './injection'

describe('DI Test', () => {
  it('should equal to 1', () => {
    expect(Factory(TestService).testMethod()).to.equal(1)
  })
})
