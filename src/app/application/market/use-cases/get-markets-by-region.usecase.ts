import { Market } from '@domain/market/models/market.entity';
import { MarketRepository } from '@domain/market/ports/market.repository';
import { Coordinates } from '@domain/region/models/coordinates.vo';

export interface MarketWithDistance {
  market: Market;
  distanceKm?: number;
}

/**
 * Use Case: Get supermarkets located in the specified region.
 */
export class GetMarketsByRegionUseCase {
  constructor(private readonly marketRepository: MarketRepository) {}

  public async execute(regionId: string, userCoords?: Coordinates): Promise<MarketWithDistance[]> {
    if (!regionId) {
      return [];
    }

    const markets = await this.marketRepository.findByRegionId(regionId);

    const result: MarketWithDistance[] = markets.map((market) => {
      let distanceKm: number | undefined;
      if (userCoords) {
        distanceKm = market.address.coordinates.distanceTo(userCoords);
      }
      return { market, distanceKm };
    });

    if (userCoords) {
      result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return result;
  }
}

