import { SearchProductsUseCase } from './search-products.usecase';
import { ProductRepository } from '@domain/product/ports/product.repository';
import { Product } from '@domain/product/models/product.entity';
import { PriceOffer } from '@domain/product/models/price-offer.entity';
import { Price } from '@domain/product/models/price.vo';

describe('SearchProductsUseCase (Application Layer)', () => {
  let mockProductRepo: ProductRepository;
  let useCase: SearchProductsUseCase;

  const mockProductA = new Product('prod-a', {
    name: 'Arroz',
    brand: 'Camil',
    description: 'Arroz Branco',
    category: 'Mercearia',
    unit: '5kg',
    imageUrl: '',
    offers: [
      new PriceOffer('off-1', {
        productId: 'prod-a',
        marketId: 'market-1',
        marketName: 'Mercado 1',
        price: Price.create(30.0).getValue(),
        isOnSale: false,
        updatedAt: new Date(),
      }),
    ],
  });

  const mockProductB = new Product('prod-b', {
    name: 'Feijão',
    brand: 'Camil',
    description: 'Feijão Carioca',
    category: 'Mercearia',
    unit: '1kg',
    imageUrl: '',
    offers: [
      new PriceOffer('off-2', {
        productId: 'prod-b',
        marketId: 'market-1',
        marketName: 'Mercado 1',
        price: Price.create(8.0).getValue(),
        isOnSale: true,
        updatedAt: new Date(),
      }),
    ],
  });

  beforeEach(() => {
    mockProductRepo = {
      findAll: vi.fn().mockResolvedValue([mockProductA, mockProductB]),
      findById: vi.fn(),
      findFeaturedDeals: vi.fn(),
    };

    useCase = new SearchProductsUseCase(mockProductRepo);
  });

  it('should return products sorted by cheapest price', async () => {
    const results = await useCase.execute({
      regionId: 'sp-capital',
      sortBy: 'cheapest',
    });

    expect(results.length).toBe(2);
    // Feijão (8.00) is cheaper than Arroz (30.00)
    expect(results[0].name).toBe('Feijão');
    expect(results[1].name).toBe('Arroz');
  });

  it('should return empty array if regionId is not provided', async () => {
    const results = await useCase.execute({
      regionId: '',
    });

    expect(results).toEqual([]);
    expect(mockProductRepo.findAll).not.toHaveBeenCalled();
  });
});

