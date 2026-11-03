import { Product } from '../models/product.entity';
import { Market } from '@domain/market/models/market.entity';

export interface MarketBasketComparison {
  marketId: string;
  marketName: string;
  totalAmount: number;
  availableItemsCount: number;
  missingItemsCount: number;
  isCheapest: boolean;
}

export interface BasketComparisonResult {
  totalItems: number;
  comparisons: MarketBasketComparison[];
  cheapestMarket?: MarketBasketComparison;
  maxSavingsAmount: number;
  savingsPercentage: number;
}

/**
 * Domain Service for calculating multi-market price comparisons and basket optimizations.
 * Stateless domain business logic fulfilling DDD patterns.
 */
export class PriceComparisonDomainService {
  /**
   * Compares the total price of a list of products across different supermarkets.
   */
  public compareBasket(products: Product[], markets: Market[]): BasketComparisonResult {
    if (products.length === 0 || markets.length === 0) {
      return {
        totalItems: products.length,
        comparisons: [],
        maxSavingsAmount: 0,
        savingsPercentage: 0,
      };
    }

    const marketTotals: MarketBasketComparison[] = markets.map((market) => {
      let total = 0;
      let available = 0;
      let missing = 0;

      for (const prod of products) {
        const offer = prod.getOfferByMarketId(market.idValue);
        if (offer) {
          total += offer.price.amount;
          available++;
        } else {
          missing++;
        }
      }

      return {
        marketId: market.idValue,
        marketName: market.name,
        totalAmount: Math.round(total * 100) / 100,
        availableItemsCount: available,
        missingItemsCount: missing,
        isCheapest: false,
      };
    });

    // Sort by total amount ascending (only markets with full or highest availability)
    marketTotals.sort((a, b) => {
      if (a.availableItemsCount !== b.availableItemsCount) {
        return b.availableItemsCount - a.availableItemsCount;
      }
      return a.totalAmount - b.totalAmount;
    });

    if (marketTotals.length > 0) {
      marketTotals[0].isCheapest = true;
    }

    const cheapest = marketTotals[0];
    const mostExpensive = marketTotals[marketTotals.length - 1];

    let maxSavingsAmount = 0;
    let savingsPercentage = 0;

    if (cheapest && mostExpensive && mostExpensive.totalAmount > cheapest.totalAmount) {
      maxSavingsAmount = Math.round((mostExpensive.totalAmount - cheapest.totalAmount) * 100) / 100;
      savingsPercentage = Math.round((maxSavingsAmount / mostExpensive.totalAmount) * 100);
    }

    return {
      totalItems: products.length,
      comparisons: marketTotals,
      cheapestMarket: cheapest,
      maxSavingsAmount,
      savingsPercentage,
    };
  }
}

