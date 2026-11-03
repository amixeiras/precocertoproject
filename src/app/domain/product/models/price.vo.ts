import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export interface PriceProps {
  amount: number;
  currency: string;
}

/**
 * Value Object representing a Monetary Price.
 * Enforces business invariants (non-negative amount, rounded to 2 decimal places).
 */
export class Price extends ValueObject<PriceProps> {
  private constructor(props: PriceProps) {
    super(props);
  }

  public get amount(): number {
    return this.props.amount;
  }

  public get currency(): string {
    return this.props.currency;
  }

  public static create(amount: number, currency: string = 'BRL'): Result<Price> {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return Result.fail('Price amount must be a valid number.');
    }

    if (amount < 0) {
      return Result.fail('Price amount cannot be negative.');
    }

    const rounded = Math.round(amount * 100) / 100;

    return Result.ok(new Price({ amount: rounded, currency }));
  }

  public formatBrl(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.props.currency,
    }).format(this.props.amount);
  }

  public isLowerThan(other: Price): boolean {
    return this.props.amount < other.amount;
  }

  public isGreaterThan(other: Price): boolean {
    return this.props.amount > other.amount;
  }

  public differenceWith(other: Price): number {
    return Math.abs(Math.round((this.props.amount - other.amount) * 100) / 100);
  }

  public percentageDifference(other: Price): number {
    if (other.amount === 0) return 0;
    const diff = this.props.amount - other.amount;
    return Math.round((diff / other.amount) * 100);
  }
}

