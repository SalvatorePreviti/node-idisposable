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
    function doDispose() {
      ++disposeCount
    }
    const args = [{ dispose: doDispose }, { destroy: doDispose }, { delete: doDispose }, { close: doDispose }]
    IDisposable.tryDispose(args)
    IDisposable.tryDispose(...args)
    IDisposable.tryDispose([args, [args], null, undefined])
    expect(disposeCount).toBe(16)
  })

  it('invokes functions', () => {
    let disposeCount = 0
    function doDispose() {
      return {
        dispose() {
          ++disposeCount
        }
      }
    }
    IDisposable.tryDispose(doDispose)
    IDisposable.tryDispose(doDispose, doDispose)
    IDisposable.tryDispose(doDispose, [doDispose])
    IDisposable.tryDispose(doDispose, [doDispose, doDispose])
    IDisposable.tryDispose(doDispose, [doDispose, doDispose, [doDispose, doDispose]])
    IDisposable.tryDispose(doDispose, () => [doDispose, doDispose, [doDispose, doDispose]])
    IDisposable.tryDispose(new Set([doDispose]))
    expect(disposeCount).toBe(19)
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
