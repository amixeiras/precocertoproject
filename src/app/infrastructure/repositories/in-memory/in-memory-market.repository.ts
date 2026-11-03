import { Market } from '@domain/market/models/market.entity';
import { MarketRepository } from '@domain/market/ports/market.repository';
import { MarketMapper, MarketDto } from '../../mappers/market.mapper';

/**
 * In-Memory Implementation of MarketRepository.
 * Todos os dados mockados foram limpos a pedido do usuário.
 * Integra de forma reativa com o backend SQLite (http://localhost:3001/api/mercados)
 * para exibir os supermercados e ofertas obtidos via scanner Playwright.
 */
export class InMemoryMarketRepository implements MarketRepository {
  private markets: Market[] = [];

  constructor() {
    // Inicializado completamente vazio para testes limpos via escaneamento de URL
    this.markets = [];
  }

  public async findAll(): Promise<Market[]> {
    try {
      const response = await fetch('http://localhost:3001/api/mercados');
      if (response.ok) {
        const json = await response.json();
        if (json.dados && Array.isArray(json.dados)) {
          return json.dados.map((m: any) => MarketMapper.toDomain(this.adaptBackendMercado(m)));
        }
      }
    } catch {
      // Fallback em caso de backend indisponível
    }
    return [...this.markets];
  }

  public async findById(id: string): Promise<Market | null> {
    const all = await this.findAll();
    const market = all.find((m) => m.idValue === id);
    return market ?? null;
  }

  public async findByRegionId(regionId: string): Promise<Market[]> {
    try {
      const isTodas = !regionId || regionId.toLowerCase() === 'todas' || regionId === 'Todas as Regiões';
      const url = isTodas
        ? 'http://localhost:3001/api/mercados'
        : `http://localhost:3001/api/mercados?regiaoId=${encodeURIComponent(regionId)}`;

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.dados && Array.isArray(json.dados)) {
          return json.dados.map((m: any) => MarketMapper.toDomain(this.adaptBackendMercado(m)));
        }
      }
    } catch {
      // Fallback em caso de backend indisponível
    }

    if (!regionId || regionId.toLowerCase() === 'todas' || regionId === 'Todas as Regiões') {
      return [...this.markets];
    }

    return this.markets.filter(
      (m) =>
        m.regionId.toLowerCase() === regionId.toLowerCase() ||
        m.regionName.toLowerCase() === regionId.toLowerCase()
    );
  }

  private adaptBackendMercado(m: any): MarketDto {
    return {
      id: m.id,
      name: m.nome,
      chainName: m.rede || m.nome,
      logoUrl: this.obterLogoMercado(m.nome),
      regionId: m.regiaoId || m.regiao,
      regionName: m.regiao,
      street: m.endereco || '',
      number: '',
      neighborhood: m.bairro || m.regiao,
      city: 'Mogi das Cruzes',
      state: 'SP',
      zipCode: '08700-000',
      latitude: m.latitude || -23.52,
      longitude: m.longitude || -46.18,
      openingHours: 'Seg a Sáb: 07h às 22h • Dom: 07h às 20h',
      rating: m.avaliacao || 4.6,
      tagline: 'Ofertas Verificadas',
      color: 'from-emerald-700 to-green-600',
      logoBg: 'bg-emerald-600',
      logoLetter: m.nome ? m.nome.charAt(0).toUpperCase() : 'M',
      distanceText: 'Próximo de você',
      reviewsCount: 120,
      mapsQuery: `${m.nome} ${m.regiao}`,
      featuredBadge: 'Encarte Oficial',
      offers: (m.topOfertas || []).map((o: any, idx: number) => ({
        id: o.id || `off-${idx}`,
        name: o.nomeProduto,
        category: o.categoria || 'mercearia',
        oldPrice: o.precoAnterior,
        price: o.preco,
        discount: o.descontoPercentual || 0,
        validUntil: o.validaAte || 'Consulte encarte',
        tag: 'Destaque',
        unit: o.unidade || 'un',
        imageUrl: o.imageUrl,
        imgIcon: '🛒',
      })),
    };
  }

  private obterLogoMercado(nome: string): string {
    const n = nome.toLowerCase();
    if (n.includes('shibata')) return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80';
    if (n.includes('alabarce')) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
    if (n.includes('assai')) return 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200&auto=format&fit=crop&q=80';
    if (n.includes('davo') || n.includes("d'avó")) return 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200&auto=format&fit=crop&q=80';
    if (n.includes('semar')) return 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=200&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80';
  }
}
