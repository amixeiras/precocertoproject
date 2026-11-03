import { Pool, PoolClient } from 'pg';
import {
  RegionRow,
  CategoryRow,
  MercadoData,
  OfertaScraping,
  ProdutoMonitorado,
  CategoryParameterDTO,
} from '../../domain/entities';

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
}

export class BancoPostgres {
  private static instance: BancoPostgres;
  private pool!: Pool;
  private inicializado: boolean = false;

  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL_MS = 60 * 1000;
  private cacheHits = 0;
  private cacheMisses = 0;

  private constructor() {}

  public static getInstance(): BancoPostgres {
    if (!BancoPostgres.instance) {
      BancoPostgres.instance = new BancoPostgres();
    }
    return BancoPostgres.instance;
  }

  public getCacheStats(): { size: number; hits: number; misses: number; keys: string[] } {
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      keys: Array.from(this.cache.keys()),
    };
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.cacheMisses++;
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.cacheMisses++;
      return null;
    }
    this.cacheHits++;
    return entry.data as T;
  }

  private setInCache<T>(key: string, data: T, ttlMs = this.DEFAULT_TTL_MS): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  public invalidarCache(prefixo?: string): void {
    if (!prefixo) {
      this.cache.clear();
      console.log('⚡ [Cache L1] Cache de consultas completamente invalidado.');
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefixo)) {
        this.cache.delete(key);
      }
    }
    console.log(`⚡ [Cache L1] Cache invalidado para o prefixo: "${prefixo}"`);
  }

  public async inicializar(): Promise<void> {
    if (this.inicializado) return;

    const connectionString =
      process.env['DATABASE_URL'] || 'postgresql://postgres:postgrespassword@localhost:5432/precocerto';
    this.pool = new Pool({ connectionString });

    const client = await this.pool.connect();
    try {
      await this.garantirAdminPadrao(client);
      this.inicializado = true;
      console.log(`🐘 [PostgreSQL] Conectado com sucesso ao banco PostgreSQL (${connectionString.replace(/:[^:@]+@/, ':****@')})`);
    } finally {
      client.release();
    }
  }

  public async getRegioes(): Promise<RegionRow[]> {
    const cacheKey = 'regioes';
    const cached = this.getFromCache<RegionRow[]>(cacheKey);
    if (cached) return cached;
    const res = await this.pool.query('SELECT id, name, city, state, created_at FROM REGIONS ORDER BY name ASC');
    const resultado = res.rows as RegionRow[];
    this.setInCache(cacheKey, resultado);
    return resultado;
  }

  public async getCategorias(): Promise<CategoryRow[]> {
    const cacheKey = 'categorias';
    const cached = this.getFromCache<CategoryRow[]>(cacheKey);
    if (cached) return cached;
    const res = await this.pool.query('SELECT id, name, slug, icon FROM CATEGORIES ORDER BY name ASC');
    const resultado = res.rows as CategoryRow[];
    this.setInCache(cacheKey, resultado);
    return resultado;
  }

  public async getEstatisticas(): Promise<{ regioes: number; mercados: number; produtos: number; ofertas: number }> {
    const cacheKey = 'estatisticas';
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const [reg, mkt, prd, off] = await Promise.all([
      this.pool.query('SELECT COUNT(*) as count FROM REGIONS'),
      this.pool.query('SELECT COUNT(*) as count FROM MARKETS'),
      this.pool.query('SELECT COUNT(*) as count FROM PRODUCTS'),
      this.pool.query('SELECT COUNT(*) as count FROM MARKET_OFFERS'),
    ]);

    const resultado = {
      regioes: Number(reg.rows[0].count),
      mercados: Number(mkt.rows[0].count),
      produtos: Number(prd.rows[0].count),
      ofertas: Number(off.rows[0].count),
    };
    this.setInCache(cacheKey, resultado);
    return resultado;
  }

  public async getParametrizacoesCategoria(categoriaId?: string): Promise<CategoryParameterDTO[]> {
    const cacheKey = `cat_params:${categoriaId || 'all'}`;
    const cached = this.getFromCache<CategoryParameterDTO[]>(cacheKey);
    if (cached) return cached;

    let sql = `
      SELECT 
        cp.id,
        cp.category_id as "categoryId",
        c.name as "categoryName",
        cp.description,
        cp.created_at as "createdAt"
      FROM CATEGORY_PARAMETERS cp
      JOIN CATEGORIES c ON cp.category_id = c.id
    `;
    const params: any[] = [];
    if (categoriaId) {
      sql += ' WHERE cp.category_id = $1 OR c.slug = $1';
      params.push(categoriaId);
    }
    sql += ' ORDER BY c.name ASC, cp.description ASC';

    const res = await this.pool.query(sql, params);
    const resultado = res.rows as CategoryParameterDTO[];
    this.setInCache(cacheKey, resultado);
    return resultado;
  }

  public async salvarParametrizacaoCategoria(dados: {
    id?: string;
    categoryId: string;
    description: string;
  }): Promise<{ id: string; success: boolean }> {
    const agora = new Date().toISOString();
    const id = dados.id || `param-${dados.categoryId.replace(/^cat-/, '')}-${Date.now().toString().slice(-4)}`;

    const sql = `
      INSERT INTO CATEGORY_PARAMETERS (id, category_id, description, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        description = EXCLUDED.description
    `;
    await this.pool.query(sql, [id, dados.categoryId, dados.description.trim(), agora]);
    this.invalidarCache('cat_params');
    return { id, success: true };
  }

  public async excluirParametrizacaoCategoria(id: string): Promise<{ success: boolean }> {
    const res = await this.pool.query('DELETE FROM CATEGORY_PARAMETERS WHERE id = $1', [id]);
    const success = (res.rowCount ?? 0) > 0;
    if (success) this.invalidarCache('cat_params');
    return { success };
  }

  public async getMercados(regiaoId?: string, termo?: string): Promise<MercadoData[]> {
    const cacheKey = `mercados:${regiaoId || ''}:${termo || ''}`;
    const cached = this.getFromCache<MercadoData[]>(cacheKey);
    if (cached) return cached;

    let sql = `
      SELECT 
        m.id, 
        m.name, 
        m.address, 
        m.neighborhood, 
        m.latitude, 
        m.longitude, 
        m.flyer_url,
        r.id as region_id,
        r.name as region_name,
        r.city as region_city,
        r.state as region_state
      FROM MARKETS m
      JOIN REGIONS r ON m.region_id = r.id
    `;
    const params: any[] = [];
    const isTodas = !regiaoId || ['todas', 'all', 'todas as regiões', 'todas as regioes'].includes(regiaoId.toLowerCase());
    const conditions: string[] = [];

    if (!isTodas) {
      const cleanSlug = regiaoId!.toLowerCase().trim().replace(/^reg-/, '');
      params.push(regiaoId, `%${cleanSlug}%`);
      conditions.push(`(LOWER(m.region_id) = LOWER($${params.length - 1}) OR LOWER(r.id) = LOWER($${params.length - 1}) OR LOWER(r.name) = LOWER($${params.length - 1}) OR LOWER(r.id) LIKE $${params.length})`);
    }

    if (termo && termo.trim()) {
      params.push(`%${termo.toLowerCase().trim()}%`);
      conditions.push(`(LOWER(m.name) LIKE $${params.length} OR LOWER(m.neighborhood) LIKE $${params.length} OR LOWER(m.address) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const rows = (await this.pool.query(sql, params)).rows;

    const resultado: MercadoData[] = [];
    for (const row of rows) {
      const ofertasRes = await this.pool.query(`
        SELECT 
          mo.id,
          mo.product_id,
          p.canonical_name as product_name,
          c.slug as category_slug,
          mo.current_price,
          mo.original_price,
          p.unit,
          COALESCE(mo.image_url, p.image_url) as image_url,
          mo.valid_until,
          mo.display_order,
          mo.created_at
        FROM MARKET_OFFERS mo
        JOIN PRODUCTS p ON mo.product_id = p.id
        JOIN CATEGORIES c ON p.category_id = c.id
        WHERE mo.market_id = $1 AND mo.is_active = 1
        ORDER BY mo.is_top_deal DESC, mo.display_order ASC
        LIMIT 5
      `, [row.id]);

      const topOfertas: OfertaScraping[] = ofertasRes.rows.map((o: any) => {
        const cur = Number(o.current_price);
        const orig = o.original_price ? Number(o.original_price) : undefined;
        let desconto = 0;
        if (orig && orig > cur) {
          desconto = Math.round(((orig - cur) / orig) * 100);
        }
        return {
          id: o.id,
          produtoId: o.product_id,
          nomeProduto: o.product_name,
          categoria: o.category_slug,
          mercadoId: row.id,
          nomeMercado: row.name,
          regiao: row.region_name,
          preco: cur,
          precoAnterior: orig,
          unidade: o.unit,
          descontoPercentual: desconto,
          validaAte: o.valid_until || 'Consulte encarte',
          coletadoEm: o.created_at,
          ordemExibicao: o.display_order,
          imageUrl: o.image_url || undefined,
        };
      });

      resultado.push({
        id: row.id,
        nome: row.name,
        rede: row.name.split(' ')[0] || 'Supermercado',
        regiao: row.region_name,
        regiaoId: row.region_id,
        endereco: row.address || '',
        bairro: row.neighborhood || row.region_name,
        latitude: row.latitude ? Number(row.latitude) : undefined,
        longitude: row.longitude ? Number(row.longitude) : undefined,
        flyerUrl: row.flyer_url || undefined,
        avaliacao: 4.6,
        topOfertas,
      });
    }

    this.setInCache(cacheKey, resultado);
    return resultado;
  }

  public async getMercadosComUrl(): Promise<{ id: string; name: string; region_id: string; region_name: string; flyer_url: string }[]> {
    const res = await this.pool.query(`
      SELECT m.id, m.name, m.region_id, r.name as region_name, m.flyer_url
      FROM MARKETS m
      JOIN REGIONS r ON m.region_id = r.id
      WHERE m.flyer_url IS NOT NULL AND m.flyer_url != ''
    `);
    return res.rows;
  }

  public async getProdutos(termo?: string, regiaoId?: string, categoria?: string): Promise<ProdutoMonitorado[]> {
    const cacheKey = `produtos:${termo || ''}:${regiaoId || ''}:${categoria || ''}`;
    const cached = this.getFromCache<ProdutoMonitorado[]>(cacheKey);
    if (cached) return cached;

    let sql = `
      SELECT 
        p.id as prod_id,
        p.canonical_name as prod_name,
        c.slug as category_slug,
        c.name as category_name,
        p.unit as prod_unit,
        p.image_url as prod_image
      FROM PRODUCTS p
      JOIN CATEGORIES c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (termo) {
      params.push(`%${termo.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(p.canonical_name) LIKE $${params.length} OR LOWER(c.slug) LIKE $${params.length} OR LOWER(c.name) LIKE $${params.length})`;
    }

    if (categoria && categoria !== 'Todas' && categoria !== 'all') {
      params.push(`%${categoria.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(c.slug) LIKE $${params.length} OR LOWER(c.name) LIKE $${params.length})`;
    }

    const produtos = (await this.pool.query(sql, params)).rows;
    const resultado: ProdutoMonitorado[] = [];

    const filtrarPorRegiao = regiaoId && !['todas', 'all', 'todas as regiões', 'todas as regioes'].includes(regiaoId.toLowerCase());

    for (const p of produtos) {
      let ofertasSql = `
        SELECT 
          mo.id,
          mo.product_id,
          p.canonical_name as product_name,
          c.slug as category_slug,
          m.id as market_id,
          m.name as market_name,
          r.name as region_name,
          r.id as region_id,
          mo.current_price,
          mo.original_price,
          p.unit,
          COALESCE(mo.image_url, p.image_url) as offer_image,
          mo.valid_until,
          mo.created_at
        FROM MARKET_OFFERS mo
        JOIN PRODUCTS p ON mo.product_id = p.id
        JOIN CATEGORIES c ON p.category_id = c.id
        JOIN MARKETS m ON mo.market_id = m.id
        JOIN REGIONS r ON m.region_id = r.id
        WHERE mo.product_id = $1 AND mo.is_active = 1
      `;
      const ofParams: any[] = [p.prod_id];
      if (filtrarPorRegiao) {
        const clean = regiaoId!.toLowerCase().trim().replace(/^reg-/, '');
        ofParams.push(regiaoId, `%${clean}%`);
        ofertasSql += ` AND (LOWER(r.id) = LOWER($2) OR LOWER(m.region_id) = LOWER($2) OR LOWER(r.name) = LOWER($2) OR LOWER(r.id) LIKE $3)`;
      }
      ofertasSql += ' ORDER BY mo.current_price ASC';

      const ofertasRows = (await this.pool.query(ofertasSql, ofParams)).rows;
      if (ofertasRows.length === 0) continue;

      const ofertas: OfertaScraping[] = ofertasRows.map((o: any) => {
        const cur = Number(o.current_price);
        const orig = o.original_price ? Number(o.original_price) : undefined;
        let desc = 0;
        if (orig && orig > cur) {
          desc = Math.round(((orig - cur) / orig) * 100);
        }
        return {
          id: o.id,
          produtoId: o.product_id,
          nomeProduto: o.product_name,
          categoria: o.category_slug,
          mercadoId: o.market_id,
          nomeMercado: o.market_name,
          regiao: o.region_name,
          preco: cur,
          precoAnterior: orig,
          unidade: o.unit,
          descontoPercentual: desc,
          validaAte: o.valid_until || 'Consulte encarte',
          coletadoEm: o.created_at,
          imageUrl: o.offer_image || undefined,
        };
      });

      resultado.push({
        id: p.prod_id,
        nome: p.prod_name,
        descricao: p.prod_name,
        categoria: p.category_slug,
        unidade: p.prod_unit,
        melhorPreco: ofertas[0]!.preco,
        mercadoMaisBarato: ofertas[0]!.nomeMercado,
        imageUrl: p.prod_image || (ofertas[0] && ofertas[0].imageUrl) || undefined,
        ofertas,
      });
    }

    this.setInCache(cacheKey, resultado);
    return resultado;
  }

  public async salvarOfertas(novasOfertas: OfertaScraping[]): Promise<void> {
    if (novasOfertas.length === 0) return;
    const agora = new Date().toISOString();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < novasOfertas.length; i++) {
        const o = novasOfertas[i]!;

        // 1. Região
        const regRes = await client.query('SELECT id FROM REGIONS WHERE LOWER(name) = LOWER($1) LIMIT 1', [o.regiao]);
        let regionId: string;
        if (regRes.rowCount === 0) {
          regionId = `reg-${o.regiao.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          await client.query(
            'INSERT INTO REGIONS (id, name, city, state, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
            [regionId, o.regiao, 'Mogi das Cruzes', 'SP', agora]
          );
        } else {
          regionId = regRes.rows[0].id;
        }

        // 2. Categoria
        const catRes = await client.query('SELECT id FROM CATEGORIES WHERE slug = $1 LIMIT 1', [o.categoria]);
        const categoryId = catRes.rowCount ? catRes.rows[0].id : 'cat-mercearia';

        // 3. Mercado
        const mktRes = await client.query('SELECT id FROM MARKETS WHERE id = $1 OR LOWER(name) = LOWER($2) LIMIT 1', [o.mercadoId, o.nomeMercado]);
        let marketId: string;
        if (mktRes.rowCount === 0) {
          marketId = o.mercadoId;
          await client.query(`
            INSERT INTO MARKETS (id, region_id, name, address, neighborhood, latitude, longitude, flyer_url, created_at)
            VALUES ($1, $2, $3, $4, $5, -23.52, -46.19, $6, $7)
            ON CONFLICT (id) DO UPDATE SET flyer_url = COALESCE(EXCLUDED.flyer_url, MARKETS.flyer_url)
          `, [marketId, regionId, o.nomeMercado, `${o.nomeMercado} - ${o.regiao}`, o.regiao, o.flyerUrl || null, agora]);
        } else {
          marketId = mktRes.rows[0].id;
          if (o.flyerUrl) {
            await client.query('UPDATE MARKETS SET flyer_url = $1 WHERE id = $2', [o.flyerUrl, marketId]);
          }
        }

        // 4. Produto
        const prodRes = await client.query('SELECT id FROM PRODUCTS WHERE id = $1 OR LOWER(canonical_name) = LOWER($2) LIMIT 1', [o.produtoId, o.nomeProduto]);
        let productId: string;
        if (prodRes.rowCount === 0) {
          productId = o.produtoId;
          await client.query(`
            INSERT INTO PRODUCTS (id, category_id, canonical_name, barcode_ean, unit, image_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              canonical_name = EXCLUDED.canonical_name,
              image_url = COALESCE(EXCLUDED.image_url, PRODUCTS.image_url)
          `, [productId, categoryId, o.nomeProduto, o.barcodeEan || null, o.unidade || 'un', o.imageUrl || null, agora]);
        } else {
          productId = prodRes.rows[0].id;
        }

        // 5. Oferta
        const isTopDeal = i < 5 ? 1 : 0;
        const displayOrder = (i % 5) + 1;
        await client.query(`
          INSERT INTO MARKET_OFFERS (id, market_id, product_id, current_price, original_price, is_top_deal, display_order, valid_until, image_url, is_active, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, $10)
          ON CONFLICT (id) DO UPDATE SET
            current_price = EXCLUDED.current_price,
            original_price = EXCLUDED.original_price,
            valid_until = EXCLUDED.valid_until,
            image_url = COALESCE(EXCLUDED.image_url, MARKET_OFFERS.image_url),
            is_active = 1
        `, [o.id, marketId, productId, o.preco, o.precoAnterior || null, isTopDeal, displayOrder, o.validaAte || 'Consulte encarte', o.imageUrl || null, agora]);
      }

      await client.query('COMMIT');
      this.invalidarCache();
      console.log(`💾 [PostgreSQL] ${novasOfertas.length} ofertas salvas com sucesso!`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  public classificarCategoriaProduto(nomeProduto: string, categoriaSugerida?: string): string {
    if (categoriaSugerida) {
      const catSlug = categoriaSugerida.toLowerCase().replace(/^cat-/, '');
      if (['carnes', 'hortifruti', 'mercearia', 'laticinios', 'bebidas', 'limpeza'].includes(catSlug)) {
        return `cat-${catSlug}`;
      }
    }
    const t = nomeProduto.toLowerCase();
    if (t.match(/\b(carne|picanha|alcatra|contrafilé|contrafile|acem|acém|costela|frango|coxa|sobrecoxa|peito de frango|linguica|linguiça|bacon|pernil|bovino|suino|suíno|peixe|tilapia|tilápia|salmao|salmão|file|filé|patinho|cupim|maminha|hamburguer|hambúrguer|bife|costelinha|salsicha|paleta|coxao|coxão|mignon)\b/i)) return 'cat-carnes';
    if (t.match(/\b(banana|maca|maçã|laranja|tomate|batata|cebola|cenoura|alface|limao|limão|manga|uva|abacaxi|melancia|mamao|mamão|alho|pera|pêra|fruta|legume|verdura|couve|repolho|brocolis|brócolis|pepino|chuchu|mandioca|maracuja|maracujá|morango|abacate|beterraba|pimentao|pimentão|abobora|abóbora)\b/i)) return 'cat-hortifruti';
    if (t.match(/\b(leite|iogurte|queijo|manteiga|requeijao|requeijão|mussarela|muçarela|prato|parmesao|parmesão|creme de leite|leite condensado|ovos|ovo|ricota|cottage|danone|parmesan|gouda|cheddar|provolone|coalho|nata|margarina)\b/i)) return 'cat-laticinios';
    if (t.match(/\b(cerveja|refrigerante|suco|agua|água|vinho|vodka|energetico|energético|cha|chá|whisky|gin|coca|pepsi|guarana|guaraná|fanta|sprite|heineken|amstel|skol|brahma|antarctica|budweiser|corona|espumante|nectar|néctar|isotônico|gatorade)\b/i)) return 'cat-bebidas';
    if (t.match(/\b(sabao|sabão|detergente|amaciante|desinfetante|papel higienico|papel higiênico|shampoo|condicionador|creme dental|sabonete|esponja|limpador|cloro|agua sanitaria|água sanitária|lã de aco|lava roupas|vanish|omo|ypê|ype|veja|downy|comfort|brilhante|ipê|ipe|lustra|multiuso|desodorante|fralda|absorvente)\b/i)) return 'cat-limpeza';
    return 'cat-mercearia';
  }

  public async salvarOfertasRegraScraper(
    marketId: string,
    categoryId: string | undefined,
    offers: any[],
    catalogUrl?: string,
    patternId?: string
  ): Promise<void> {
    if (!offers || offers.length === 0) return;
    const agora = new Date().toISOString();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Mercado
      const mktRes = await client.query('SELECT id FROM MARKETS WHERE id = $1 OR LOWER(name) = LOWER($2) LIMIT 1', [marketId, marketId]);
      if (mktRes.rowCount === 0) {
        let nomeMercado = marketId.replace(/^mkt-/, '').replace(/-/g, ' ');
        nomeMercado = nomeMercado.charAt(0).toUpperCase() + nomeMercado.slice(1);
        let regiaoId = 'reg-centro';
        if (marketId.toLowerCase().includes('davo')) {
          nomeMercado = "D'avó Supermercados";
          regiaoId = 'reg-alto-ipiranga';
        } else if (marketId.toLowerCase().includes('shibata')) {
          nomeMercado = 'Shibata Supermercados';
          regiaoId = 'reg-mogilar';
        }
        await client.query(`
          INSERT INTO MARKETS (id, region_id, name, address, neighborhood, latitude, longitude, flyer_url, created_at)
          VALUES ($1, $2, $3, $4, $5, -23.52, -46.19, $6, $7)
          ON CONFLICT (id) DO UPDATE SET flyer_url = COALESCE(EXCLUDED.flyer_url, MARKETS.flyer_url)
        `, [marketId, regiaoId, nomeMercado, `${nomeMercado} - Unidade Principal`, 'Centro', catalogUrl || null, agora]);
      } else if (catalogUrl) {
        await client.query('UPDATE MARKETS SET flyer_url = $1 WHERE id = $2', [catalogUrl, marketId]);
      }

      // 2. Vínculo do padrão
      if (patternId) {
        const mspId = `msp-${marketId}-${patternId}`;
        await client.query(`
          INSERT INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            catalog_url = COALESCE(EXCLUDED.catalog_url, MARKET_SCRAPER_PATTERNS.catalog_url),
            pattern_id = EXCLUDED.pattern_id,
            scraper_patterns_id = EXCLUDED.scraper_patterns_id
        `, [mspId, marketId, patternId, patternId, catalogUrl || null, agora]);
      }

      // Desativa ofertas antigas do estabelecimento
      await client.query('UPDATE MARKET_OFFERS SET is_active = 0 WHERE market_id = $1', [marketId]);

      for (let index = 0; index < offers.length; index++) {
        const item = offers[index];
        const prodSlug =
          'prod-' +
          item.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 40);

        const itemCategory = this.classificarCategoriaProduto(item.name, item.category || item.categoria || categoryId);

        const prodRes = await client.query('SELECT id FROM PRODUCTS WHERE id = $1 OR LOWER(canonical_name) = LOWER($2) LIMIT 1', [prodSlug, item.name]);
        let finalProdId = prodSlug;

        if (prodRes.rowCount && prodRes.rows[0]) {
          finalProdId = prodRes.rows[0].id;
        } else {
          await client.query(`
            INSERT INTO PRODUCTS (id, category_id, canonical_name, barcode_ean, unit, image_url, created_at)
            VALUES ($1, $2, $3, NULL, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              canonical_name = EXCLUDED.canonical_name,
              category_id = EXCLUDED.category_id,
              image_url = COALESCE(EXCLUDED.image_url, PRODUCTS.image_url)
          `, [finalProdId, itemCategory, item.name, item.unit || 'un', item.imageUrl || null, agora]);
        }

        const offerId = `off-${marketId}-${finalProdId}`;
        const isTopDeal = index < 5 ? 1 : 0;
        const displayOrder = index + 1;

        await client.query(`
          INSERT INTO MARKET_OFFERS (id, market_id, product_id, current_price, original_price, is_top_deal, display_order, valid_until, image_url, is_active, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP + INTERVAL '7 days', $8, 1, $9)
          ON CONFLICT (id) DO UPDATE SET
            current_price = EXCLUDED.current_price,
            original_price = EXCLUDED.original_price,
            image_url = COALESCE(EXCLUDED.image_url, MARKET_OFFERS.image_url),
            is_active = 1,
            valid_until = EXCLUDED.valid_until
        `, [offerId, marketId, finalProdId, item.currentPrice, item.originalPrice || null, isTopDeal, displayOrder, item.imageUrl || null, agora]);
      }

      await client.query('COMMIT');
      this.invalidarCache();
      console.log(`💾 [PostgreSQL] ${offers.length} produtos/ofertas salvos no PostgreSQL para o mercado ${marketId}!`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  public async getScraperPatterns(): Promise<any[]> {
    const cacheKey = 'scraper_patterns';
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const res = await this.pool.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.card_container as "cardContainer",
        sp.product_name as "productName",
        sp.current_price as "currentPrice",
        sp.original_price as "originalPrice",
        sp.discount_tag as "discountTag",
        sp.unit,
        sp.image_selector as "imageSelector",
        sp.created_at as "createdAt",
        msp.market_id as "marketId",
        m.name as "marketName",
        msp.catalog_url as "catalogUrl",
        COALESCE(msp.scraper_patterns_id, msp.pattern_id, sp.id) as "scraperPatternsId",
        COALESCE(msp.pattern_id, sp.id) as "patternId"
      FROM SCRAPER_PATTERNS sp
      LEFT JOIN MARKET_SCRAPER_PATTERNS msp ON (sp.id = msp.pattern_id OR sp.id = msp.scraper_patterns_id)
      LEFT JOIN MARKETS m ON msp.market_id = m.id
      ORDER BY sp.name ASC
    `);

    const resultado = res.rows;
    this.setInCache(cacheKey, resultado);
    return resultado;
  }

  public async salvarOuAtualizarPadraoScraper(dados: {
    id?: string;
    name: string;
    cardContainer: string;
    productName: string;
    currentPrice: string;
    originalPrice?: string;
    discountTag?: string;
    unit?: string;
    imageSelector?: string;
    marketId?: string;
    catalogUrl?: string;
  }): Promise<{ id: string; success: boolean }> {
    const agora = new Date().toISOString();
    const id = dados.id || `pat-${dados.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const sql = `
      INSERT INTO SCRAPER_PATTERNS (id, name, card_container, product_name, current_price, original_price, discount_tag, unit, image_selector, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        card_container = EXCLUDED.card_container,
        product_name = EXCLUDED.product_name,
        current_price = EXCLUDED.current_price,
        original_price = EXCLUDED.original_price,
        discount_tag = EXCLUDED.discount_tag,
        unit = EXCLUDED.unit,
        image_selector = EXCLUDED.image_selector
    `;

    await this.pool.query(sql, [
      id,
      dados.name,
      dados.cardContainer,
      dados.productName,
      dados.currentPrice,
      dados.originalPrice || null,
      dados.discountTag || null,
      dados.unit || null,
      dados.imageSelector || null,
      agora,
    ]);

    if (dados.marketId) {
      const mspId = `msp-${dados.marketId}-${id}`;
      await this.pool.query(`
        INSERT INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          catalog_url = COALESCE(EXCLUDED.catalog_url, MARKET_SCRAPER_PATTERNS.catalog_url),
          pattern_id = EXCLUDED.pattern_id,
          scraper_patterns_id = EXCLUDED.scraper_patterns_id
      `, [mspId, dados.marketId, id, id, dados.catalogUrl || null, agora]);
    }

    this.invalidarCache();
    return { id, success: true };
  }

  public async excluirPadraoScraper(id: string): Promise<{ sucesso: boolean; erro?: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM MARKET_SCRAPER_PATTERNS WHERE pattern_id = $1 OR scraper_patterns_id = $1', [id]);
      const res = await client.query('DELETE FROM SCRAPER_PATTERNS WHERE id = $1', [id]);
      await client.query('COMMIT');
      this.invalidarCache();
      return { sucesso: (res.rowCount ?? 0) > 0 };
    } catch (e: any) {
      await client.query('ROLLBACK');
      return { sucesso: false, erro: e.message };
    } finally {
      client.release();
    }
  }

  public async garantirAdminPadrao(client?: PoolClient): Promise<void> {
    const runner = client || this.pool;
    try {
      const res = await runner.query('SELECT COUNT(*) as count FROM USERS');
      if (Number(res.rows[0].count) === 0) {
        await runner.query(`
          INSERT INTO USERS (id, username, password, created_at)
          VALUES ('usr-admin', 'admin', 'Play@2026', CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('👤 [PostgreSQL] Usuário administrador padrão (admin / Play@2026) criado com sucesso!');
      }
    } catch (e) {
      console.warn('⚠️ [PostgreSQL] Falha ao verificar tabela USERS:', e);
    }
  }

  public async autenticarUsuario(username: string, password: string): Promise<{ id: string; username: string } | null> {
    try {
      const res = await this.pool.query(
        'SELECT id, username FROM USERS WHERE LOWER(username) = LOWER($1) AND password = $2',
        [username.trim(), password]
      );
      return res.rowCount && res.rows[0] ? { id: res.rows[0].id, username: res.rows[0].username } : null;
    } catch {
      return null;
    }
  }

  public async atualizarDescricaoMercado(id: string, novoNome: string): Promise<boolean> {
    const res = await this.pool.query('UPDATE MARKETS SET name = $1 WHERE id = $2', [novoNome.trim(), id]);
    const success = (res.rowCount ?? 0) > 0;
    if (success) this.invalidarCache();
    return success;
  }

  public async excluirMercado(id: string): Promise<{ sucesso: boolean; ofertasExcluidas: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resOffers = await client.query('DELETE FROM MARKET_OFFERS WHERE market_id = $1', [id]);
      const resMarket = await client.query('DELETE FROM MARKETS WHERE id = $1', [id]);
      await client.query('COMMIT');
      const sucesso = (resMarket.rowCount ?? 0) > 0;
      if (sucesso) this.invalidarCache();
      return { sucesso, ofertasExcluidas: resOffers.rowCount ?? 0 };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  public async limparTodosOsDados(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM MARKET_OFFERS');
      await client.query('DELETE FROM PRODUCTS');
      await client.query('DELETE FROM MARKETS');
      await client.query('DELETE FROM CATEGORY_PARAMETERS');
      await client.query('COMMIT');
      this.invalidarCache();
      console.log('🧹 [PostgreSQL] Mercados, produtos e ofertas apagados com sucesso!');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
