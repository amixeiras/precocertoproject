import { Entity } from '@core/domain/entity.base';
import { MarketAddress } from './market-address.vo';
import { MarketOffer } from './market-offer.entity';

export interface MarketProps {
  name: string;
  chainName: string;
  logoUrl?: string;
  regionId: string;
  regionName?: string;
  address: MarketAddress;
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
  offers?: MarketOffer[];
}

/**
 * Domain Entity representing a Supermarket / Establishment (Estabelecimento).
 * Rich Domain Model encapsulating store details and active promotional flyer offers.
 */
export class Market extends Entity<string> {
  private readonly _name: string;
  private readonly _chainName: string;
  private readonly _logoUrl: string;
  private readonly _regionId: string;
  private readonly _regionName: string;
  private readonly _address: MarketAddress;
  private readonly _openingHours: string;
  private readonly _phone?: string;
  private readonly _rating: number;
  private readonly _tagline: string;
  private readonly _color: string;
  private readonly _logoBg: string;
  private readonly _logoLetter: string;
  private readonly _distanceText: string;
  private readonly _reviewsCount: number;
  private readonly _mapsQuery: string;
  private readonly _featuredBadge: string;
  private readonly _offers: readonly MarketOffer[];

  constructor(id: string, props: MarketProps) {
    super(id);
    this._name = props.name;
    this._chainName = props.chainName;
    this._logoUrl = props.logoUrl ?? '';
    this._regionId = props.regionId;
    this._regionName = props.regionName ?? props.regionId;
    this._address = props.address;
    this._openingHours = props.openingHours;
    this._phone = props.phone;
    this._rating = props.rating;
    this._tagline = props.tagline ?? 'Qualidade e Preço Baixo';
    this._color = props.color ?? 'from-brand-700 to-emerald-600';
    this._logoBg = props.logoBg ?? 'bg-emerald-600';
    this._logoLetter = props.logoLetter ?? props.name.substring(0, 1).toUpperCase();
    this._distanceText = props.distanceText ?? 'Perto de você';
    this._reviewsCount = props.reviewsCount ?? 100;
    this._mapsQuery = props.mapsQuery ?? `${props.name} ${props.address.city}`;
    this._featuredBadge = props.featuredBadge ?? 'Destaque';
    this._offers = Object.freeze([...(props.offers ?? [])]);
  }

  public get name(): string {
    return this._name;
  }

  public get chainName(): string {
    return this._chainName;
  }

  public get logoUrl(): string {
    return this._logoUrl;
  }

  public get regionId(): string {
    return this._regionId;
  }

  public get regionName(): string {
    return this._regionName;
  }

  public get address(): MarketAddress {
    return this._address;
  }

  public get openingHours(): string {
    return this._openingHours;
  }

  public get phone(): string | undefined {
    return this._phone;
  }

  public get rating(): number {
    return this._rating;
  }

  public get tagline(): string {
    return this._tagline;
  }

  public get color(): string {
    return this._color;
  }

  public get logoBg(): string {
    return this._logoBg;
  }

  public get logoLetter(): string {
    return this._logoLetter;
  }

  public get distanceText(): string {
    return this._distanceText;
  }

  public get reviewsCount(): number {
    return this._reviewsCount;
  }

  public get mapsQuery(): string {
    return this._mapsQuery;
  }

  public get featuredBadge(): string {
    return this._featuredBadge;
  }

  public get offers(): readonly MarketOffer[] {
    return this._offers;
  }

  /**
   * Returns up to `limit` promotional offers for the establishment card preview.
   */
  public getTopOffers(limit: number = 5): MarketOffer[] {
    return this._offers.slice(0, limit);
  }

  /**
   * Returns the average discount percentage among active offers.
   */
  public get averageDiscount(): number {
    if (this._offers.length === 0) return 0;
    const total = this._offers.reduce((acc, o) => acc + o.discount, 0);
    return Math.round(total / this._offers.length);
  }
}
