import { Entity } from '@core/domain/entity.base';
import { Price } from '@domain/product/models/price.vo';

export interface MarketOfferProps {
  name: string;
  category: string;
  oldPrice?: Price;
  price: Price;
  discount: number;
  validUntil: string;
  tag?: string;
  unit: string;
  imgIcon: string;
  imageUrl?: string;
}

/**
 * Domain Entity representing a Promotional Flyer Offer for an Establishment.
 * Clean Code & DDD: Encapsulates validation and promotional business logic.
 */
export class MarketOffer extends Entity<string> {
  private readonly _name: string;
  private readonly _category: string;
  private readonly _oldPrice?: Price;
  private readonly _price: Price;
  private readonly _discount: number;
  private readonly _validUntil: string;
  private readonly _tag?: string;
  private readonly _unit: string;
  private readonly _imgIcon: string;
  private readonly _imageUrl?: string;

  constructor(id: string, props: MarketOfferProps) {
    super(id);
    this._name = props.name;
    this._category = props.category;
    this._oldPrice = props.oldPrice;
    this._price = props.price;
    this._discount = props.discount;
    this._validUntil = props.validUntil;
    this._tag = props.tag;
    this._unit = props.unit;
    this._imgIcon = props.imgIcon;
    this._imageUrl = props.imageUrl;
  }

  public get name(): string {
    return this._name;
  }

  public get category(): string {
    return this._category;
  }

  public get oldPrice(): Price | undefined {
    return this._oldPrice;
  }

  public get price(): Price {
    return this._price;
  }

  public get discount(): number {
    return this._discount;
  }

  public get validUntil(): string {
    return this._validUntil;
  }

  public get tag(): string | undefined {
    return this._tag;
  }

  public get unit(): string {
    return this._unit;
  }

  public get imgIcon(): string {
    return this._imgIcon;
  }

  public get imageUrl(): string | undefined {
    return this._imageUrl;
  }
}

