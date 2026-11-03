/**
 * Base Identifier for Domain Entities.
 * Enforces identity type safety across bounded contexts.
 */
export class Identifier<T> {
  constructor(private readonly _value: T) {
    Object.freeze(this);
  }

  public get value(): T {
    return this._value;
  }

  public equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof Identifier)) {
      return false;
    }
    return id.value === this._value;
  }

  public toString(): string {
    return String(this._value);
  }
}

