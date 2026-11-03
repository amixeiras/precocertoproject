import { ProductCategory } from '@domain/product/models/product.entity';

export type ProductSortOption = 'cheapest' | 'biggest_savings' | 'name' | 'offers_count';

export interface SearchProductsQuery {
  regionId: string;
  searchTerm?: string;
  category?: ProductCategory | 'Todas';
  onlyPromotions?: boolean;
  sortBy?: ProductSortOption;
}

