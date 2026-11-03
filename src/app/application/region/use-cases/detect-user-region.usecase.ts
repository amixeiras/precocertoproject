import { Region } from '@domain/region/models/region.entity';
import { RegionRepository } from '@domain/region/ports/region.repository';
import { GeolocationPort } from '@domain/region/ports/geolocation.port';
import { Result } from '@core/domain/result';

/**
 * Use Case: Automatically detect the nearest region based on device geolocation.
 */
export class DetectUserRegionUseCase {
  constructor(
    private readonly regionRepository: RegionRepository,
    private readonly geolocationPort: GeolocationPort
  ) {}

  public async execute(): Promise<Result<Region>> {
    const coordsResult = await this.geolocationPort.getCurrentCoordinates();

    if (coordsResult.isFailure) {
      return Result.fail(coordsResult.getError());
    }

    const coords = coordsResult.getValue();
    const region = await this.regionRepository.findByCoordinates(coords);

    if (!region) {
      return Result.fail('No covered region found for your current GPS coordinates.');
    }

    return Result.ok(region);
  }
}

