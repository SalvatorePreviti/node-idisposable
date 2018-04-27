import IDisposable = require('idisposable')

describe('IDisposable.dispose', () => {
  it('does nothing with null and undefined', () => {
    IDisposable.dispose(null)
    IDisposable.dispose(undefined)
  })

  it('does nothing with non disposable types', () => {
    const nonDisposables = [false, true, 1, 'x', {}, null, undefined, () => undefined]
    IDisposable.dispose(nonDisposables)
    IDisposable.dispose(nonDisposables, nonDisposables)
    IDisposable.dispose([nonDisposables])
  })

  it('calls dispose()', () => {
    let disposed = false
    IDisposable.dispose({
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls destroy()', () => {
    let disposed = false
    IDisposable.dispose({
      destroy() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls delete()', () => {
    let disposed = false
    IDisposable.dispose({
      delete() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls close()', () => {
    let disposed = false
    IDisposable.dispose({
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
    IDisposable.dispose(args)
    IDisposable.dispose(...args)
    IDisposable.dispose([args, [args], null, undefined])
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
    IDisposable.dispose(doDispose)
    IDisposable.dispose(doDispose, doDispose)
    IDisposable.dispose(doDispose, [doDispose])
    IDisposable.dispose(doDispose, [doDispose, doDispose])
    IDisposable.dispose(doDispose, [doDispose, doDispose, [doDispose, doDispose]])
    IDisposable.dispose(doDispose, () => [doDispose, doDispose, [doDispose, doDispose]])
    IDisposable.dispose(new Set([doDispose]))
    expect(disposeCount).toBe(19)
  })

  it('pass errors', () => {
    expect(() => {
      IDisposable.dispose({
        dispose() {
          throw new Error()
        }
      })
    }).toThrowError()
  })

  it('should do nothing if the object has isDisposed = true', () => {
    IDisposable.dispose({
      isDisposed: true,
      dispose() {
        throw new Error()
      }
    })
  })

  it('should do nothing if the object has isDisposed() { return true }', () => {
    IDisposable.dispose({
      isDisposed() {
        return true
      },
      dispose() {
        throw new Error()
      }
    })
  })

  it('should dispose if isDisposed is a function that returns false', () => {
    let disposed = false
    IDisposable.dispose({
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
