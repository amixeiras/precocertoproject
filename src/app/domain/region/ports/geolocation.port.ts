import { Coordinates } from '../models/coordinates.vo';
import { Result } from '@core/domain/result';

/**
 * Geolocation Port contract for device/browser location services.
 * Inversion of Control: Domain specifies what it needs, infrastructure implements it.
 */
export interface GeolocationPort {
  getCurrentCoordinates(): Promise<Result<Coordinates>>;
}

