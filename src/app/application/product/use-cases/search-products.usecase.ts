import { Product } from '@domain/product/models/product.entity';
import { ProductRepository } from '@domain/product/ports/product.repository';
import { SearchProductsQuery } from '../dto/search-products.query';

/**
 * Use Case: Search and filter products with price comparisons for a specific region.
 * Single Responsibility: Orchestrates domain product search and sorting rules.
 * Open/Closed: Extensible with new sort and filter strategies.
 */
export class SearchProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(query: SearchProductsQuery): Promise<Product[]> {
    if (!query.regionId) {
      return [];
    }

    const products = await this.productRepository.findAll({
      regionId: query.regionId,
      query: query.searchTerm,
      category: query.category,
      onlyPromotions: query.onlyPromotions,
    });

    return this.sortProducts(products, query.sortBy ?? 'cheapest');
  }

  private sortProducts(products: Product[], sortBy: SearchProductsQuery['sortBy']): Product[] {
    const list = [...products];

    switch (sortBy) {
      case 'cheapest':
        return list.sort((a, b) => {
          const aPrice = a.getLowestOffer()?.price.amount ?? Infinity;
          const bPrice = b.getLowestOffer()?.price.amount ?? Infinity;
          return aPrice - bPrice;
        });

      case 'biggest_savings':
        return list.sort((a, b) => {
          const aSavings = a.calculateMaxSavings().amount;
          const bSavings = b.calculateMaxSavings().amount;
          return bSavings - aSavings;
        });

      case 'offers_count':
        return list.sort((a, b) => b.offersCount - a.offersCount);

      case 'name':
      default:
        return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }
  }
}

