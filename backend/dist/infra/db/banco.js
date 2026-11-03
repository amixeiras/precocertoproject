"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BancoDadosTs = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class BancoDadosTs {
    static instance;
    dbPath;
    db;
    inicializado = false;
    // ==============================================================================
    // CAMADA DE CACHE EM MEMÓRIA (L1 IN-MEMORY QUERY CACHE)
    // ==============================================================================
    cache = new Map();
    DEFAULT_TTL_MS = 60 * 1000; // 60 segundos de TTL
    cacheHits = 0;
    cacheMisses = 0;
    getCacheStats() {
        return {
            size: this.cache.size,
            hits: this.cacheHits,
            misses: this.cacheMisses,
            keys: Array.from(this.cache.keys()),
        };
    }
    getFromCache(key) {
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
        return entry.data;
    }
    setInCache(key, data, ttlMs = this.DEFAULT_TTL_MS) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });
    }
    invalidarCache(prefixo) {
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
    constructor() {
        // Garante que o diretório backend/data exista
        const dataDir = path.resolve(__dirname, '../../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.dbPath = path.join(dataDir, 'precocerto.db');
    }
    static getInstance() {
        if (!BancoDadosTs.instance) {
            BancoDadosTs.instance = new BancoDadosTs();
        }
        return BancoDadosTs.instance;
    }
    async inicializar() {
        if (this.inicializado)
            return;
        try {
            this.db = new better_sqlite3_1.default(this.dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
            this.criarTabelas();
            this.garantirAdminPadrao();
            this.inicializado = true;
            console.log(`🗄️ [SQLite] Banco de dados conectado com sucesso em: ${this.dbPath}`);
        }
        catch (error) {
            console.error('❌ [SQLite] Erro fatal ao inicializar banco de dados SQLite:', error);
            throw error;
        }
    }
    /**
     * Criação das Tabelas de acordo com o Diagrama ER
     */
    criarTabelas() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS REGIONS (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS MARKETS (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        neighborhood TEXT,
        latitude REAL,
        longitude REAL,
        flyer_url TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (region_id) REFERENCES REGIONS(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS CATEGORIES (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT
      );

      CREATE TABLE IF NOT EXISTS PRODUCTS (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        canonical_name TEXT NOT NULL,
        barcode_ean TEXT UNIQUE,
        unit TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES CATEGORIES(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS MARKET_OFFERS (
        id TEXT PRIMARY KEY,
        market_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        current_price REAL NOT NULL,
        original_price REAL,
        is_top_deal INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 1,
        valid_until TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (market_id) REFERENCES MARKETS(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES PRODUCTS(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_markets_region ON MARKETS(region_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON PRODUCTS(category_id);
      CREATE INDEX IF NOT EXISTS idx_offers_market ON MARKET_OFFERS(market_id);
      CREATE INDEX IF NOT EXISTS idx_offers_product ON MARKET_OFFERS(product_id);
      CREATE INDEX IF NOT EXISTS idx_offers_top_deal ON MARKET_OFFERS(is_top_deal);

      CREATE TABLE IF NOT EXISTS USERS (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON USERS(username);

      CREATE TABLE IF NOT EXISTS SCRAPER_PATTERNS (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        card_container TEXT NOT NULL,
        product_name TEXT NOT NULL,
        current_price TEXT NOT NULL,
        original_price TEXT,
        discount_tag TEXT,
        unit TEXT,
        image_selector TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS MARKET_SCRAPER_PATTERNS (
        id TEXT PRIMARY KEY,
        market_id TEXT NOT NULL,
        pattern_id TEXT NOT NULL,
        scraper_patterns_id TEXT,
        catalog_url TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (market_id) REFERENCES MARKETS(id) ON DELETE CASCADE,
        FOREIGN KEY (pattern_id) REFERENCES SCRAPER_PATTERNS(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_msp_market ON MARKET_SCRAPER_PATTERNS(market_id);
      CREATE INDEX IF NOT EXISTS idx_msp_pattern ON MARKET_SCRAPER_PATTERNS(pattern_id);
      CREATE INDEX IF NOT EXISTS idx_msp_scraper_patterns ON MARKET_SCRAPER_PATTERNS(scraper_patterns_id);

      CREATE TABLE IF NOT EXISTS CATEGORY_PARAMETERS (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES CATEGORIES(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_cat_params_category ON CATEGORY_PARAMETERS(category_id);
    `);
        // Migrações seguras para colunas opcionais adicionadas
        try {
            this.db.exec('ALTER TABLE PRODUCTS ADD COLUMN image_url TEXT');
        }
        catch { }
        try {
            this.db.exec('ALTER TABLE MARKET_OFFERS ADD COLUMN image_url TEXT');
        }
        catch { }
        try {
            this.db.exec('ALTER TABLE MARKET_SCRAPER_PATTERNS ADD COLUMN scraper_patterns_id TEXT');
        }
        catch { }
        try {
            this.db.exec('UPDATE MARKET_SCRAPER_PATTERNS SET scraper_patterns_id = pattern_id WHERE scraper_patterns_id IS NULL');
        }
        catch { }
        try {
            this.db.exec('CREATE INDEX IF NOT EXISTS idx_msp_scraper_patterns ON MARKET_SCRAPER_PATTERNS(scraper_patterns_id)');
        }
        catch { }
    }
    /**
     * Limpa todos os dados de mercados, produtos e ofertas para testes limpos
     */
    limparTodosOsDados() {
        this.db.exec(`
      DELETE FROM MARKET_OFFERS;
      DELETE FROM PRODUCTS;
      DELETE FROM MARKETS;
      DELETE FROM CATEGORY_PARAMETERS;
    `);
        this.invalidarCache();
        console.log('🧹 [SQLite] Mercados, produtos e ofertas apagados com sucesso!');
    }
    /**
     * Retorna os mercados com suas respectivas regiões e top 5 ofertas
     */
    getMercados(regiaoId, termo) {
        const cacheKey = `mercados:${regiaoId || ''}:${termo || ''}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
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
        const params = [];
        const isTodas = !regiaoId ||
            regiaoId.toLowerCase() === 'todas' ||
            regiaoId.toLowerCase() === 'all' ||
            regiaoId.toLowerCase() === 'todas as regiões' ||
            regiaoId.toLowerCase() === 'todas as regioes';
        const conditions = [];
        if (!isTodas) {
            const cleanSlug = regiaoId.toLowerCase().trim().replace(/^reg-/, '');
            conditions.push('(LOWER(m.region_id) = LOWER(?) OR LOWER(r.id) = LOWER(?) OR LOWER(r.name) = LOWER(?) OR LOWER(r.id) LIKE ?)');
            params.push(regiaoId, regiaoId, regiaoId, `%${cleanSlug}%`);
        }
        if (termo && termo.trim()) {
            conditions.push('(LOWER(m.name) LIKE ? OR LOWER(m.neighborhood) LIKE ? OR LOWER(m.address) LIKE ?)');
            const like = `%${termo.toLowerCase().trim()}%`;
            params.push(like, like, like);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        const rows = this.db.prepare(sql).all(...params);
        const resultado = rows.map((row) => {
            // Busca top ofertas do mercado
            const ofertasRows = this.db
                .prepare(`
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
          WHERE mo.market_id = ? AND mo.is_active = 1
          ORDER BY mo.is_top_deal DESC, mo.display_order ASC
          LIMIT 5
        `)
                .all(row.id);
            const topOfertas = ofertasRows.map((o) => {
                let desconto = 0;
                if (o.original_price && o.original_price > o.current_price) {
                    desconto = Math.round(((o.original_price - o.current_price) / o.original_price) * 100);
                }
                return {
                    id: o.id,
                    produtoId: o.product_id,
                    nomeProduto: o.product_name,
                    categoria: o.category_slug,
                    mercadoId: row.id,
                    nomeMercado: row.name,
                    regiao: row.region_name,
                    preco: o.current_price,
                    precoAnterior: o.original_price || undefined,
                    unidade: o.unit,
                    descontoPercentual: desconto,
                    validaAte: o.valid_until || 'Consulte encarte',
                    coletadoEm: o.created_at,
                    ordemExibicao: o.display_order,
                    imageUrl: o.image_url || undefined,
                };
            });
            return {
                id: row.id,
                nome: row.name,
                rede: row.name.split(' ')[0] || 'Supermercado',
                regiao: row.region_name,
                regiaoId: row.region_id,
                endereco: row.address || '',
                bairro: row.neighborhood || row.region_name,
                latitude: row.latitude || undefined,
                longitude: row.longitude || undefined,
                flyerUrl: row.flyer_url || undefined,
                avaliacao: 4.6,
                topOfertas,
            };
        });
        this.setInCache(cacheKey, resultado);
        return resultado;
    }
    /**
     * Retorna os mercados que possuem flyer_url configurada para raspagem
     */
    getMercadosComUrl() {
        const rows = this.db
            .prepare(`
        SELECT 
          m.id, 
          m.name, 
          m.region_id, 
          r.name as region_name, 
          m.flyer_url
        FROM MARKETS m
        JOIN REGIONS r ON m.region_id = r.id
        WHERE m.flyer_url IS NOT NULL AND m.flyer_url != ''
      `)
            .all();
        return rows;
    }
    /**
     * Consulta produtos monitorados com o menor preço e todas as ofertas disponíveis,
     * obedecendo aos filtros de busca, categoria e região informados.
     */
    getProdutos(termo, regiaoId, categoria) {
        const cacheKey = `produtos:${termo || ''}:${regiaoId || ''}:${categoria || ''}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
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
        const params = [];
        if (termo) {
            sql += ' AND (LOWER(p.canonical_name) LIKE ? OR LOWER(c.slug) LIKE ? OR LOWER(c.name) LIKE ?)';
            const like = `%${termo.toLowerCase().trim()}%`;
            params.push(like, like, like);
        }
        if (categoria && categoria !== 'Todas' && categoria !== 'all') {
            const catClean = categoria.toLowerCase().trim();
            sql += ' AND (LOWER(c.slug) LIKE ? OR LOWER(c.name) LIKE ?)';
            params.push(`%${catClean}%`, `%${catClean}%`);
        }
        const produtos = this.db.prepare(sql).all(...params);
        const resultado = [];
        const filtrarPorRegiao = regiaoId &&
            regiaoId.toLowerCase() !== 'todas' &&
            regiaoId.toLowerCase() !== 'all' &&
            regiaoId.toLowerCase() !== 'todas as regiões' &&
            regiaoId.toLowerCase() !== 'todas as regioes';
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
      WHERE mo.product_id = ? AND mo.is_active = 1
    `;
        if (filtrarPorRegiao) {
            ofertasSql += ' AND (LOWER(r.id) = LOWER(?) OR LOWER(m.region_id) = LOWER(?) OR LOWER(r.name) = LOWER(?) OR LOWER(r.id) LIKE ?)';
        }
        ofertasSql += ' ORDER BY mo.current_price ASC';
        const getOfertasStmt = this.db.prepare(ofertasSql);
        for (const p of produtos) {
            const cleanSlug = regiaoId ? regiaoId.toLowerCase().trim().replace(/^reg-/, '') : '';
            const ofertasParams = filtrarPorRegiao ? [p.prod_id, regiaoId, regiaoId, regiaoId, `%${cleanSlug}%`] : [p.prod_id];
            const ofertasRows = getOfertasStmt.all(...ofertasParams);
            if (ofertasRows.length === 0)
                continue;
            const ofertas = ofertasRows.map((o) => {
                let desconto = 0;
                if (o.original_price && o.original_price > o.current_price) {
                    desconto = Math.round(((o.original_price - o.current_price) / o.original_price) * 100);
                }
                return {
                    id: o.id,
                    produtoId: o.product_id,
                    nomeProduto: o.product_name,
                    categoria: o.category_slug,
                    mercadoId: o.market_id,
                    nomeMercado: o.market_name,
                    regiao: o.region_name,
                    preco: o.current_price,
                    precoAnterior: o.original_price || undefined,
                    unidade: o.unit,
                    descontoPercentual: desconto,
                    validaAte: o.valid_until || 'Consulte encarte',
                    coletadoEm: o.created_at,
                    imageUrl: o.offer_image || undefined,
                };
            });
            const melhorPreco = ofertas[0].preco;
            const mercadoMaisBarato = ofertas[0].nomeMercado;
            resultado.push({
                id: p.prod_id,
                nome: p.prod_name,
                descricao: p.prod_name,
                categoria: p.category_slug,
                unidade: p.prod_unit,
                melhorPreco,
                mercadoMaisBarato,
                imageUrl: p.prod_image || (ofertas[0] && ofertas[0].imageUrl) || undefined,
                ofertas,
            });
        }
        this.setInCache(cacheKey, resultado);
        return resultado;
    }
    /**
     * Salva ofertas raspadas pelo Playwright no banco SQLite.
     * Cria produtos e mercados se não existirem, associando à região informada/detectada.
     */
    async salvarOfertas(novasOfertas) {
        if (novasOfertas.length === 0)
            return;
        const agora = new Date().toISOString();
        const findRegionStmt = this.db.prepare(`
      SELECT id FROM REGIONS WHERE LOWER(name) = LOWER(?) LIMIT 1
    `);
        const insertRegionStmt = this.db.prepare(`
      INSERT INTO REGIONS (id, name, city, state, created_at)
      VALUES (?, ?, 'Mogi das Cruzes', 'SP', ?)
    `);
        const findCategoryStmt = this.db.prepare(`
      SELECT id FROM CATEGORIES WHERE slug = ? LIMIT 1
    `);
        const findMarketStmt = this.db.prepare(`
      SELECT id FROM MARKETS WHERE id = ? OR LOWER(name) = LOWER(?) LIMIT 1
    `);
        const insertMarketStmt = this.db.prepare(`
      INSERT INTO MARKETS (id, region_id, name, address, neighborhood, latitude, longitude, flyer_url, created_at)
      VALUES (@id, @region_id, @name, @address, @neighborhood, @latitude, @longitude, @flyer_url, @created_at)
    `);
        const updateMarketFlyerStmt = this.db.prepare(`
      UPDATE MARKETS SET flyer_url = COALESCE(?, flyer_url) WHERE id = ?
    `);
        const findProductStmt = this.db.prepare(`
      SELECT id FROM PRODUCTS 
      WHERE id = ? 
         OR LOWER(canonical_name) = LOWER(?)
         OR (barcode_ean IS NOT NULL AND barcode_ean = ?)
      LIMIT 1
    `);
        const insertProductStmt = this.db.prepare(`
      INSERT INTO PRODUCTS (id, category_id, canonical_name, barcode_ean, unit, image_url, created_at)
      VALUES (@id, @category_id, @canonical_name, @barcode_ean, @unit, @image_url, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        canonical_name = excluded.canonical_name,
        image_url = COALESCE(excluded.image_url, PRODUCTS.image_url)
    `);
        const upsertOfferStmt = this.db.prepare(`
      INSERT INTO MARKET_OFFERS (id, market_id, product_id, current_price, original_price, is_top_deal, display_order, valid_until, image_url, is_active, created_at)
      VALUES (@id, @market_id, @product_id, @current_price, @original_price, @is_top_deal, @display_order, @valid_until, @image_url, 1, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        current_price = excluded.current_price,
        original_price = excluded.original_price,
        valid_until = excluded.valid_until,
        image_url = COALESCE(excluded.image_url, MARKET_OFFERS.image_url),
        is_active = 1
    `);
        const transacao = this.db.transaction(() => {
            for (let i = 0; i < novasOfertas.length; i++) {
                const o = novasOfertas[i];
                // 1. Resolve ou cria a Região
                let regionRow = findRegionStmt.get(o.regiao);
                let regionId;
                if (!regionRow) {
                    const novaRegiaoId = `reg-${o.regiao.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                    insertRegionStmt.run(novaRegiaoId, o.regiao, agora);
                    regionId = novaRegiaoId;
                }
                else {
                    regionId = regionRow.id;
                }
                // 2. Resolve Categoria (fallback para 'cat-mercearia')
                const catRow = findCategoryStmt.get(o.categoria);
                const categoryId = catRow ? catRow.id : 'cat-mercearia';
                // 3. Resolve ou cria Mercado
                let marketRow = findMarketStmt.get(o.mercadoId, o.nomeMercado);
                let marketId;
                if (!marketRow) {
                    insertMarketStmt.run({
                        id: o.mercadoId,
                        region_id: regionId,
                        name: o.nomeMercado,
                        address: `${o.nomeMercado} - ${o.regiao}`,
                        neighborhood: o.regiao,
                        latitude: -23.52,
                        longitude: -46.19,
                        flyer_url: o.flyerUrl || null,
                        created_at: agora,
                    });
                    marketId = o.mercadoId;
                }
                else {
                    marketId = marketRow.id;
                    if (o.flyerUrl) {
                        updateMarketFlyerStmt.run(o.flyerUrl, marketId);
                    }
                }
                // 4. Resolve ou cria Produto (Reutiliza catálogo se já existir)
                let prodRow = findProductStmt.get(o.produtoId, o.nomeProduto, o.barcodeEan || '');
                let productId;
                if (!prodRow) {
                    insertProductStmt.run({
                        id: o.produtoId,
                        category_id: categoryId,
                        canonical_name: o.nomeProduto,
                        barcode_ean: o.barcodeEan || null,
                        unit: o.unidade || 'un',
                        image_url: o.imageUrl || null,
                        created_at: agora,
                    });
                    productId = o.produtoId;
                }
                else {
                    productId = prodRow.id;
                }
                // 5. Upsert Oferta (as 5 primeiras podem ser top_deals)
                const isTopDeal = i < 5 ? 1 : 0;
                const displayOrder = (i % 5) + 1;
                upsertOfferStmt.run({
                    id: o.id,
                    market_id: marketId,
                    product_id: productId,
                    current_price: o.preco,
                    original_price: o.precoAnterior || null,
                    is_top_deal: isTopDeal,
                    display_order: displayOrder,
                    valid_until: o.validaAte || 'Consulte encarte',
                    image_url: o.imageUrl || null,
                    created_at: agora,
                });
            }
        });
        transacao();
        this.invalidarCache();
        console.log(`💾 [SQLite] ${novasOfertas.length} ofertas salvas no banco de dados com sucesso!`);
    }
    /**
     * Grava na base de dados SQLite ofertas confirmadas pelo modal de teste do Scraper
     * (Passo 2 do guia do Playwright).
     * - Garante que o estabelecimento existe na tabela MARKETS.
     * - Garante que a categoria existe.
     * - Desativa ofertas anteriores do mercado.
     * - Reutiliza produtos existentes ou cadastra novos produtos.
     * - Insere as novas ofertas ativas com top_deal = 1.
     */
    classificarCategoriaProduto(nomeProduto, categoriaSugerida) {
        if (categoriaSugerida) {
            const catSlug = categoriaSugerida.toLowerCase().replace(/^cat-/, '');
            if (['carnes', 'hortifruti', 'mercearia', 'laticinios', 'bebidas', 'limpeza'].includes(catSlug)) {
                return `cat-${catSlug}`;
            }
        }
        const t = nomeProduto.toLowerCase();
        // 1. Carnes e Aves
        if (t.match(/\b(carne|picanha|alcatra|contrafilé|contrafile|acem|acém|costela|frango|coxa|sobrecoxa|peito de frango|linguica|linguiça|bacon|pernil|bovino|suino|suíno|peixe|tilapia|tilápia|salmao|salmão|file|filé|patinho|cupim|maminha|hamburguer|hambúrguer|bife|costelinha|salsicha|paleta|coxao|coxão|mignon)\b/i)) {
            return 'cat-carnes';
        }
        // 2. Hortifrúti
        if (t.match(/\b(banana|maca|maçã|laranja|tomate|batata|cebola|cenoura|alface|limao|limão|manga|uva|abacaxi|melancia|mamao|mamão|alho|pera|pêra|fruta|legume|verdura|couve|repolho|brocolis|brócolis|pepino|chuchu|mandioca|maracuja|maracujá|morango|abacate|beterraba|pimentao|pimentão|abobora|abóbora)\b/i)) {
            return 'cat-hortifruti';
        }
        // 3. Laticínios e Ovos
        if (t.match(/\b(leite|iogurte|queijo|manteiga|requeijao|requeijão|mussarela|muçarela|prato|parmesao|parmesão|creme de leite|leite condensado|ovos|ovo|ricota|cottage|danone|parmesan|gouda|cheddar|provolone|coalho|nata|margarina)\b/i)) {
            return 'cat-laticinios';
        }
        // 4. Bebidas
        if (t.match(/\b(cerveja|refrigerante|suco|agua|água|vinho|vodka|energetico|energético|cha|chá|whisky|gin|coca|pepsi|guarana|guaraná|fanta|sprite|heineken|amstel|skol|brahma|antarctica|budweiser|corona|espumante|nectar|néctar|isotônico|gatorade)\b/i)) {
            return 'cat-bebidas';
        }
        // 5. Limpeza e Higiene
        if (t.match(/\b(sabao|sabão|detergente|amaciante|desinfetante|papel higienico|papel higiênico|shampoo|condicionador|creme dental|sabonete|esponja|limpador|cloro|agua sanitaria|água sanitária|lã de aco|lava roupas|vanish|omo|ypê|ype|veja|downy|comfort|brilhante|ipê|ipe|lustra|multiuso|desodorante|fralda|absorvente)\b/i)) {
            return 'cat-limpeza';
        }
        // 6. Mercearia (fallback padrão)
        return 'cat-mercearia';
    }
    salvarOfertasRegraScraper(marketId, categoryId, offers, catalogUrl, patternId) {
        if (!offers || offers.length === 0)
            return;
        const agora = new Date().toISOString();
        // 1. Garante que o Mercado existe
        let mktRow = this.db.prepare('SELECT id FROM MARKETS WHERE id = ? OR LOWER(name) = LOWER(?) LIMIT 1').get(marketId, marketId);
        if (!mktRow) {
            let nomeMercado = marketId.replace(/^mkt-/, '').replace(/-/g, ' ');
            nomeMercado = nomeMercado.charAt(0).toUpperCase() + nomeMercado.slice(1);
            let regiaoId = 'reg-centro';
            if (marketId.toLowerCase().includes('davo')) {
                nomeMercado = "D'avó Supermercados";
                regiaoId = 'reg-alto-ipiranga';
            }
            else if (marketId.toLowerCase().includes('shibata')) {
                nomeMercado = 'Shibata Supermercados';
                regiaoId = 'reg-mogilar';
            }
            this.db.prepare(`
        INSERT INTO MARKETS (id, region_id, name, address, neighborhood, latitude, longitude, flyer_url, created_at)
        VALUES (?, ?, ?, ?, ?, -23.52, -46.19, ?, ?)
      `).run(marketId, regiaoId, nomeMercado, `${nomeMercado} - Unidade Principal`, 'Centro', catalogUrl || null, agora);
        }
        else if (catalogUrl) {
            this.db.prepare('UPDATE MARKETS SET flyer_url = ? WHERE id = ?').run(catalogUrl, marketId);
        }
        // 2. Vincula o Padrão ao Estabelecimento na tabela de associação MARKET_SCRAPER_PATTERNS
        // Inclui pattern_id e scraper_patterns_id para futuros escaneamentos
        if (patternId) {
            const mspId = `msp-${marketId}-${patternId}`;
            this.db.prepare(`
        INSERT INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          catalog_url = COALESCE(excluded.catalog_url, MARKET_SCRAPER_PATTERNS.catalog_url),
          pattern_id = excluded.pattern_id,
          scraper_patterns_id = excluded.scraper_patterns_id
      `).run(mspId, marketId, patternId, patternId, catalogUrl || null, agora);
        }
        const findProductStmt = this.db.prepare(`
      SELECT id FROM PRODUCTS WHERE id = ? OR LOWER(canonical_name) = LOWER(?) LIMIT 1
    `);
        const insertProduct = this.db.prepare(`
      INSERT INTO PRODUCTS (id, category_id, canonical_name, barcode_ean, unit, image_url, created_at)
      VALUES (?, ?, ?, NULL, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        canonical_name = excluded.canonical_name,
        category_id = excluded.category_id,
        image_url = COALESCE(excluded.image_url, PRODUCTS.image_url)
    `);
        const insertOffer = this.db.prepare(`
      INSERT INTO MARKET_OFFERS (
        id, market_id, product_id, current_price, original_price,
        is_top_deal, display_order, valid_until, image_url, is_active, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 days'), ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        current_price = excluded.current_price,
        original_price = excluded.original_price,
        image_url = COALESCE(excluded.image_url, MARKET_OFFERS.image_url),
        is_active = 1,
        valid_until = excluded.valid_until
    `);
        const tx = this.db.transaction(() => {
            // Desativa ofertas antigas do estabelecimento
            this.db.prepare('UPDATE MARKET_OFFERS SET is_active = 0 WHERE market_id = ?').run(marketId);
            offers.forEach((item, index) => {
                const prodSlug = 'prod-' +
                    item.name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .slice(0, 40);
                // Classificação individual da categoria do produto
                const itemCategory = this.classificarCategoriaProduto(item.name, item.category || item.categoria || categoryId);
                let existingProd = findProductStmt.get(prodSlug, item.name);
                let finalProdId = prodSlug;
                if (existingProd) {
                    finalProdId = existingProd.id;
                }
                else {
                    insertProduct.run(finalProdId, itemCategory, item.name, item.unit || 'un', item.imageUrl || null, agora);
                }
                const offerId = `off-${marketId}-${finalProdId}`;
                const isTopDeal = index < 5 ? 1 : 0;
                const displayOrder = index + 1;
                insertOffer.run(offerId, marketId, finalProdId, item.currentPrice, item.originalPrice || null, isTopDeal, displayOrder, item.imageUrl || null, agora);
            });
        });
        tx();
        this.invalidarCache();
        console.log(`💾 [SQLite] ${offers.length} produtos/ofertas salvos no banco precocerto.db para o mercado ${marketId}!`);
    }
    /**
     * Retorna todos os padrões de scraping com mercado associado (se houver), com cache L1
     */
    getScraperPatterns() {
        const cacheKey = 'scraper_patterns';
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const resultado = this.db.prepare(`
      SELECT 
        sp.id,
        sp.name,
        sp.card_container as cardContainer,
        sp.product_name as productName,
        sp.current_price as currentPrice,
        sp.original_price as originalPrice,
        sp.discount_tag as discountTag,
        sp.unit,
        sp.image_selector as imageSelector,
        sp.created_at as createdAt,
        msp.market_id as marketId,
        m.name as marketName,
        msp.catalog_url as catalogUrl,
        COALESCE(msp.scraper_patterns_id, msp.pattern_id, sp.id) as scraperPatternsId,
        COALESCE(msp.pattern_id, sp.id) as patternId
      FROM SCRAPER_PATTERNS sp
      LEFT JOIN MARKET_SCRAPER_PATTERNS msp ON (sp.id = msp.pattern_id OR sp.id = msp.scraper_patterns_id)
      LEFT JOIN MARKETS m ON msp.market_id = m.id
      ORDER BY sp.name ASC
    `).all();
        this.setInCache(cacheKey, resultado);
        return resultado;
    }
    gerarSlug(texto) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    /**
     * Salva ou atualiza um padrão de seletores e vincula ao estabelecimento
     */
    salvarOuAtualizarPadraoScraper(dados) {
        const agora = new Date().toISOString();
        const id = dados.id || `pat-${this.gerarSlug(dados.name)}-${Date.now().toString().slice(-4)}`;
        const upsertPattern = this.db.prepare(`
      INSERT INTO SCRAPER_PATTERNS (id, name, card_container, product_name, current_price, original_price, discount_tag, unit, image_selector, created_at)
      VALUES (@id, @name, @card_container, @product_name, @current_price, @original_price, @discount_tag, @unit, @image_selector, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        card_container = excluded.card_container,
        product_name = excluded.product_name,
        current_price = excluded.current_price,
        original_price = excluded.original_price,
        discount_tag = excluded.discount_tag,
        unit = excluded.unit,
        image_selector = excluded.image_selector
    `);
        upsertPattern.run({
            id,
            name: dados.name,
            card_container: dados.cardContainer,
            product_name: dados.productName,
            current_price: dados.currentPrice,
            original_price: dados.originalPrice || null,
            discount_tag: dados.discountTag || null,
            unit: dados.unit || null,
            image_selector: dados.imageSelector || null,
            created_at: agora,
        });
        if (dados.marketId) {
            const mspId = `msp-${dados.marketId}-${id}`;
            this.db.prepare(`
        INSERT INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          catalog_url = COALESCE(excluded.catalog_url, MARKET_SCRAPER_PATTERNS.catalog_url),
          pattern_id = excluded.pattern_id,
          scraper_patterns_id = excluded.scraper_patterns_id
      `).run(mspId, dados.marketId, id, id, dados.catalogUrl || null, agora);
        }
        this.invalidarCache();
        return { id, success: true };
    }
    /**
     * Exclui um padrão de scraping e remove vínculos da tabela MARKET_SCRAPER_PATTERNS
     */
    excluirPadraoScraper(id) {
        try {
            const existe = this.db.prepare('SELECT id FROM SCRAPER_PATTERNS WHERE id = ? LIMIT 1').get(id);
            if (!existe) {
                return { sucesso: false, erro: 'Padrão não encontrado no banco de dados.' };
            }
            const tx = this.db.transaction(() => {
                this.db.prepare('DELETE FROM MARKET_SCRAPER_PATTERNS WHERE pattern_id = ? OR scraper_patterns_id = ?').run(id, id);
                this.db.prepare('DELETE FROM SCRAPER_PATTERNS WHERE id = ?').run(id);
            });
            tx();
            this.invalidarCache();
            return { sucesso: true };
        }
        catch (error) {
            return { sucesso: false, erro: error.message };
        }
    }
    /**
     * Lista todas as regiões (com Cache L1)
     */
    getRegioes() {
        const cacheKey = 'regioes';
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const resultado = this.db.prepare('SELECT * FROM REGIONS ORDER BY name ASC').all();
        this.setInCache(cacheKey, resultado);
        return resultado;
    }
    /**
     * Lista todas as categorias (com Cache L1)
     */
    getCategorias() {
        const cacheKey = 'categorias';
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const resultado = this.db.prepare('SELECT * FROM CATEGORIES ORDER BY name ASC').all();
        this.setInCache(cacheKey, resultado);
        return resultado;
    }
    /**
     * Estatísticas de dados para o Health Check (com Cache L1)
     */
    getEstatisticas() {
        const cacheKey = 'estatisticas';
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const regCount = this.db.prepare('SELECT COUNT(*) as count FROM REGIONS').get().count;
        const mktCount = this.db.prepare('SELECT COUNT(*) as count FROM MARKETS').get().count;
        const prdCount = this.db.prepare('SELECT COUNT(*) as count FROM PRODUCTS').get().count;
        const offCount = this.db.prepare('SELECT COUNT(*) as count FROM MARKET_OFFERS').get().count;
        const resultado = { regioes: regCount, mercados: mktCount, produtos: prdCount, ofertas: offCount };
        this.setInCache(cacheKey, resultado);
        return resultado;
    }
    /**
     * Garante a existência do usuário admin padrão (admin / Play@2026)
     */
    garantirAdminPadrao() {
        try {
            const totalUsers = this.db.prepare('SELECT COUNT(*) as count FROM USERS').get().count;
            if (totalUsers === 0) {
                this.db.prepare(`
          INSERT INTO USERS (id, username, password, created_at)
          VALUES ('usr-admin', 'admin', 'Play@2026', datetime('now'))
        `).run();
                console.log('👤 [SQLite] Usuário administrador padrão (admin / Play@2026) criado com sucesso!');
            }
        }
        catch (e) {
            console.warn('⚠️ [SQLite] Falha ao verificar tabela USERS:', e);
        }
    }
    /**
     * Autentica usuário no SQLite
     */
    autenticarUsuario(username, password) {
        try {
            const user = this.db
                .prepare('SELECT id, username FROM USERS WHERE LOWER(username) = LOWER(?) AND password = ?')
                .get(username.trim(), password);
            return user ? { id: user.id, username: user.username } : null;
        }
        catch {
            return null;
        }
    }
    /**
     * Atualiza a descrição/nome de um estabelecimento no SQLite
     */
    atualizarDescricaoMercado(id, novoNome) {
        const res = this.db
            .prepare('UPDATE MARKETS SET name = ? WHERE id = ?')
            .run(novoNome.trim(), id);
        if (res.changes > 0) {
            this.invalidarCache();
            return true;
        }
        return false;
    }
    /**
     * Exclui um estabelecimento e suas respectivas ofertas,
     * preservando rigorosamente o catálogo de produtos (PRODUCTS).
     */
    excluirMercado(id) {
        const transacao = this.db.transaction(() => {
            // 1. Exclui todas as ofertas publicadas por este supermercado
            const resOffers = this.db.prepare('DELETE FROM MARKET_OFFERS WHERE market_id = ?').run(id);
            // 2. Exclui o supermercado
            const resMarket = this.db.prepare('DELETE FROM MARKETS WHERE id = ?').run(id);
            // Os registros em PRODUCTS permanecem intactos!
            return {
                sucesso: resMarket.changes > 0,
                ofertasExcluidas: resOffers.changes,
            };
        });
        const resultado = transacao();
        if (resultado.sucesso) {
            this.invalidarCache();
        }
        return resultado;
    }
    /**
     * Retorna parametrizações de categoria (com Cache L1)
     */
    getParametrizacoesCategoria(categoriaId) {
        const cacheKey = `cat_params:${categoriaId || 'all'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        let sql = `
      SELECT 
        cp.id,
        cp.category_id as categoryId,
        c.name as categoryName,
        cp.description,
        cp.created_at as createdAt
      FROM CATEGORY_PARAMETERS cp
      JOIN CATEGORIES c ON cp.category_id = c.id
    `;
        const params = [];
        if (categoriaId) {
            sql += ' WHERE cp.category_id = ? OR c.slug = ?';
            params.push(categoriaId, categoriaId);
        }
        sql += ' ORDER BY c.name ASC, cp.description ASC';
        const resultado = this.db.prepare(sql).all(...params);
        this.setInCache(cacheKey, resultado);
        return resultado;
    }
    /**
     * Salva ou atualiza uma parametrização de categoria
     */
    salvarParametrizacaoCategoria(dados) {
        const agora = new Date().toISOString();
        const id = dados.id || `param-${this.gerarSlug(dados.categoryId).replace(/^cat-/, '')}-${Date.now().toString().slice(-4)}`;
        const upsertStmt = this.db.prepare(`
      INSERT INTO CATEGORY_PARAMETERS (id, category_id, description, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        description = excluded.description
    `);
        upsertStmt.run(id, dados.categoryId, dados.description.trim(), agora);
        this.invalidarCache('cat_params');
        return { id, success: true };
    }
    /**
     * Exclui uma parametrização de categoria pelo ID
     */
    excluirParametrizacaoCategoria(id) {
        const res = this.db.prepare('DELETE FROM CATEGORY_PARAMETERS WHERE id = ?').run(id);
        if (res.changes > 0) {
            this.invalidarCache('cat_params');
            return { success: true };
        }
        return { success: false };
    }
}
exports.BancoDadosTs = BancoDadosTs;
