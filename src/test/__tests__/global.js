import { globalTypes } from '../utils'

const globalObj = {}
const resolveGlobalObjMock = jest.fn(() => globalObj)
jest.setMock('../../utils/globalScope', {resolveGlobalObj: resolveGlobalObjMock})

describe(`global`, () => {
  it(`Should make a call to resolve the global object`, () => {
    require('../global')
    expect(resolveGlobalObjMock).toHaveBeenCalled()
    const globalKeys = Object.keys(globalObj)
    Object.values(globalTypes).map(name => expect(globalKeys.includes(name)).toBe(true))
  })
})
