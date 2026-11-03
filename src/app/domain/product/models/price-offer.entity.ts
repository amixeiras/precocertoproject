import { Entity } from '@core/domain/entity.base';
import { Price } from './price.vo';

export interface PriceOfferProps {
  productId: string;
  marketId: string;
  marketName: string;
  price: Price;
  originalPrice?: Price;
  isOnSale: boolean;
  updatedAt: Date;
}

/**
 * Domain Entity representing a Price Offer for a Product at a specific Supermarket.
 */
export class PriceOffer extends Entity<string> {
  private readonly _productId: string;
  private readonly _marketId: string;
  private readonly _marketName: string;
  private readonly _price: Price;
  private readonly _originalPrice?: Price;
  private readonly _isOnSale: boolean;
  private readonly _updatedAt: Date;

  constructor(id: string, props: PriceOfferProps) {
    super(id);
    this._productId = props.productId;
    this._marketId = props.marketId;
    this._marketName = props.marketName;
    this._price = props.price;
    this._originalPrice = props.originalPrice;
    this._isOnSale = props.isOnSale;
    this._updatedAt = props.updatedAt;
  }

  public get productId(): string {
    return this._productId;
  }

  public get marketId(): string {
    return this._marketId;
  }

  public get marketName(): string {
    return this._marketName;
  }

  public get price(): Price {
    return this._price;
  }

  public get originalPrice(): Price | undefined {
    return this._originalPrice;
  }

  public get isOnSale(): boolean {
    return this._isOnSale;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get discountPercentage(): number {
    if (!this._originalPrice || this._originalPrice.amount <= this._price.amount) {
      return 0;
    }
    return Math.round(((this._originalPrice.amount - this._price.amount) / this._originalPrice.amount) * 100);
  }
}

