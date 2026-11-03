import { Price } from './price.vo';

describe('Price Value Object (DDD)', () => {
  it('should create a valid Price value object', () => {
    const result = Price.create(25.99);
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().amount).toBe(25.99);
    expect(result.getValue().currency).toBe('BRL');
  });

  it('should reject negative amounts according to domain rules', () => {
    const result = Price.create(-10);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('cannot be negative');
  });

  it('should format correctly to BRL currency', () => {
    const price = Price.create(15.5).getValue();
    const formatted = price.formatBrl();
    expect(formatted).toContain('15,50');
  });

  it('should compare prices correctly', () => {
    const cheap = Price.create(10.0).getValue();
    const expensive = Price.create(20.0).getValue();

    expect(cheap.isLowerThan(expensive)).toBe(true);
    expect(expensive.isGreaterThan(cheap)).toBe(true);
    expect(cheap.differenceWith(expensive)).toBe(10.0);
  });
});

