import { Entity } from '@core/domain/entity.base';
import { PriceOffer } from './price-offer.entity';
import { Price } from './price.vo';

export type ProductCategory =
  | 'Hortifrúti'
  | 'Carnes e Peixes'
  | 'Laticínios e Frios'
  | 'Mercearia'
  | 'Bebidas'
  | 'Limpeza'
  | 'Higiene e Beleza'
  | 'Padaria';

export interface ProductProps {
  name: string;
  brand: string;
  description: string;
  category: ProductCategory;
  unit: string; // ex: 'kg', 'un', '500g', '1L'
  imageUrl: string;
  barcode?: string;
  offers: PriceOffer[];
}

/**
 * Domain Entity representing a Grocery Product.
 * Rich Domain Model encapsulating price comparisons across markets.
 */
export class Product extends Entity<string> {
  private readonly _name: string;
  private readonly _brand: string;
  private readonly _description: string;
  private readonly _category: ProductCategory;
  private readonly _unit: string;
  private readonly _imageUrl: string;
  private readonly _barcode?: string;
  private readonly _offers: readonly PriceOffer[];

  constructor(id: string, props: ProductProps) {
    super(id);
    this._name = props.name;
    this._brand = props.brand;
    this._description = props.description;
    this._category = props.category;
    this._unit = props.unit;
    this._imageUrl = props.imageUrl;
    this._barcode = props.barcode;
    this._offers = Object.freeze([...props.offers]);
  }

  public get name(): string {
    return this._name;
  }

  public get brand(): string {
    return this._brand;
  }

  public get fullName(): string {
    return `${this._name} ${this._brand} (${this._unit})`;
  }

  public get description(): string {
    return this._description;
  }

  public get category(): ProductCategory {
    return this._category;
  }

  public get unit(): string {
    return this._unit;
  }

  public get imageUrl(): string {
    return this._imageUrl;
  }

  public get barcode(): string | undefined {
    return this._barcode;
  }

  public get offers(): readonly PriceOffer[] {
    return this._offers;
  }

  public get offersCount(): number {
    return this._offers.length;
  }

  public get hasOffers(): boolean {
    return this._offers.length > 0;
  }

  /**
   * Returns offers sorted from lowest to highest price.
   */
  public getOffersSortedByPrice(): PriceOffer[] {
    return [...this._offers].sort((a, b) => a.price.amount - b.price.amount);
  }

  /**
   * Returns the best offer (cheapest price) across available markets.
   */
  public getLowestOffer(): PriceOffer | null {
    if (this._offers.length === 0) return null;
    return this._offers.reduce((best, curr) => (curr.price.amount < best.price.amount ? curr : best));
  }

  /**
   * Returns the highest offer found for comparison.
   */
  public getHighestOffer(): PriceOffer | null {
    if (this._offers.length === 0) return null;
    return this._offers.reduce((highest, curr) => (curr.price.amount > highest.price.amount ? curr : highest));
  }

  /**
   * Calculates maximum potential savings between highest and lowest market prices.
   */
  public calculateMaxSavings(): { amount: number; percentage: number } {
    const lowest = this.getLowestOffer();
    const highest = this.getHighestOffer();

    if (!lowest || !highest || lowest.equals(highest)) {
      return { amount: 0, percentage: 0 };
    }

    const amount = Math.round((highest.price.amount - lowest.price.amount) * 100) / 100;
    const percentage = Math.round((amount / highest.price.amount) * 100);

    return { amount, percentage };
  }

  /**
   * Finds the offer for a specific supermarket.
   */
  public getOfferByMarketId(marketId: string): PriceOffer | undefined {
    return this._offers.find((offer) => offer.marketId === marketId);
  }
}

