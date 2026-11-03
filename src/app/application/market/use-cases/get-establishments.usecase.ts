import { Market } from '@domain/market/models/market.entity';
import { MarketOffer } from '@domain/market/models/market-offer.entity';
import { MarketRepository } from '@domain/market/ports/market.repository';

export type EstablishmentSortOption = 'featured' | 'discount' | 'rating' | 'name';

export interface GetEstablishmentsFilter {
  regionId: string;
  category?: string;
  searchTerm?: string;
  sortBy?: EstablishmentSortOption;
}

export interface EstablishmentWithFilteredOffers {
  market: Market;
  activeOffers: MarketOffer[];
  totalOffersCount: number;
}

/**
 * Use Case: Search, filter, and sort establishments and their promotional flyer offers.
 * Single Responsibility: Orchestrates domain rules for establishment exploration.
 */
export class GetEstablishmentsUseCase {
  constructor(private readonly marketRepository: MarketRepository) {}

  public async execute(filter: GetEstablishmentsFilter): Promise<EstablishmentWithFilteredOffers[]> {
    const allMarkets = await this.marketRepository.findByRegionId(filter.regionId);

    const term = (filter.searchTerm ?? '').toLowerCase().trim();
    const category = filter.category ?? 'all';

    const results: EstablishmentWithFilteredOffers[] = [];

    for (const market of allMarkets) {
      let matchingOffers = [...market.offers];

      if (category !== 'all') {
        matchingOffers = matchingOffers.filter(
          (o) => o.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (term) {
        const matchesMarketName = market.name.toLowerCase().includes(term);
        if (!matchesMarketName) {
          matchingOffers = matchingOffers.filter((o) =>
            o.name.toLowerCase().includes(term)
          );
        }
      }

      const shouldInclude =
        category === 'all' && !term
          ? true
          : matchingOffers.length > 0 ||
            (term && market.name.toLowerCase().includes(term));

      if (shouldInclude) {
        results.push({
          market,
          activeOffers: matchingOffers,
          totalOffersCount: market.offers.length,
        });
      }
    }

    return this.sortResults(results, filter.sortBy ?? 'featured');
  }

  private sortResults(
    items: EstablishmentWithFilteredOffers[],
    sortBy: EstablishmentSortOption
  ): EstablishmentWithFilteredOffers[] {
    const list = [...items];

    switch (sortBy) {
      case 'name':
        return list.sort((a, b) => a.market.name.localeCompare(b.market.name, 'pt-BR'));

      case 'rating':
        return list.sort((a, b) => b.market.rating - a.market.rating);

      case 'discount':
        return list.sort((a, b) => b.market.averageDiscount - a.market.averageDiscount);

      case 'featured':
      default:
        return list; // Preserves native featured sequence
    }
  }
}

