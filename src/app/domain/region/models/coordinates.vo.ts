import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export interface CoordinatesProps {
  latitude: number;
  longitude: number;
}

/**
 * Value Object representing Geographic Coordinates (Latitude, Longitude).
 * Immutability, self-validation, and domain calculations (Haversine distance).
 */
export class Coordinates extends ValueObject<CoordinatesProps> {
  private constructor(props: CoordinatesProps) {
    super(props);
  }

  public get latitude(): number {
    return this.props.latitude;
  }

  public get longitude(): number {
    return this.props.longitude;
  }

  public static create(latitude: number, longitude: number): Result<Coordinates> {
    if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
      return Result.fail('Latitude must be a valid number between -90 and 90.');
    }

    if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
      return Result.fail('Longitude must be a valid number between -180 and 180.');
    }

    return Result.ok(new Coordinates({ latitude, longitude }));
  }

  /**
   * Calculates the Haversine distance in kilometers between these coordinates and another.
   */
  public distanceTo(other: Coordinates): number {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRadians(other.latitude - this.latitude);
    const dLon = toRadians(other.longitude - this.longitude);

    const lat1 = toRadians(this.latitude);
    const lat2 = toRadians(other.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(earthRadiusKm * c * 10) / 10;
  }
}

