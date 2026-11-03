import { InjectionToken } from '@angular/core';
import { ProductRepository } from '@domain/product/ports/product.repository';
import { MarketRepository } from '@domain/market/ports/market.repository';
import { RegionRepository } from '@domain/region/ports/region.repository';
import { GeolocationPort } from '@domain/region/ports/geolocation.port';

/**
 * Injection Tokens for Dependency Inversion Principle (DIP - SOLID).
 * Application and presentation layers depend on domain port interfaces,
 * with concrete infrastructure implementations resolved at runtime.
 */
export const PRODUCT_REPOSITORY = new InjectionToken<ProductRepository>('PRODUCT_REPOSITORY');
export const MARKET_REPOSITORY = new InjectionToken<MarketRepository>('MARKET_REPOSITORY');
export const REGION_REPOSITORY = new InjectionToken<RegionRepository>('REGION_REPOSITORY');
export const GEOLOCATION_PORT = new InjectionToken<GeolocationPort>('GEOLOCATION_PORT');

