import { Market } from '@domain/market/models/market.entity';
import { MarketOffer } from '@domain/market/models/market-offer.entity';
import { MarketRepository } from '@domain/market/ports/market.repository';

export interface QuickCompareItem {
  market: Market;
  offer: MarketOffer;
  isLowestPrice: boolean;
}

export interface QuickCompareResult {
  query: string;
  totalFound: number;
  lowestPrice: number;
  items: QuickCompareItem[];
}

/**
 * Use Case: Quick comparison of a specific product item across all markets.
 * Powers the "Comparador Rápido de Preço" in real time.
 */
export class QuickCompareUseCase {
  constructor(private readonly marketRepository: MarketRepository) {}

  public async execute(query: string, regionId: string): Promise<QuickCompareResult> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      return { query: '', totalFound: 0, lowestPrice: 0, items: [] };
    }

    const markets = await this.marketRepository.findByRegionId(regionId);
    const matchedItems: { market: Market; offer: MarketOffer }[] = [];

    for (const market of markets) {
      for (const offer of market.offers) {
        if (offer.name.toLowerCase().includes(cleanQuery)) {
          matchedItems.push({ market, offer });
        }
      }
    }

    if (matchedItems.length === 0) {
      return { query, totalFound: 0, lowestPrice: 0, items: [] };
    }

    matchedItems.sort((a, b) => a.offer.price.amount - b.offer.price.amount);
    const lowestPrice = matchedItems[0].offer.price.amount;

    const items: QuickCompareItem[] = matchedItems.map((item) => ({
      market: item.market,
      offer: item.offer,
      isLowestPrice: item.offer.price.amount === lowestPrice,
    }));

    return {
      query,
      totalFound: items.length,
      lowestPrice,
      items,
    };
  }
}

