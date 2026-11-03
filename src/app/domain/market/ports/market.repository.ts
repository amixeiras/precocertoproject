import { Market } from '../models/market.entity';

/**
 * Output Port (Repository Contract) for Supermarkets.
 * Interface Segregation Principle: pure domain interface.
 */
export interface MarketRepository {
  findAll(): Promise<Market[]>;
  findById(id: string): Promise<Market | null>;
  findByRegionId(regionId: string): Promise<Market[]>;
}

