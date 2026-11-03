import { Product, ProductCategory } from '../models/product.entity';

export interface ProductQueryFilters {
  regionId: string;
  query?: string;
  category?: ProductCategory | 'Todas';
  minSavings?: number;
  onlyPromotions?: boolean;
}

/**
 * Output Port (Repository Contract) for Products.
 * Pure Domain Interface - DIP & Clean Architecture.
 */
export interface ProductRepository {
  findAll(filters: ProductQueryFilters): Promise<Product[]>;
  findById(id: string, regionId: string): Promise<Product | null>;
  findFeaturedDeals(regionId: string, limit?: number): Promise<Product[]>;
}

