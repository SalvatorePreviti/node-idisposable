import IDisposable = require('idisposable')

describe('IDisposable.isDisposable', () => {
  it('should return false for undefined', () => {
    expect(IDisposable.isDisposable(undefined)).toBe(false)
  })

  it('should return false for null', () => {
    expect(IDisposable.isDisposable(null)).toBe(false)
  })

  it('should return false for basic types', () => {
    expect(IDisposable.isDisposable(1 as any)).toBe(false)
    expect(IDisposable.isDisposable(true as any)).toBe(false)
    expect(IDisposable.isDisposable(false as any)).toBe(false)
    expect(IDisposable.isDisposable([] as any)).toBe(false)
    expect(IDisposable.isDisposable(new Date() as any)).toBe(false)
    expect(IDisposable.isDisposable('' as any)).toBe(false)
    expect(IDisposable.isDisposable((() => 3) as any)).toBe(false)
    expect(IDisposable.isDisposable((async () => 3) as any)).toBe(false)
    expect(IDisposable.isDisposable({})).toBe(false)
  })

  it('should return true for simple disposables', () => {
    expect(IDisposable.isDisposable({ dispose() {} })).toBe(true)
    expect(IDisposable.isDisposable({ delete() {} })).toBe(true)
    expect(IDisposable.isDisposable({ destroy() {} })).toBe(true)
    expect(IDisposable.isDisposable({ close() {} })).toBe(true)
  })

  it('should return false for Set and Map', () => {
    expect(IDisposable.isDisposable(new Set())).toBe(false)
    expect(IDisposable.isDisposable(new Map())).toBe(false)
  })
})
