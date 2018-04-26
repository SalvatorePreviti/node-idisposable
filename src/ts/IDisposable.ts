/**
 * A generic disposable interface.
 *
 * @export
 * @interface IDisposable
 */
export interface IDisposable<TDisposeResult = any> {
  /**
   * Disposes this object.
   *
   * @memberof IDisposable
   */
  dispose(): TDisposeResult
}

/**
 * A type that may support disposal.
 *
 * @export
 * @interface GenericDisposableType
 */
export interface IDisposableType<TResult = any> {
  readonly isDisposed?: (() => boolean) | boolean
  dispose?(..._any: any[]): TResult
  destroy?(..._any: any[]): TResult
  delete?(..._any: any[]): TResult
  close?(..._any: any[]): TResult
}

export type DisposableType<TResult = any> = null | undefined | IDisposableType<TResult>

export type DisposableIterableType = Iterable<DisposableType | (() => DisposableType) | (() => Iterable<DisposableType>)>

export type DisposableAsyncType<TResult = any> =
  | PromiseLike<DisposableType<TResult>>
  | PromiseLike<DisposableType<TResult> | DisposableIterableType>
  | DisposableType<PromiseLike<TResult>>
  | (() => PromiseLike<DisposableType<TResult>>)
  | (() => PromiseLike<DisposableType<TResult> | DisposableIterableType>)
  | (() => DisposableType<PromiseLike<TResult>>)

export type DisposableIterableAsyncType =
  | Iterable<DisposableAsyncType>
  | PromiseLike<Iterable<DisposableAsyncType>>
  | (() => Iterable<DisposableAsyncType>)
  | (() => PromiseLike<Iterable<DisposableAsyncType>>)

function ignoreError() {
  return false
}

/**
 * Disposable types and functions
 * @abstract
 * @class
 */
export namespace IDisposable {
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
  export function isDisposable(instance: IDisposableType | null | undefined): boolean {
    return (
      instance !== null &&
      instance !== undefined &&
      typeof instance !== 'function' &&
      (typeof instance.dispose === 'function' ||
        typeof instance.destroy === 'function' ||
        typeof instance.close === 'function' ||
        (typeof instance.delete === 'function' && instance.delete.length === 0))
    )
  }

  /**
   * Returns true if the given instance is null, undefined or has isDisposed true.
   *
   * @export
   * @param {(IDisposable | null | undefined)} instance
   * @returns {boolean} True if the object was disposed.
   * @static
   * @memberof IDisposable
   */
  export function isDisposed(instance: IDisposableType | null | undefined): boolean {
    return (
      instance === null ||
      instance === undefined ||
      (typeof instance.isDisposed === 'function' ? instance.isDisposed() : !!instance.isDisposed)
    )
  }

  export function dispose(instance: null | undefined): false
  export function dispose(instance: DisposableIterableType): any
  export function dispose(instance: DisposableIterableAsyncType): PromiseLike<void>
  export function dispose<TResult>(instance: DisposableType<TResult>): TResult
  export function dispose<TResult>(instance: DisposableAsyncType<TResult>): PromiseLike<TResult>
  export function dispose(...instances: DisposableIterableType[]): any
  export function dispose(...instances: DisposableIterableAsyncType[]): PromiseLike<void>

  /**
   * Disposes the given instance.
   *
   * It accepts:
   *  - An object that has a dispose() method. return instance.dispose();
   *  - An object that has a destroy() method. return instance.destroy();
   *  - An object that has a delete() method with zero parameters. return instance.delete();
   *  - An object that has a close() method. Returns instance.close();
   *  - A function that returns a disposable. The function is executed.
   *  - An Promise that resolves to any other cases.
   *  - An array or iterable of the other cases.
   *
   * @export
   * @param {...*[]} instance The things to dispose
   * @returns {*} Result value. May return a Promise if a Promise is passed.
   * @static
   * @memberof IDisposable
   */
  export function dispose(...instances: any[]): any {
    if (instances.length > 1) {
      return dispose(instances)
    }

    const instance = instances[0]
    if (instance === null || instance === undefined) {
      return false
    }

    if (typeof instance.dispose === 'function') {
      return instance.dispose()
    }

    if (typeof instance.destroy === 'function') {
      return instance.destroy()
    }

    if (typeof instance.delete === 'function' && instance.delete.length === 0) {
      return instance.delete()
    }

    if (typeof instance.close === 'function') {
      return instance.close()
    }

    if (typeof instance.then === 'function') {
      return instance.then(dispose)
    }

    if (typeof instance !== 'object' && typeof instance !== 'function') {
      return false
    }

    if (typeof instance[Symbol.iterator] === 'function') {
      let promises
      for (const item of instance) {
        const dr: any = dispose(item)
        if (typeof dr === 'object' && dr !== null && typeof dr.then === 'function') {
          if (promises === undefined) {
            promises = [dr]
          } else {
            promises.push(dr)
          }
        }
      }
      return promises ? Promise.all(promises).then(() => {}) : undefined
    }

    if (typeof instance === 'function') {
      return dispose(instance())
    }

    return false
  }

  export function tryDispose(instance: null | undefined): false
  export function tryDispose(instance: DisposableIterableType): any
  export function tryDispose(instance: DisposableIterableAsyncType): PromiseLike<void>
  export function tryDispose<TResult>(instance: DisposableType<TResult>): TResult
  export function tryDispose<TResult>(instance: DisposableAsyncType<TResult>): PromiseLike<TResult>
  export function tryDispose(...instances: DisposableIterableType[]): any
  export function tryDispose(...instances: DisposableIterableAsyncType[]): PromiseLike<void>

  /**
   * Tries to dispose the given instance, ignoring any possible error.
   *
   * It accepts:
   *  - An object that has a dispose() method. return instance.dispose();
   *  - An object that has a destroy() method. return instance.destroy();
   *  - An object that has a delete() method with zero parameters. return instance.delete();
   *  - An object that has a close() method. Returns instance.close();
   *  - A function that returns a disposable. The function is executed.
   *  - An Promise that resolves to any other cases.
   *  - An array or iterable of the other cases.
   *
   * @export
   * @param {...*[]} instance The things to dispose
   * @returns {*} Result value. May return a Promise if a Promise is passed.
   * @static
   * @memberof IDisposable
   */
  export function tryDispose(...instances: any[]): any {
    if (instances.length > 1) {
      return dispose(instances)
    }

    const instance = instances[0]
    if (instance === null || instance === undefined) {
      return false
    }

    if (instance === null || instance === undefined) {
      return false
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
      } else if (typeof instance.then === 'function') {
        return instance.then(tryDispose).catch(onIgnoredError || ignoreError)
      }

      if (typeof instance !== 'object' && typeof instance !== 'function') {
        return false
      }

      if (result !== undefined) {
        if (typeof result === 'object' && result !== null) {
          if (typeof result.catch === 'function') {
            return result.catch(onIgnoredError || ignoreError)
          }
          if (typeof result.then === 'function') {
            return result.then((x: any) => x, onIgnoredError || ignoreError)
          }
        }
        return result
      }

      if (typeof instance[Symbol.iterator] === 'function') {
        let promises
        for (const item of instance) {
          const dr: any = tryDispose(item)
          if (typeof dr === 'object' && dr !== null && typeof dr.then === 'function') {
            if (promises === undefined) {
              promises = [dr]
            } else {
              promises.push(dr)
            }
          }
        }
        return promises
          ? Promise.all(promises)
              .then(() => {})
              .catch(onIgnoredError || ignoreError)
          : undefined
      }

      if (typeof instance === 'function') {
        return tryDispose(instance())
      }

      return false
    } catch (error) {
      ;(onIgnoredError || ignoreError)(error)
      return false
    }
  }

  /**
   * Throws an error if the given object is disposed, null or undefined.
   *
   * @param {(DisposableType | null | undefined)} instance
   * @param {string} [name]
   * @returns {(void | never)}
   * @static
   * @memberof IDisposable
   */
  export function throwIfDisposed(instance: DisposableType | null | undefined, name?: string): void | never {
    if (isDisposed(instance)) {
      if (instance === null) {
        throw new TypeError(`${name || instance} is null`)
      }
      if (instance === undefined) {
        throw new TypeError(`${name || instance} is undefined`)
      }
      throw new TypeError(`${name || (instance.constructor && instance.constructor.name) || 'instance'} is disposed`)
    }
  }

  export function using<TDisposable extends DisposableType, TResult extends any>(
    instance: TDisposable,
    functor: (instance: TDisposable) => TResult
  ): TResult

  export function using<TDisposable extends Iterable<DisposableType>, TResult extends any>(
    instance: TDisposable,
    functor: (instance: TDisposable) => TResult
  ): TResult

  /**
   * Executes a functor or a promise and after it finishes disposes the given instance.
   * Instance will be disposes both in case of success or of error.
   * Supports promises.
   *
   * Parameter instance accepts:
   *  - An object that has a dispose() method. return instance.dispose();
   *  - An object that has a destroy() method. return instance.destroy();
   *  - An object that has a delete() method with zero parameters. return instance.delete();
   *  - An object that has a close() method. Returns instance.close();
   *  - An array or iterable of the other cases.
   *
   * @export
   * @param {*} instance The instance to use and dispose at the end
   * @param {(()=>* | Promise<*>)} functor The functor to execute or the promise to await
   * @static
   * @memberof IDisposable
   */
  export function using<TDisposable extends any, TResult extends any>(
    instance: TDisposable,
    functor: ((instance: TDisposable) => TResult) | PromiseLike<TResult>
  ): TResult {
    if (typeof functor !== 'function') {
      return using(instance, (() => functor) as any)
    }
    let status: number = 0
    try {
      let result = functor(instance)
      if (result) {
        if (result.then === 'function') {
          result = result.then(
            (promiseResult: any) => {
              if (status === 1) {
                const disposeResult: any = dispose(instance)
                status = -1
                if (disposeResult && typeof disposeResult.then === 'function') {
                  return disposeResult.then(() => promiseResult, () => promiseResult)
                }
              }
              return promiseResult
            },
            (error: Error) => {
              if (status === 1) {
                const disposeResult: any = tryDispose(instance)
                status = -1
                if (disposeResult && typeof disposeResult.then === 'function') {
                  return disposeResult.then(
                    () => {
                      throw error
                    },
                    () => {
                      throw error
                    }
                  )
                }
              }
              throw error
            }
          )

          status = 1
        }
      }

      if (status === 0) {
        dispose(instance)
      }

      return result
    } catch (error) {
      if (status === 0) {
        tryDispose(instance)
      }
      throw error
    }
  }

  export interface IDisposable<TDisposeResult = any> {
    /**
     * Disposes this object.
     *
     * @memberof IDisposable
     */
    dispose(): TDisposeResult
  }

  export declare const IDisposable: IDisposable

  /**
   * Callback that is executed when tryDispose eats an error.
   * Normally does nothing, useful for logging.
   * @property {((error:*) => *)} onIgnoredError
   * @export
   * @static
   * @memberof IDisposable
   */
  export let onIgnoredError: (error: any) => void = ignoreError
}

Object.defineProperty(IDisposable, 'IDisposable', {
  value: IDisposable,
  writable: false,
  configurable: false,
  enumerable: false
})

export default IDisposable
