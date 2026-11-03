/**
 * Entidades do Banco de Dados SQLite (Alinhadas ao Diagrama ER)
 */

export interface RegionRow {
  id: string;
  name: string;
  city: string;
  state: string;
  created_at: string;
}

export interface MarketRow {
  id: string;
  region_id: string;
  name: string;
  address: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  flyer_url: string | null;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface CategoryParameterRow {
  id: string;
  category_id: string;
  description: string;
  created_at: string;
}

export interface CategoryParameterDTO {
  id: string;
  categoryId: string;
  categoryName?: string;
  description: string;
  createdAt: string;
}

export interface ProductRow {
  id: string;
  category_id: string;
  canonical_name: string;
  barcode_ean: string | null;
  unit: string;
  image_url?: string | null;
  created_at: string;
}

export interface MarketOfferRow {
  id: string;
  market_id: string;
  product_id: string;
  current_price: number;
  original_price: number | null;
  is_top_deal: number; // 0 ou 1
  display_order: number; // 1 a 5
  valid_until: string | null;
  image_url?: string | null;
  is_active: number; // 0 ou 1
  created_at: string;
}

export interface ScraperPatternRow {
  id: string;
  name: string;
  card_container: string;
  product_name: string;
  current_price: string;
  original_price: string | null;
  discount_tag: string | null;
  unit: string | null;
  image_selector: string | null;
  created_at: string;
}

export interface MarketScraperPatternRow {
  id: string;
  market_id: string;
  pattern_id: string;
  scraper_patterns_id?: string;
  catalog_url: string | null;
  created_at: string;
}

/**
 * Visualizações e DTOs de Domínio para compatibilidade e API
 */
export interface MercadoData {
  id: string;
  nome: string;
  rede: string;
  regiao: string;
  regiaoId?: string;
  endereco: string;
  bairro?: string;
  latitude?: number;
  longitude?: number;
  flyerUrl?: string;
  avaliacao: number;
  topOfertas?: OfertaScraping[];
}

export interface OfertaScraping {
  id: string;
  produtoId: string;
  nomeProduto: string;
  categoria: string;
  mercadoId: string;
  nomeMercado: string;
  regiao: string;
  preco: number;
  precoAnterior?: number;
  unidade: string;
  descontoPercentual: number;
  validaAte: string;
  coletadoEm: string;
  isTopDeal?: boolean;
  ordemExibicao?: number;
  flyerUrl?: string;
  barcodeEan?: string;
  imageUrl?: string;
}

export interface ProdutoMonitorado {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  melhorPreco: number;
  mercadoMaisBarato: string;
  imageUrl?: string;
  descricao?: string;
  ofertas: OfertaScraping[];
}
