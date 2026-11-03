import { Coordinates } from './coordinates.vo';

describe('Coordinates Value Object (DDD)', () => {
  it('should create valid Coordinates', () => {
    const result = Coordinates.create(-23.5505, -46.6333);
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().latitude).toBe(-23.5505);
    expect(result.getValue().longitude).toBe(-46.6333);
  });

  it('should reject invalid latitude', () => {
    const result = Coordinates.create(95.0, 0);
    expect(result.isFailure).toBe(true);
  });

  it('should calculate Haversine distance between SP and Rio correctly', () => {
    // São Paulo center
    const sp = Coordinates.create(-23.5505, -46.6333).getValue();
    // Rio de Janeiro center
    const rj = Coordinates.create(-22.9068, -43.1729).getValue();

    const distanceKm = sp.distanceTo(rj);
    // Approximate distance is between 350 and 370 km
    expect(distanceKm).toBeGreaterThan(340);
    expect(distanceKm).toBeLessThan(380);
  });
});

