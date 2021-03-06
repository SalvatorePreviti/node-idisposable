import IDisposable = require('idisposable')

describe('IDisposable.tryDispose', () => {
  it('does nothing with null and undefined', () => {
    IDisposable.tryDispose(null)
    IDisposable.tryDispose(undefined)
  })

  it('does nothing with non disposable types', () => {
    const nonDisposables = [false, true, 1, 'x', {}, null, undefined, () => undefined]
    IDisposable.tryDispose(nonDisposables)
    IDisposable.tryDispose(nonDisposables, nonDisposables)
    IDisposable.tryDispose([nonDisposables])
  })

  it('calls dispose()', () => {
    let disposed = false
    IDisposable.tryDispose({
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls destroy()', () => {
    let disposed = false
    IDisposable.tryDispose({
      destroy() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls delete()', () => {
    let disposed = false
    IDisposable.tryDispose({
      delete() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls close()', () => {
    let disposed = false
    IDisposable.tryDispose({
      close() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('it disposes iterables recursively', () => {
    let disposeCount = 0
    const disposeSet = new Set<number>()
    function doDispose(n: number) {
      return () => {
        disposeSet.add(n)
        ++disposeCount
      }
    }
    const args = [{ dispose: doDispose(1) }, { destroy: doDispose(2) }, { delete: doDispose(3) }, { close: doDispose(4) }]
    const args1 = [{ dispose: doDispose(5) }, { destroy: doDispose(6) }, { delete: doDispose(7) }, { close: doDispose(8) }]
    const args2 = [{ dispose: doDispose(9) }, { destroy: doDispose(10) }, { delete: doDispose(11) }, { close: doDispose(12) }]
    IDisposable.dispose(args)
    IDisposable.dispose(...args)
    IDisposable.dispose([args, [args, args1], null, undefined, [args, args2]])
    expect(Array.from(disposeSet).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(disposeCount).toBe(20)
  })

  it('invokes functions', () => {
    let disposeCount = 0
    const disposeSet = new Set<number>()
    function doDispose(n: number) {
      return () => {
        return {
          dispose() {
            expect(disposeSet.has(n)).toEqual(false)
            disposeSet.add(n)
            ++disposeCount
          }
        }
      }
    }
    const marray = [doDispose(5)]
    IDisposable.dispose(doDispose(1))
    IDisposable.dispose(doDispose(2), doDispose(3))
    IDisposable.dispose(doDispose(4), null, undefined, marray, marray)
    IDisposable.dispose(doDispose(6), [doDispose(7), doDispose(8)])
    IDisposable.dispose(doDispose(9), [doDispose(10), doDispose(11), [doDispose(12), doDispose(13)]])
    IDisposable.dispose(doDispose(14), () => [doDispose(15), doDispose(16), [doDispose(17), doDispose(18)]])
    IDisposable.dispose(new Set([doDispose(19)]))
    expect(disposeCount).toBe(19)
    expect(Array.from(disposeSet).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
  })

  it('should do nothing if the object has isDisposed = true', () => {
    let disposed = false
    IDisposable.tryDispose({
      isDisposed: true,
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBeFalsy()
  })

  it('should do nothing if the object has isDisposed() { return true }', () => {
    let disposed = false
    IDisposable.tryDispose({
      isDisposed() {
        return true
      },
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBeFalsy()
  })

  it('should dispose if isDisposed is a function that returns false', () => {
    let disposed = false
    IDisposable.tryDispose({
      isDisposed() {
        return false
      },
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })
})
