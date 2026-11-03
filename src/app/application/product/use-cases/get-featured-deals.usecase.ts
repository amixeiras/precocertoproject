import { Product } from '@domain/product/models/product.entity';
import { ProductRepository } from '@domain/product/ports/product.repository';

/**
 * Use Case: Get top featured promotions and best savings deals for a region.
 */
export class GetFeaturedDealsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(regionId: string, limit: number = 6): Promise<Product[]> {
    if (!regionId) {
      return [];
    }
    return this.productRepository.findFeaturedDeals(regionId, limit);
  }
}

