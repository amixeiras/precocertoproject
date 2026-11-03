import { Identifier } from './identifier';

/**
 * Abstract Base Class for Domain Entities in DDD.
 * Entities are defined by their identity, rather than their attributes.
 * Liskov Substitution & Single Responsibility.
 */
export abstract class Entity<TId = string> {
  protected readonly _id: Identifier<TId>;

  protected constructor(id: Identifier<TId> | TId) {
    this._id = id instanceof Identifier ? id : new Identifier(id);
  }

  public get id(): Identifier<TId> {
    return this._id;
  }

  public get idValue(): TId {
    return this._id.value;
  }

  public equals(object?: Entity<TId>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    return this._id.equals(object.id);
  }
}

