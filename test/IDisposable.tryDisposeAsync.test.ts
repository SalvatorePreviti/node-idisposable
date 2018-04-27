import IDisposable = require('idisposable')

describe('await IDisposable.tryDisposeAsync', () => {
  it('does nothing with null and undefined', async () => {
    await IDisposable.tryDisposeAsync(null)
    await IDisposable.tryDisposeAsync(undefined)
  })

  it('does nothing with non disposable types', async () => {
    const nonDisposables = [false, true, 1, 'x', {}, null, undefined, () => undefined]
    await IDisposable.tryDisposeAsync(nonDisposables)
    await IDisposable.tryDisposeAsync(nonDisposables, nonDisposables)
    await IDisposable.tryDisposeAsync([nonDisposables])
  })

  it('calls dispose()', async () => {
    let disposed = false
    await IDisposable.tryDisposeAsync({
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls destroy()', async () => {
    let disposed = false
    await IDisposable.tryDisposeAsync({
      destroy() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls delete()', async () => {
    let disposed = false
    await IDisposable.tryDisposeAsync({
      delete() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls close()', async () => {
    let disposed = false
    await IDisposable.tryDisposeAsync({
      close() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('it disposes iterables recursively', async () => {
    let disposeCount = 0
    function doDispose() {
      ++disposeCount
    }
    const args = [{ dispose: doDispose }, { destroy: doDispose }, { delete: doDispose }, { close: doDispose }]
    await IDisposable.tryDisposeAsync(args)
    await IDisposable.tryDisposeAsync(...args)
    await IDisposable.tryDisposeAsync([args, [args], null, undefined])
    expect(disposeCount).toBe(16)
  })

  it('invokes functions', async () => {
    let disposeCount = 0
    function doDispose() {
      return {
        dispose() {
          ++disposeCount
        }
      }
    }
    await IDisposable.tryDisposeAsync(doDispose)
    await IDisposable.tryDisposeAsync(doDispose, doDispose)
    await IDisposable.tryDisposeAsync(doDispose, [doDispose])
    await IDisposable.tryDisposeAsync(doDispose, [doDispose, doDispose])
    await IDisposable.tryDisposeAsync(doDispose, [doDispose, doDispose, [doDispose, doDispose]])
    await IDisposable.tryDisposeAsync(doDispose, () => [doDispose, doDispose, [doDispose, doDispose]])
    await IDisposable.tryDisposeAsync(new Set([doDispose]))
    expect(disposeCount).toBe(19)
  })

  it('should do nothing if the object has isDisposed = true', async () => {
    let disposed = false
    await IDisposable.tryDisposeAsync({
      isDisposed: true,
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBeFalsy()
  })

  it('should do nothing if the object has isDisposed() { return true }', async () => {
    let disposed = false
    await IDisposable.tryDisposeAsync({
      isDisposed() {
        return true
      },
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBeFalsy()
  })

  it('should dispose if isDisposed is a function that returns false', async () => {
    let disposed = false
    await IDisposable.tryDisposeAsync({
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
