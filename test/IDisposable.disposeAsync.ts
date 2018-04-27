import IDisposable = require('idisposable')

describe('IDisposable.disposeAsync', () => {
  it('does nothing with null and undefined', async () => {
    await IDisposable.disposeAsync(null)
    await IDisposable.disposeAsync(undefined)
  })

  it('does nothing with non disposable types', async () => {
    const nonDisposables = [false, true, 1, 'x', {}, null, undefined, () => undefined]
    await IDisposable.disposeAsync(nonDisposables)
    await IDisposable.disposeAsync(nonDisposables, nonDisposables)
    await IDisposable.disposeAsync([nonDisposables])
  })

  it('calls dispose()', async () => {
    let disposed = false
    await IDisposable.disposeAsync({
      dispose() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls destroy()', async () => {
    let disposed = false
    await IDisposable.disposeAsync({
      destroy() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls delete()', async () => {
    let disposed = false
    await IDisposable.disposeAsync({
      delete() {
        disposed = true
      }
    })
    expect(disposed).toBe(true)
  })

  it('calls close()', async () => {
    let disposed = false
    await IDisposable.disposeAsync({
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
    await IDisposable.disposeAsync(args)
    await IDisposable.disposeAsync(...args)
    await IDisposable.disposeAsync([args, [args], null, undefined])
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
    await IDisposable.disposeAsync(doDispose)
    await IDisposable.disposeAsync(doDispose, doDispose)
    await IDisposable.disposeAsync(doDispose, [doDispose])
    await IDisposable.disposeAsync(doDispose, [doDispose, doDispose])
    await IDisposable.disposeAsync(doDispose, [doDispose, doDispose, [doDispose, doDispose]])
    await IDisposable.disposeAsync(doDispose, () => [doDispose, doDispose, [doDispose, doDispose]])
    await IDisposable.disposeAsync(new Set([doDispose]))
    expect(disposeCount).toBe(19)
  })

  it('pass errors', async () => {
    expect(async () => {
      await IDisposable.disposeAsync({
        dispose() {
          throw new Error()
        }
      })
    }).toThrowError()
  })

  it('should do nothing if the object has isDisposed = true', async () => {
    await IDisposable.disposeAsync({
      isDisposed: true,
      dispose() {
        throw new Error()
      }
    })
  })

  it('should do nothing if the object has isDisposed() { return true }', async () => {
    await IDisposable.disposeAsync({
      isDisposed() {
        return true
      },
      dispose() {
        throw new Error()
      }
    })
  })

  it('should dispose if isDisposed is a function that returns false', async () => {
    let disposed = false
    await IDisposable.disposeAsync({
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
