import IDisposable = require('idisposable')

describe('IDisposable.isDisposed', () => {
  it('should return true for undefined', () => {
    expect(IDisposable.isDisposed(undefined)).toBe(true)
  })

  it('should return true for null', () => {
    expect(IDisposable.isDisposed(null)).toBe(true)
  })

  it('should return false for basic types', () => {
    expect(IDisposable.isDisposed(1 as any)).toBe(false)
    expect(IDisposable.isDisposed(true as any)).toBe(false)
    expect(IDisposable.isDisposed(false as any)).toBe(false)
    expect(IDisposable.isDisposed([] as any)).toBe(false)
    expect(IDisposable.isDisposed(new Date() as any)).toBe(false)
    expect(IDisposable.isDisposed('' as any)).toBe(false)
    expect(IDisposable.isDisposed((() => 3) as any)).toBe(false)
    expect(IDisposable.isDisposed(Promise.resolve(1) as any)).toBe(false)
    expect(IDisposable.isDisposed({})).toBe(false)
  })

  it('should return false for simple disposables', () => {
    expect(IDisposable.isDisposed({ dispose() {} })).toBe(true)
    expect(IDisposable.isDisposed({ delete() {} })).toBe(true)
    expect(IDisposable.isDisposed({ destroy() {} })).toBe(true)
    expect(IDisposable.isDisposed({ close() {} })).toBe(true)
    expect(IDisposable.isDisposed(new Set())).toBe(false)
    expect(IDisposable.isDisposed(new Map())).toBe(false)
  })

  it('should return true if isDisposed is true', () => {
    expect(IDisposable.isDisposed({ isDisposed: true })).toBe(false)
  })

  it('should return false if isDisposed is function that returns false', () => {
    expect(
      IDisposable.isDisposed({
        isDisposed() {
          return false
        }
      })
    ).toBe(false)
  })

  it('should return true if isDisposed is function that returns true', () => {
    expect(
      IDisposable.isDisposed({
        isDisposed() {
          return true
        }
      })
    ).toBe(true)
  })
})
