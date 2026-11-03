import { Provider } from '@angular/core';
import {
  PRODUCT_REPOSITORY,
  MARKET_REPOSITORY,
  REGION_REPOSITORY,
  GEOLOCATION_PORT,
} from './tokens/injection-tokens';
import { InMemoryProductRepository } from './repositories/in-memory/in-memory-product.repository';
import { InMemoryMarketRepository } from './repositories/in-memory/in-memory-market.repository';
import { InMemoryRegionRepository } from './repositories/in-memory/in-memory-region.repository';
import { BrowserGeolocationAdapter } from './adapters/browser-geolocation.adapter';

// Use Cases
import { SearchProductsUseCase } from '@application/product/use-cases/search-products.usecase';
import { GetProductDetailsUseCase } from '@application/product/use-cases/get-product-details.usecase';
import { GetFeaturedDealsUseCase } from '@application/product/use-cases/get-featured-deals.usecase';
import { GetMarketsByRegionUseCase } from '@application/market/use-cases/get-markets-by-region.usecase';
import { GetEstablishmentsUseCase } from '@application/market/use-cases/get-establishments.usecase';
import { QuickCompareUseCase } from '@application/market/use-cases/quick-compare.usecase';
import { GetAvailableRegionsUseCase } from '@application/region/use-cases/get-available-regions.usecase';
import { DetectUserRegionUseCase } from '@application/region/use-cases/detect-user-region.usecase';
import { PriceComparisonDomainService } from '@domain/product/services/price-comparison.domain-service';

// Domain Ports
import { ProductRepository } from '@domain/product/ports/product.repository';
import { MarketRepository } from '@domain/market/ports/market.repository';
import { RegionRepository } from '@domain/region/ports/region.repository';
import { GeolocationPort } from '@domain/region/ports/geolocation.port';

/**
 * Dependency Injection Provider for Preço Certo Infrastructure & Application layers.
 * Adheres to Dependency Inversion Principle (SOLID DIP):
 * All ports are bound to their concrete implementations here.
 */
export function providePrecoCertoInfrastructure(): Provider[] {
  return [
    // Repositories & Ports
    {
      provide: PRODUCT_REPOSITORY,
      useClass: InMemoryProductRepository,
    },
    {
      provide: MARKET_REPOSITORY,
      useClass: InMemoryMarketRepository,
    },
    {
      provide: REGION_REPOSITORY,
      useClass: InMemoryRegionRepository,
    },
    {
      provide: GEOLOCATION_PORT,
      useClass: BrowserGeolocationAdapter,
    },

    // Domain Services
    {
      provide: PriceComparisonDomainService,
      useClass: PriceComparisonDomainService,
    },

    // Application Use Cases (Factory providers injecting pure repository ports)
    {
      provide: SearchProductsUseCase,
      useFactory: (repo: ProductRepository) => new SearchProductsUseCase(repo),
      deps: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetProductDetailsUseCase,
      useFactory: (repo: ProductRepository) => new GetProductDetailsUseCase(repo),
      deps: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetFeaturedDealsUseCase,
      useFactory: (repo: ProductRepository) => new GetFeaturedDealsUseCase(repo),
      deps: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetMarketsByRegionUseCase,
      useFactory: (repo: MarketRepository) => new GetMarketsByRegionUseCase(repo),
      deps: [MARKET_REPOSITORY],
    },
    {
      provide: GetEstablishmentsUseCase,
      useFactory: (repo: MarketRepository) => new GetEstablishmentsUseCase(repo),
      deps: [MARKET_REPOSITORY],
    },
    {
      provide: QuickCompareUseCase,
      useFactory: (repo: MarketRepository) => new QuickCompareUseCase(repo),
      deps: [MARKET_REPOSITORY],
    },
    {
      provide: GetAvailableRegionsUseCase,
      useFactory: (repo: RegionRepository) => new GetAvailableRegionsUseCase(repo),
      deps: [REGION_REPOSITORY],
    },
    {
      provide: DetectUserRegionUseCase,
      useFactory: (repo: RegionRepository, geo: GeolocationPort) =>
        new DetectUserRegionUseCase(repo, geo),
      deps: [REGION_REPOSITORY, GEOLOCATION_PORT],
    },
  ];
}
