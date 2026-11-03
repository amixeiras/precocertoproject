import { Product } from '@domain/product/models/product.entity';
import { ProductRepository } from '@domain/product/ports/product.repository';

/**
 * Use Case: Retrieve complete price comparison details for a single product.
 */
export class GetProductDetailsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(productId: string, regionId: string): Promise<Product | null> {
    if (!productId || !regionId) {
      return null;
    }
    return this.productRepository.findById(productId, regionId);
  }
}

