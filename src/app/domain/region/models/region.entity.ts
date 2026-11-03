import { Entity } from '@core/domain/entity.base';
import { Coordinates } from './coordinates.vo';

export interface RegionProps {
  name: string;
  state: string;
  centerCoordinates: Coordinates;
  radiusKm: number;
  neighborhoods?: string[];
}

/**
 * Domain Entity representing a Geographic Region.
 * Defines geographic boundaries within which market prices are searched.
 */
export class Region extends Entity<string> {
  private readonly _name: string;
  private readonly _state: string;
  private readonly _centerCoordinates: Coordinates;
  private readonly _radiusKm: number;
  private readonly _neighborhoods: readonly string[];

  constructor(id: string, props: RegionProps) {
    super(id);
    this._name = props.name;
    this._state = props.state;
    this._centerCoordinates = props.centerCoordinates;
    this._radiusKm = props.radiusKm;
    this._neighborhoods = Object.freeze([...(props.neighborhoods ?? [])]);
  }

  public get name(): string {
    return this._name;
  }

  public get state(): string {
    return this._state;
  }

  public get displayName(): string {
    return `${this._name} - ${this._state}`;
  }

  public get centerCoordinates(): Coordinates {
    return this._centerCoordinates;
  }

  public get radiusKm(): number {
    return this._radiusKm;
  }

  public get neighborhoods(): readonly string[] {
    return this._neighborhoods;
  }

  public containsCoordinates(coords: Coordinates): boolean {
    return this._centerCoordinates.distanceTo(coords) <= this._radiusKm;
  }
}

