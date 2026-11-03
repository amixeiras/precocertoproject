/**
 * Functional Result pattern for clean error handling.
 * Eliminates unhandled exceptions and makes failures explicit in return types.
 * Single Responsibility & Clean Code: Represents either a success or a domain failure.
 */
export class Result<T, E = string> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {
    Object.freeze(this);
  }

  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot retrieve value from a failed Result. Error: ' + JSON.stringify(this._error));
    }
    return this._value as T;
  }

  public getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot retrieve error from a successful Result.');
    }
    return this._error as E;
  }

  public static ok<U, F = string>(value: U): Result<U, F> {
    return new Result<U, F>(true, value, undefined);
  }

  public static fail<U, F = string>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }
}

