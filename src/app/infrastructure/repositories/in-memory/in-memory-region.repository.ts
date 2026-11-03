import { Region } from '@domain/region/models/region.entity';
import { Coordinates } from '@domain/region/models/coordinates.vo';
import { RegionRepository } from '@domain/region/ports/region.repository';
import { RegionMapper, RegionDto } from '../../mappers/region.mapper';

/**
 * In-Memory Implementation of RegionRepository.
 * Provides realistic regions for development and testing.
 * Liskov Substitution Principle: Interchangable with HttpRegionRepository.
 */
export class InMemoryRegionRepository implements RegionRepository {
  private readonly regions: Region[];

  constructor() {
    const rawData: RegionDto[] = [
      {
        id: 'todas',
        name: 'Todas as Regiões',
        state: 'SP',
        latitude: -23.5205,
        longitude: -46.1858,
        radiusKm: 100,
        neighborhoods: ['Centro', 'Vila Oliveira', 'Mogilar', 'Alto Ipiranga', 'Braz Cubas', 'César de Souza'],
      },
      {
        id: 'Centro',
        name: 'Centro',
        state: 'SP',
        latitude: -23.5235,
        longitude: -46.1878,
        radiusKm: 5,
        neighborhoods: ['Centro Histórico', 'Praça da Matriz', 'Jardim Santista'],
      },
      {
        id: 'Vila Oliveira',
        name: 'Vila Oliveira',
        state: 'SP',
        latitude: -23.5350,
        longitude: -46.1780,
        radiusKm: 5,
        neighborhoods: ['Vila Oliveira', 'Jardim Maricá', 'Socorro'],
      },
      {
        id: 'Mogilar',
        name: 'Mogilar',
        state: 'SP',
        latitude: -23.5150,
        longitude: -46.1820,
        radiusKm: 5,
        neighborhoods: ['Mogilar', 'Nova Mogilar', 'Ponte Grande'],
      },
      {
        id: 'Alto Ipiranga',
        name: 'Alto Ipiranga',
        state: 'SP',
        latitude: -23.5380,
        longitude: -46.2050,
        radiusKm: 5,
        neighborhoods: ['Alto Ipiranga', 'Chácara Jafet', 'Parque Santana'],
      },
      {
        id: 'Braz Cubas',
        name: 'Braz Cubas',
        state: 'SP',
        latitude: -23.5450,
        longitude: -46.2300,
        radiusKm: 6,
        neighborhoods: ['Braz Cubas', 'Jundiapeba', 'Vila Cintra'],
      },
      {
        id: 'César de Souza',
        name: 'César de Souza',
        state: 'SP',
        latitude: -23.5020,
        longitude: -46.1450,
        radiusKm: 6,
        neighborhoods: ['César de Souza', 'Botujuru', 'Rio Abaixo'],
      },
      {
        id: 'sp-capital',
        name: 'São Paulo - Capital (Centro/Sul)',
        state: 'SP',
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 25,
        neighborhoods: ['Pinheiros', 'Moema', 'Vila Mariana', 'Paulista', 'Santo Amaro', 'Saúde'],
      },
      {
        id: 'sp-abc',
        name: 'Grande ABC Paulista',
        state: 'SP',
        latitude: -23.6558,
        longitude: -46.5333,
        radiusKm: 20,
        neighborhoods: ['Santo André', 'São Bernardo do Campo', 'São Caetano do Sul', 'Diadema'],
      },
    ];

    this.regions = rawData.map(RegionMapper.toDomain);
  }

  public async findAll(): Promise<Region[]> {
    try {
      const response = await fetch('http://localhost:3001/api/regioes');
      if (response.ok) {
        const json = await response.json();
        if (json.dados && Array.isArray(json.dados) && json.dados.length > 0) {
          const apiRegions: RegionDto[] = [
            {
              id: 'todas',
              name: 'Todas as Regiões',
              state: 'SP',
              latitude: -23.5205,
              longitude: -46.1858,
              radiusKm: 100,
              neighborhoods: json.dados.map((r: any) => r.name),
            },
            ...json.dados.map((r: any) => ({
              id: r.id,
              name: r.name,
              state: r.state || 'SP',
              latitude: -23.52,
              longitude: -46.18,
              radiusKm: 5,
              neighborhoods: [r.name],
            })),
          ];
          return apiRegions.map(RegionMapper.toDomain);
        }
      }
    } catch {
      // Fallback
    }
    return [...this.regions];
  }

  public async findById(id: string): Promise<Region | null> {
    const list = await this.findAll();
    const region = list.find((r) => r.idValue.toLowerCase() === id.toLowerCase() || r.name.toLowerCase() === id.toLowerCase());
    return region ?? null;
  }

  public async findByCoordinates(coords: Coordinates): Promise<Region | null> {
    let nearest: Region | null = null;
    let minDistance = Infinity;

    for (const region of this.regions) {
      if (region.idValue === 'todas') continue;
      const distance = region.centerCoordinates.distanceTo(coords);
      if (distance <= region.radiusKm && distance < minDistance) {
        minDistance = distance;
        nearest = region;
      }
    }

    return nearest ?? this.regions[0];
  }
}
