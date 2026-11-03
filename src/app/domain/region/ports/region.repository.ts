import { Region } from '../models/region.entity';
import { Coordinates } from '../models/coordinates.vo';

/**
 * Output Port (Repository Contract) for Region operations.
 * Pure TypeScript interface free of infrastructure dependencies (DIP & ISP).
 */
export interface RegionRepository {
  findAll(): Promise<Region[]>;
  findById(id: string): Promise<Region | null>;
  findByCoordinates(coords: Coordinates): Promise<Region | null>;
}

