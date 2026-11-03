import { Product, ProductCategory } from '@domain/product/models/product.entity';
import { PriceOffer } from '@domain/product/models/price-offer.entity';
import { Price } from '@domain/product/models/price.vo';

export interface PriceOfferDto {
  id: string;
  productId: string;
  marketId: string;
  marketName: string;
  priceAmount: number;
  originalPriceAmount?: number;
  currency?: string;
  isOnSale: boolean;
  updatedAt: string;
}

export interface ProductDto {
  id: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  unit: string;
  imageUrl: string;
  barcode?: string;
  offers: PriceOfferDto[];
}

/**
 * Mapper for converting between Product/Offer DTOs and Product Domain Entities.
 */
export class ProductMapper {
  public static toDomain(dto: ProductDto): Product {
    const offers = (dto.offers ?? []).map((o) => {
      const priceResult = Price.create(o.priceAmount, o.currency ?? 'BRL');
      const price = priceResult.isSuccess ? priceResult.getValue() : Price.create(0).getValue();

      let originalPrice: Price | undefined;
      if (o.originalPriceAmount !== undefined) {
        const origResult = Price.create(o.originalPriceAmount, o.currency ?? 'BRL');
        if (origResult.isSuccess) {
          originalPrice = origResult.getValue();
        }
      }

      return new PriceOffer(o.id, {
        productId: o.productId,
        marketId: o.marketId,
        marketName: o.marketName,
        price,
        originalPrice,
        isOnSale: o.isOnSale,
        updatedAt: new Date(o.updatedAt),
      });
    });

    return new Product(dto.id, {
      name: dto.name,
      brand: dto.brand,
      description: dto.description,
      category: dto.category as ProductCategory,
      unit: dto.unit,
      imageUrl: dto.imageUrl,
      barcode: dto.barcode,
      offers,
    });
  }

  public static toDto(product: Product): ProductDto {
    return {
      id: product.idValue,
      name: product.name,
      brand: product.brand,
      description: product.description,
      category: product.category,
      unit: product.unit,
      imageUrl: product.imageUrl,
      barcode: product.barcode,
      offers: product.offers.map((o) => ({
        id: o.idValue,
        productId: o.productId,
        marketId: o.marketId,
        marketName: o.marketName,
        priceAmount: o.price.amount,
        originalPriceAmount: o.originalPrice?.amount,
        currency: o.price.currency,
        isOnSale: o.isOnSale,
        updatedAt: o.updatedAt.toISOString(),
      })),
    };
  }
}

