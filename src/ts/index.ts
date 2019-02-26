/**
 * A generic disposable interface.
 *
 * @export
 * @interface IDisposable
 */
interface IDisposable {
  /**
   * Disposes this object.
   *
   * @memberof IDisposable
   */
  dispose(): void
}

const symErrorIgnored = Symbol('#error-ignored')

function empty() {}

/**
 * A base abstract disposable class
 */
abstract class IDisposable {
  public dispose() {}
}

/**
 * Disposable types and functions
 * @abstract
 * @class
 */
namespace IDisposable {
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
   * Returns true if the given instance is an object with a then function.
   *
   * @export
   * @param {*} instance The instance to check
   * @returns {boolean} True if the given object is a promise, false if not.
   */
  export function isPromiseLike<T = any>(instance: any): instance is PromiseLike<T> {
    return typeof instance === 'object' && instance !== null && typeof instance.then === 'function'
  }

  /**
   * Returns true if the given instance is an object with a then and a catch function.
   *
   * @export
   * @param {*} instance The instance to check
   * @returns {boolean} True if the given object is a promise, false if not.
   */
  export function isPromise<T = any>(instance: any): instance is Promise<T> {
    return typeof instance === 'object' && instance !== null && typeof instance.then === 'function' && typeof instance.catch === 'function'
  }

  /**
   * Returns true if the given object is a disposable object.
   * An object is disposable if it has a dispose(...), destroy(...) or delete() function.
   *
   * @export
   * @param {*} instance The object instance to check
   * @returns {boolean} True if the given object is disposable, false if not.
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
   * @param {(IDisposable | null | undefined)} instance The instance to check
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
   * @param {*} instance The instance to check
   * @param {string} [name] A name used for debugging purposes
   * @returns {(void | never)} undefined
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
   * @param {...any[]} instances The objects to dispose
   * @returns {void}
   */
  export function dispose(...instances: any[]): void {
    const seen = new Set()
    const enqueue = (item: any) => {
      if ((typeof item === 'function' || (typeof item === 'object' && item !== null)) && !seen.has(item) && !isDisposed(item)) {
        instances.push(item)
      }
    }

    for (let i = 0; i < instances.length; ++i) {
      const instance = instances[i]
      if (seen.has(instance)) {
        continue
      }
      if (typeof instance !== 'function' && (typeof instance !== 'object' || instance === null)) {
        continue
      }
      seen.add(instance)
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
          enqueue(item)
        }
      } else if (typeof instance === 'function') {
        enqueue(instance())
      } else if (typeof instance.then === 'function') {
        seen.add(instance)
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
   * @param {...any[]} instances The instances to dispose.
   * @returns {void}
   */
  export function tryDispose(...instances: any[]): void {
    const seen = new Set()
    const enqueue = (item: any) => {
      if ((typeof item === 'function' || (typeof item === 'object' && item !== null)) && !seen.has(item) && !isDisposed(item)) {
        instances.push(item)
      }
    }

    for (let i = 0; i < instances.length; ++i) {
      const instance = instances[i]
      try {
        if (typeof instance !== 'function' && (typeof instance !== 'object' || instance === null)) {
          continue
        }
        if (seen.has(instance)) {
          continue
        }
        seen.add(instance)
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
        } else if (typeof instance[Symbol.iterator] === 'function') {
          for (const item of instance) {
            enqueue(item)
          }
        } else if (typeof instance === 'function') {
          enqueue(instance())
        } else if (typeof instance.then === 'function') {
          tryDisposeAsync(instance)
        }
        if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
          result.then(empty, ignoreError)
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
   * @param {TDisposable} instance The instance to be disposed after the functor terminates
   * @param {((this: TDisposable, instance: TDisposable) => TResult)} functor The functor to execute.
   * @returns {TResult}
   */
  export function using<TDisposable, TResult>(
    instance: TDisposable,
    functor: (this: TDisposable, instance: TDisposable) => TResult
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
  export async function disposeAsync(...instances: any[]): Promise<void> {
    const promises = []
    const seen = new Set()

    const enqueue = (item: any) => {
      if ((typeof item === 'function' || (typeof item === 'object' && item !== null)) && !seen.has(item) && !isDisposed(item)) {
        instances.push(item)
      }
    }

    for (let i = 0; i < instances.length; ++i) {
      const instance = instances[i]
      if (typeof instance !== 'function' && (typeof instance !== 'object' || instance === null)) {
        continue
      }
      if (seen.has(instance)) {
        continue
      }
      seen.add(instance)
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
        result = instance.then(enqueue)
      } else if (typeof instance[Symbol.iterator] === 'function') {
        for (const item of instance) {
          enqueue(item)
        }
      } else if (typeof instance === 'function') {
        enqueue(instance())
      }
      if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
        promises.push(result)
      }
    }

    await Promise.all(promises)
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
   * @param {...any[]} instances The instance to dispose.
   * @returns {Promise<void>} The promise to be awaited.
   */
  export async function tryDisposeAsync(...instances: any[]): Promise<void> {
    try {
      const promises = []
      const seen = new Set()

      const enqueue = (item: any) => {
        if ((typeof item === 'function' || (typeof item === 'object' && item !== null)) && !seen.has(item) && !isDisposed(item)) {
          instances.push(item)
        }
      }
      for (let i = 0; i < instances.length; ++i) {
        const instance = instances[i]
        try {
          if (typeof instance !== 'function' && (typeof instance !== 'object' || instance === null)) {
            continue
          }
          if (seen.has(instance)) {
            continue
          }
          seen.add(instance)
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
            result = instance.then(enqueue, ignoreError)
          } else if (typeof instance[Symbol.iterator] === 'function') {
            for (const item of instance) {
              enqueue(item)
            }
          } else if (typeof instance === 'function') {
            enqueue(instance())
          }
          if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
            promises.push(result.then(empty, ignoreError))
          }
        } catch (error) {
          ignoreError(error)
        }
      }
      await Promise.all(promises)
    } catch (error) {
      ignoreError(error)
    }
  }

  /**
   * Disposes the given object asynchronously when after the given functor completes.
   *
   * @export
   * @template TDisposable The disposable type
   * @template TResult The functor result
   * @param {TDisposable} instance The instance to dispose
   * @param {((this: TDisposable, instance: TDisposable) => TResult)} functor The functor to wait
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
        result = await functor.call(instance, instance)
      } else {
        result = await functor
      }
      return result
    } finally {
      await disposeAsync(instance)
    }
  }

  /**
   * Ignores the given error.
   * Called by tryDispose and tryDisposeAsync.
   *
   * @export
   * @param {*} error The error to ignore.
   */
  export function ignoreError(error: any): void {
    if (error !== null && error !== undefined && onIgnoredError && onIgnoredError !== empty) {
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
   * @property {((error:*) => *)} onIgnoredError The callback that will be executed when an error is ignored
   * @export
   * @static
   * @memberof IDisposable
   */
  export let onIgnoredError: (error: any) => void = empty
}

export = IDisposable
