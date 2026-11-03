import { Region } from '@domain/region/models/region.entity';
import { Coordinates } from '@domain/region/models/coordinates.vo';

export interface RegionDto {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  neighborhoods?: string[];
}

/**
 * Mapper for converting between Region DTOs and Region Domain Entities.
 */
export class RegionMapper {
  public static toDomain(raw: RegionDto): Region {
    const coordsResult = Coordinates.create(raw.latitude, raw.longitude);
    const coords = coordsResult.isSuccess
      ? coordsResult.getValue()
      : Coordinates.create(0, 0).getValue();

    return new Region(raw.id, {
      name: raw.name,
      state: raw.state,
      centerCoordinates: coords,
      radiusKm: raw.radiusKm,
      neighborhoods: raw.neighborhoods ?? [],
    });
  }

  public static toDto(entity: Region): RegionDto {
    return {
      id: entity.idValue,
      name: entity.name,
      state: entity.state,
      latitude: entity.centerCoordinates.latitude,
      longitude: entity.centerCoordinates.longitude,
      radiusKm: entity.radiusKm,
      neighborhoods: [...entity.neighborhoods],
    };
  }
}

