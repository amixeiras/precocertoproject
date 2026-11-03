import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Product } from '@domain/product/models/product.entity';
import { ProductRepository, ProductQueryFilters } from '@domain/product/ports/product.repository';
import { ProductMapper, ProductDto } from '../../mappers/product.mapper';

/**
 * Concrete HTTP Implementation of ProductRepository.
 * Connects to external REST API backend.
 * Open/Closed Principle: Can easily be swapped with InMemoryProductRepository via DIP provider.
 */
@Injectable()
export class HttpProductRepository implements ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/products';

  public async findAll(filters: ProductQueryFilters): Promise<Product[]> {
    const params: Record<string, string> = {
      regionId: filters.regionId,
    };

    if (filters.query) params['query'] = filters.query;
    if (filters.category && filters.category !== 'Todas') params['category'] = filters.category;
    if (filters.onlyPromotions) params['onlyPromotions'] = 'true';

    const dtos = await firstValueFrom(
      this.http.get<ProductDto[]>(this.apiUrl, { params })
    );

    return dtos.map(ProductMapper.toDomain);
  }

  public async findById(id: string, regionId: string): Promise<Product | null> {
    try {
      const dto = await firstValueFrom(
        this.http.get<ProductDto>(`${this.apiUrl}/${id}`, {
          params: { regionId },
        })
      );
      return ProductMapper.toDomain(dto);
    } catch {
      return null;
    }
  }

  public async findFeaturedDeals(regionId: string, limit: number = 6): Promise<Product[]> {
    const dtos = await firstValueFrom(
      this.http.get<ProductDto[]>(`${this.apiUrl}/featured`, {
        params: { regionId, limit: limit.toString() },
      })
    );
    return dtos.map(ProductMapper.toDomain);
  }
}

