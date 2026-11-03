import { Product, ProductCategory } from '@domain/product/models/product.entity';
import { ProductRepository, ProductQueryFilters } from '@domain/product/ports/product.repository';
import { ProductMapper, ProductDto } from '../../mappers/product.mapper';

/**
 * In-Memory Implementation of ProductRepository.
 * Consulta reativamente o backend SQLite (http://localhost:3001/api/precos)
 * obedecendo rigorosamente a todos os filtros de Região, Categoria, Busca e Promoções.
 */
export class InMemoryProductRepository implements ProductRepository {
  private products: Product[] = [];

  constructor() {
    this.products = [];
  }

  public async findAll(filters: ProductQueryFilters): Promise<Product[]> {
    let list: Product[] = [];

    try {
      const params = new URLSearchParams();
      if (filters.query) {
        params.set('termo', filters.query);
      }
      if (filters.regionId && filters.regionId.toLowerCase() !== 'todas' && filters.regionId !== 'Todas as Regiões') {
        params.set('regiaoId', filters.regionId);
      }
      if (filters.category && filters.category !== 'Todas') {
        params.set('categoria', filters.category);
      }

      const queryString = params.toString();
      const url = queryString ? `http://localhost:3001/api/precos?${queryString}` : 'http://localhost:3001/api/precos';

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.dados && Array.isArray(json.dados)) {
          list = json.dados.map((p: any) => ProductMapper.toDomain(this.adaptBackendProduct(p)));
        }
      }
    } catch {
      // Fallback
      list = [...this.products];
    }

    return list.filter((product) => {
      // Filtro adicional por categoria caso venha sem filtro de backend
      if (filters.category && filters.category !== 'Todas') {
        if (!this.categoriaCorresponde(product.category, filters.category)) {
          return false;
        }
      }

      // Filtro por promoções
      if (filters.onlyPromotions) {
        const hasPromo = product.offers.some((o) => o.isOnSale);
        if (!hasPromo) return false;
      }

      // Filtro por economia mínima
      if (filters.minSavings && filters.minSavings > 0) {
        const savings = product.calculateMaxSavings().percentage;
        if (savings < filters.minSavings) return false;
      }

      return true;
    });
  }

  public async findById(id: string, _regionId: string): Promise<Product | null> {
    const all = await this.findAll({ regionId: _regionId });
    const product = all.find((p) => p.idValue === id);
    return product ?? null;
  }

  public async findFeaturedDeals(regionId: string, limit: number = 6): Promise<Product[]> {
    const all = await this.findAll({ regionId });
    return all
      .filter((p) => p.offers.some((o) => o.isOnSale) || p.calculateMaxSavings().percentage >= 15)
      .sort((a, b) => b.calculateMaxSavings().percentage - a.calculateMaxSavings().percentage)
      .slice(0, limit);
  }

  private adaptBackendProduct(p: any): ProductDto {
    return {
      id: p.id,
      name: p.nome,
      brand: p.mercadoMaisBarato || 'Supermercado',
      description: p.descricao || p.nome,
      category: this.formatarCategoria(p.categoria),
      unit: p.unidade || 'un',
      imageUrl: p.imageUrl || this.obterImagemPorCategoria(p.categoria, p.nome),
      offers: (p.ofertas || []).map((o: any) => ({
        id: o.id,
        productId: p.id,
        marketId: o.mercadoId,
        marketName: o.nomeMercado,
        priceAmount: o.preco,
        originalPriceAmount: o.precoAnterior,
        isOnSale: !!o.precoAnterior && o.precoAnterior > o.preco,
        updatedAt: o.coletadoEm || new Date().toISOString(),
      })),
    };
  }

  private categoriaCorresponde(prodCat: string, filterCat: string): boolean {
    const p = prodCat.toLowerCase();
    const f = filterCat.toLowerCase();
    if (p === f) return true;
    if (f.includes('carne') && p.includes('carne')) return true;
    if (f.includes('horti') && p.includes('horti')) return true;
    if (f.includes('lati') && p.includes('lati')) return true;
    if (f.includes('limp') && p.includes('limp')) return true;
    if (f.includes('bebid') && p.includes('bebid')) return true;
    if (f.includes('merce') && p.includes('merce')) return true;
    return false;
  }

  private formatarCategoria(slug: string): ProductCategory {
    const s = slug.toLowerCase();
    if (s.includes('carne') || s.includes('açougue')) return 'Carnes e Peixes';
    if (s.includes('horti') || s.includes('fruta') || s.includes('legume')) return 'Hortifrúti';
    if (s.includes('lati') || s.includes('leite') || s.includes('queijo')) return 'Laticínios e Frios';
    if (s.includes('limp')) return 'Limpeza';
    if (s.includes('bebid')) return 'Bebidas';
    return 'Mercearia';
  }

  private obterImagemPorCategoria(categoria: string, nome: string): string {
    const n = nome.toLowerCase();
    const c = categoria.toLowerCase();
    if (n.includes('arroz')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80';
    if (n.includes('feij')) return 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&auto=format&fit=crop&q=80';
    if (n.includes('leite')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80';
    if (n.includes('caf')) return 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80';
    if (n.includes('cervej') || c.includes('bebid')) return 'https://images.unsplash.com/photo-1608270119330-8a2455be91b9?w=400&auto=format&fit=crop&q=80';
    if (c.includes('carne') || n.includes('picanha') || n.includes('alcatra')) return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80';
    if (c.includes('horti') || n.includes('tomate') || n.includes('banana')) return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80';
    if (c.includes('limp') || n.includes('sabao') || n.includes('detergente')) return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80';
  }
}
