import { Region } from '@domain/region/models/region.entity';
import { RegionRepository } from '@domain/region/ports/region.repository';

/**
 * Use Case: Retrieve all operational regions supported by Preço Certo.
 */
export class GetAvailableRegionsUseCase {
  constructor(private readonly regionRepository: RegionRepository) {}

  public async execute(): Promise<Region[]> {
    return this.regionRepository.findAll();
  }
}

