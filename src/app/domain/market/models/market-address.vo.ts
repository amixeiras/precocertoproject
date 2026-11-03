import { ValueObject } from '@core/domain/value-object.base';
import { Coordinates } from '@domain/region/models/coordinates.vo';

export interface MarketAddressProps {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: Coordinates;
}

/**
 * Value Object representing a Supermarket Physical Address.
 */
export class MarketAddress extends ValueObject<MarketAddressProps> {
  constructor(props: MarketAddressProps) {
    super(props);
  }

  public get street(): string {
    return this.props.street;
  }

  public get number(): string {
    return this.props.number;
  }

  public get neighborhood(): string {
    return this.props.neighborhood;
  }

  public get city(): string {
    return this.props.city;
  }

  public get state(): string {
    return this.props.state;
  }

  public get zipCode(): string {
    return this.props.zipCode;
  }

  public get coordinates(): Coordinates {
    return this.props.coordinates;
  }

  public get formatted(): string {
    const numPart = this.props.number ? `, ${this.props.number}` : '';
    const neighPart = this.props.neighborhood ? ` - ${this.props.neighborhood}` : '';
    const cityState = this.props.city ? `, ${this.props.city} - ${this.props.state}` : '';
    return `${this.props.street}${numPart}${neighPart}${cityState}`.trim();
  }
}

