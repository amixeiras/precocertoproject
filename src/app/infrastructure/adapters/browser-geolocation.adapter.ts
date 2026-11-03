import { GeolocationPort } from '@domain/region/ports/geolocation.port';
import { Coordinates } from '@domain/region/models/coordinates.vo';
import { Result } from '@core/domain/result';

/**
 * Concrete Infrastructure Adapter for Browser HTML5 Geolocation API.
 * Single Responsibility: Interacts only with browser geolocation hardware/service.
 */
export class BrowserGeolocationAdapter implements GeolocationPort {
  public async getCurrentCoordinates(): Promise<Result<Coordinates>> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return Result.fail('Geolocation is not supported by this browser environment.');
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordsResult = Coordinates.create(
            position.coords.latitude,
            position.coords.longitude
          );
          resolve(coordsResult);
        },
        (error) => {
          let message = 'Could not retrieve device location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permissão de localização negada pelo usuário.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Sinal de localização GPS indisponível no momento.';
              break;
            case error.TIMEOUT:
              message = 'Tempo limite esgotado ao buscar localização.';
              break;
          }
          resolve(Result.fail(message));
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }
}

