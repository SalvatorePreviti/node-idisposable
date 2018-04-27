/**
 * A generic disposable interface.
 *
 * @export
 * @interface IDisposable
 */
export interface IDisposable {
  /**
   * Disposes this object.
   *
   * @memberof IDisposable
   */
  dispose(): void
}

/**
 * A generic disposable interface with an asynchronous dispose.
 *
 * @export
 * @interface IDisposable
 */
export interface IDisposableAsync {
  /**
   * Disposes this object, asynchronously.
   *
   * @returns {Promise}
   * @memberof IDisposable
   */
  dispose(): Promise<void>
}

const symErrorIgnored = Symbol('#error-ignored')

function doNothing() {}

/**
 * Disposable types and functions
 * @abstract
 * @class
 */
export namespace IDisposable {
  /**
   * Returns true if the given instance is an object with a then function.
   *
   * @export
   * @param {*} instance The instance to check
   * @returns {boolean} True if the given object is a promise, false if not.
   */
  export function isPromiseLike(instance: any): boolean {
    return typeof instance === 'object' && instance !== null && typeof instance.then === 'function'
  }

  /**
   * Returns true if the given instance is an object with a then and a catch function.
   *
   * @export
   * @param {*} instance The instance to check
   * @returns {boolean} True if the given object is a promise, false if not.
   */
  export function isPromise(instance: any): boolean {
    return typeof instance === 'object' && instance !== null && typeof instance.then === 'function' && typeof instance.catch === 'function'
  }

  /**
   * Returns true if the given object is a disposable object.
   * An object is disposable if it has a dispose(...), destroy(...) or delete() function.
   *
   * @export
   * @param {*} instance
   * @returns {boolean}
   * @static
   * @memberof IDisposable
   */
  export function isDisposable(instance: any): boolean {
    return (
      instance !== null &&
      typeof instance === 'object' &&
      (typeof instance.dispose === 'function' ||
        typeof instance.destroy === 'function' ||
        typeof instance.close === 'function' ||
        (typeof instance.delete === 'function' && instance.delete.length === 0))
    )
  }

  /**
   * Returns true if the given instance is undefined, is null,
   * has a isDisposed property that returns true or a function isDisposed() that returns true
   *
   * @export
   * @param {(IDisposable | null | undefined)} instance
   * @returns {boolean} True if the object was disposed.
   * @static
   * @memberof IDisposable
   */
  export function isDisposed(instance: any): boolean {
    if (instance === null || instance === undefined) {
      return true
    }
    const isDisposed = instance.isDisposed
    if (isDisposed) {
      return typeof isDisposed !== 'function' || !!instance.isDisposed()
    }
    return false
  }

  /**
   * Throws an error if the given object is disposed, null or undefined.
   *
   * @param {*} instance
   * @param {string} [name]
   * @returns {(void | never)}
   * @static
   * @memberof IDisposable
   */
  export function throwIfDisposed(instance: any, name?: string): void | never {
    if (instance === null) {
      throw new TypeError(`${name || instance} is null`)
    }
    if (instance === undefined) {
      throw new TypeError(`${name || instance} is undefined`)
    }

    if (isDisposed(instance)) {
      throw new TypeError(`${name || (instance.constructor && instance.constructor.name) || 'instance'} is disposed`)
    }
  }

  /**
   * Disposes the given objects.
   * Accepts:
   *  - Objects with a dispose() method.
   *  - Objects with a destroy() method.
   *  - Objects with a delete() method with no arguments.
   *  - Objects with a close() method.
   *  - functions that return disposables or iterable of disposables.
   *  - iterables of disposables or functions that return disposables..
   *
   * @export
   * @param {...any[]} instances
   */
  export function dispose(...instances: any[]): void {
    for (const instance of instances) {
      if (isDisposed(instance)) {
        continue
      }

      if (typeof instance.dispose === 'function') {
        instance.dispose()
      } else if (typeof instance.destroy === 'function') {
        instance.destroy()
      } else if (typeof instance.delete === 'function' && instance.delete.length === 0) {
        instance.delete()
      } else if (typeof instance.close === 'function') {
        instance.close()
      } else if (typeof instance[Symbol.iterator] === 'function') {
        for (const item of instance) {
          if (item !== instance) {
            dispose(item)
          }
        }
      } else if (typeof instance === 'function') {
        dispose(instance())
      } else if (typeof instance.then === 'function') {
        tryDisposeAsync(instance)
      }
    }
  }

  /**
   * Disposes the given objects, ignoring any error.
   * Accepts:
   *  - Objects with a dispose() method.
   *  - Objects with a destroy() method.
   *  - Objects with a delete() method with no arguments.
   *  - Objects with a close() method.
   *  - functions that return disposables or iterable of disposables.
   *  - iterables of disposables or functions that return disposables..
   *
   * @export
   * @param {...any[]} instances
   */
  export function tryDispose(...instances: any[]): void {
    for (const instance of instances) {
      if (isDisposed(instance)) {
        continue
      }

      try {
        let result
        if (typeof instance.dispose === 'function') {
          result = instance.dispose()
        } else if (typeof instance.destroy === 'function') {
          result = instance.destroy()
        } else if (typeof instance.delete === 'function' && instance.delete.length === 0) {
          result = instance.delete()
        } else if (typeof instance.close === 'function') {
          result = instance.close()
        } else if (typeof instance[Symbol.iterator] === 'function') {
          for (const item of instance) {
            if (item !== instance) {
              tryDispose(item)
            }
          }
        } else if (typeof instance === 'function') {
          tryDispose(instance())
        } else if (typeof instance.then === 'function') {
          tryDisposeAsync(instance)
        }
        if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
          result.then(doNothing, ignoreError)
        }
      } catch (error) {
        ignoreError(error)
      }
    }
  }

  /**
   * Disposes the given object when after the functor get called.
   *
   * @export
   * @template TDisposable The disposable type
   * @template TResult The functor result
   * @param {TDisposable} instance
   * @param {((this: TDisposable, instance: TDisposable) => TResult)} functor
   * @returns {TResult}
   */
  export function using<TDisposable, TResult>(
    instance: TDisposable,
    functor: ((this: TDisposable, instance: TDisposable) => TResult)
  ): TResult {
    let result
    try {
      result = functor.call(instance, instance)
      dispose(instance)
      return result
    } catch (error) {
      tryDispose(instance)
      throw error
    }
  }

  /**
   * Disposes the given objects, asynchronously.
   * Accepts:
   *  - Objects with a dispose() method.
   *  - Objects with a destroy() method.
   *  - Objects with a delete() method with no arguments.
   *  - Objects with a close() method.
   *  - Promises that resolves disposables.
   *  - functions that return disposables or iterable of disposables or promises that resolves to disposables.
   *  - iterables of disposables or functions that return disposables or promises that resolves to disposables.
   *
   * @export
   * @param {...any[]} instances
   * @returns {Promise<void>} The promise to be awaited.
   */
  export function disposeAsync(...instances: any[]): Promise<void> {
    const promises = []
    for (const instance of instances) {
      if (isDisposed(instance)) {
        continue
      }
      let result
      if (typeof instance.dispose === 'function') {
        result = instance.dispose()
      } else if (typeof instance.destroy === 'function') {
        result = instance.destroy()
      } else if (typeof instance.delete === 'function' && instance.delete.length === 0) {
        result = instance.delete()
      } else if (typeof instance.close === 'function') {
        result = instance.close()
      } else if (typeof instance.then === 'function') {
        result = instance.then(disposeAsync)
      } else if (typeof instance[Symbol.iterator] === 'function') {
        for (const item of instance) {
          if (item !== instance) {
            const d = disposeAsync(item)
            if (typeof d === 'object' && d !== null && typeof d.then === 'function') {
              promises.push(d)
            }
          }
        }
      } else if (typeof instance === 'function') {
        result = disposeAsync(instance())
      }

      if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
        promises.push(result)
      }
    }

    return Promise.all(promises).then(doNothing)
  }

  /**
   * Disposes the given objects, asynchronously, ignoring any error.
   * Accepts:
   *  - Objects with a dispose() method.
   *  - Objects with a destroy() method.
   *  - Objects with a delete() method with no arguments.
   *  - Objects with a close() method.
   *  - Promises that resolves disposables.
   *  - functions that return disposables or iterable of disposables or promises that resolves to disposables.
   *  - iterables of disposables or functions that return disposables or promises that resolves to disposables.
   *
   * @export
   * @param {...any[]} instances
   * @returns {Promise<void>} The promise to be awaited.
   */
  export function tryDisposeAsync(...instances: any[]): Promise<void> {
    const promises = []
    for (const instance of instances) {
      try {
        if (isDisposed(instance)) {
          continue
        }
        let result
        if (typeof instance.dispose === 'function') {
          result = instance.dispose()
        } else if (typeof instance.destroy === 'function') {
          result = instance.destroy()
        } else if (typeof instance.delete === 'function' && instance.delete.length === 0) {
          result = instance.delete()
        } else if (typeof instance.close === 'function') {
          result = instance.close()
        } else if (typeof instance.then === 'function') {
          result = instance.then(tryDisposeAsync, ignoreError)
        } else if (typeof instance[Symbol.iterator] === 'function') {
          for (const item of instance) {
            if (item !== instance) {
              const d = tryDisposeAsync(item)
              if (typeof d === 'object' && d !== null && typeof d.then === 'function') {
                promises.push(d)
              }
            }
          }
        } else if (typeof instance === 'function') {
          result = tryDisposeAsync(instance())
        }

        if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
          promises.push(result.then(doNothing, ignoreError))
        }
      } catch (error) {
        ignoreError(error)
      }
    }

    return Promise.all(promises).then(doNothing, ignoreError)
  }

  /**
   * Disposes the given object asynchronously when after the given functor completes.
   *
   * @export
   * @template TDisposable The disposable type
   * @template TResult The functor result
   * @param {TDisposable} instance
   * @param {((this: TDisposable, instance: TDisposable) => TResult)} functor
   * @returns {TResult}
   */
  export async function usingAsync<TDisposable extends any, TResult extends any>(
    instance: TDisposable,
    functor: ((this: TDisposable, instance: TDisposable) => TResult | PromiseLike<TResult>) | PromiseLike<TResult>
  ): Promise<TResult> {
    try {
      instance = await instance
      if (typeof instance === 'function') {
        instance = await instance()
      }
      let result
      if (typeof functor === 'function') {
        result = await functor.apply(instance, instance)
      } else {
        result = await functor
      }
      return result
    } finally {
      await disposeAsync(instance)
    }
  }

  /**
   * A generic disposable interface.
   *
   * @export
   * @interface IDisposable
   */
  export interface IDisposable {
    /**
     * Disposes this object.
     *
     * @memberof IDisposable
     */
    dispose(): void
  }

  /**
   * A generic disposable interface with an asynchronous dispose.
   *
   * @export
   * @interface IDisposable
   */
  export interface IDisposableAsync {
    /**
     * Disposes this object, asynchronously.
     *
     * @returns {Promise}
     * @memberof IDisposable
     */
    dispose(): Promise<void>
  }

  /**
   * Ignores the given error.
   * Called by tryDispose and tryDisposeAsync.
   *
   * @export
   * @param {*} error
   */
  export function ignoreError(error: any): void {
    if (error !== null && error !== undefined && onIgnoredError && onIgnoredError !== doNothing) {
      try {
        if (!error[symErrorIgnored]) {
          onIgnoredError(error)
          error[symErrorIgnored] = true
        }
      } catch (_error) {
        // Do nothing
      }
    }
  }

  /**
   * Callback that is executed when tryDispose eats an error.
   * Normally does nothing, can be set to something for logging.
   * @property {((error:*) => *)} onIgnoredError
   * @export
   * @static
   * @memberof IDisposable
   */
  export let onIgnoredError: (error: any) => void = doNothing
}

export default IDisposable
