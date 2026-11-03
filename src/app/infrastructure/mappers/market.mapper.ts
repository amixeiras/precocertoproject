import { Market } from '@domain/market/models/market.entity';
import { MarketAddress } from '@domain/market/models/market-address.vo';
import { MarketOffer } from '@domain/market/models/market-offer.entity';
import { Coordinates } from '@domain/region/models/coordinates.vo';
import { Price } from '@domain/product/models/price.vo';

export interface MarketOfferDto {
  id: string;
  name: string;
  category: string;
  oldPrice?: number;
  price: number;
  discount: number;
  validUntil: string;
  tag?: string;
  unit: string;
  imgIcon: string;
  imageUrl?: string;
}

export interface MarketDto {
  id: string;
  name: string;
  chainName: string;
  logoUrl?: string;
  regionId: string;
  regionName?: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  phone?: string;
  rating: number;
  tagline?: string;
  color?: string;
  logoBg?: string;
  logoLetter?: string;
  distanceText?: string;
  reviewsCount?: number;
  mapsQuery?: string;
  featuredBadge?: string;
  offers?: MarketOfferDto[];
}

/**
 * Mapper for converting between Market DTOs and Market Domain Entities.
 */
export class MarketMapper {
  public static toDomain(dto: MarketDto): Market {
    const coordsResult = Coordinates.create(dto.latitude, dto.longitude);
    const coords = coordsResult.isSuccess
      ? coordsResult.getValue()
      : Coordinates.create(0, 0).getValue();

    const address = new MarketAddress({
      street: dto.street,
      number: dto.number,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
      coordinates: coords,
    });

    const domainOffers = (dto.offers ?? []).map((o) => {
      const priceResult = Price.create(o.price);
      const price = priceResult.isSuccess ? priceResult.getValue() : Price.create(0).getValue();

      let oldPrice: Price | undefined;
      if (o.oldPrice !== undefined) {
        const oldResult = Price.create(o.oldPrice);
        if (oldResult.isSuccess) {
          oldPrice = oldResult.getValue();
        }
      }

      return new MarketOffer(o.id, {
        name: o.name,
        category: o.category,
        oldPrice,
        price,
        discount: o.discount,
        validUntil: o.validUntil,
        tag: o.tag,
        unit: o.unit,
        imgIcon: o.imgIcon,
        imageUrl: o.imageUrl,
      });
    });

    return new Market(dto.id, {
      name: dto.name,
      chainName: dto.chainName,
      logoUrl: dto.logoUrl,
      regionId: dto.regionId,
      regionName: dto.regionName,
      address,
      openingHours: dto.openingHours,
      phone: dto.phone,
      rating: dto.rating,
      tagline: dto.tagline,
      color: dto.color,
      logoBg: dto.logoBg,
      logoLetter: dto.logoLetter,
      distanceText: dto.distanceText,
      reviewsCount: dto.reviewsCount,
      mapsQuery: dto.mapsQuery,
      featuredBadge: dto.featuredBadge,
      offers: domainOffers,
    });
  }

  public static toDto(market: Market): MarketDto {
    return {
      id: market.idValue,
      name: market.name,
      chainName: market.chainName,
      logoUrl: market.logoUrl,
      regionId: market.regionId,
      regionName: market.regionName,
      street: market.address.street,
      number: market.address.number,
      neighborhood: market.address.neighborhood,
      city: market.address.city,
      state: market.address.state,
      zipCode: market.address.zipCode,
      latitude: market.address.coordinates.latitude,
      longitude: market.address.coordinates.longitude,
      openingHours: market.openingHours,
      phone: market.phone,
      rating: market.rating,
      tagline: market.tagline,
      color: market.color,
      logoBg: market.logoBg,
      logoLetter: market.logoLetter,
      distanceText: market.distanceText,
      reviewsCount: market.reviewsCount,
      mapsQuery: market.mapsQuery,
      featuredBadge: market.featuredBadge,
      offers: market.offers.map((o) => ({
        id: o.idValue,
        name: o.name,
        category: o.category,
        oldPrice: o.oldPrice?.amount,
        price: o.price.amount,
        discount: o.discount,
        validUntil: o.validUntil,
        tag: o.tag,
        unit: o.unit,
        imgIcon: o.imgIcon,
      })),
    };
  }
}
