import { Pool } from 'pg';

async function testPostgresQueries() {
  console.log('🧪 Testando queries no PostgreSQL...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/precocerto'
  });

  try {
    // 1. Regiões
    const regioes = await pool.query('SELECT * FROM REGIONS ORDER BY name ASC');
    console.log(`✅ Regiões: ${regioes.rowCount} encontradas`);

    // 2. Categorias
    const categorias = await pool.query('SELECT * FROM CATEGORIES ORDER BY name ASC');
    console.log(`✅ Categorias: ${categorias.rowCount} encontradas`);

    // 3. Mercados com regiões
    const mercados = await pool.query(`
      SELECT 
        m.id, m.name, m.address, m.neighborhood, m.latitude, m.longitude, m.flyer_url,
        r.id as region_id, r.name as region_name, r.city as region_city, r.state as region_state
      FROM MARKETS m
      JOIN REGIONS r ON m.region_id = r.id
    `);
    console.log(`✅ Mercados: ${mercados.rowCount} encontrados`);

    // 4. Produtos e Ofertas
    const produtos = await pool.query(`
      SELECT 
        p.id as prod_id, p.canonical_name as prod_name, c.slug as category_slug,
        c.name as category_name, p.unit as prod_unit, p.image_url as prod_image
      FROM PRODUCTS p
      JOIN CATEGORIES c ON p.category_id = c.id
      LIMIT 10
    `);
    console.log(`✅ Produtos: ${produtos.rowCount} encontrados`);

    // 5. Padrões de Scraper
    const patterns = await pool.query(`
      SELECT 
        sp.id, sp.name, sp.card_container as "cardContainer", sp.product_name as "productName",
        sp.current_price as "currentPrice", sp.original_price as "originalPrice",
        sp.discount_tag as "discountTag", sp.unit, sp.image_selector as "imageSelector",
        sp.created_at as "createdAt", msp.market_id as "marketId", m.name as "marketName",
        msp.catalog_url as "catalogUrl",
        COALESCE(msp.scraper_patterns_id, msp.pattern_id, sp.id) as "scraperPatternsId",
        COALESCE(msp.pattern_id, sp.id) as "patternId"
      FROM SCRAPER_PATTERNS sp
      LEFT JOIN MARKET_SCRAPER_PATTERNS msp ON (sp.id = msp.pattern_id OR sp.id = msp.scraper_patterns_id)
      LEFT JOIN MARKETS m ON msp.market_id = m.id
      ORDER BY sp.name ASC
    `);
    console.log(`✅ Padrões de Scraper: ${patterns.rowCount} encontrados`);

    // 6. Usuário Admin
    const admin = await pool.query("SELECT id, username FROM USERS WHERE username = 'admin'");
    console.log(`✅ Usuário Admin: ${admin.rowCount > 0 ? 'Encontrado' : 'Não encontrado'}`);

    console.log('🎉 Todos os testes de queries no PostgreSQL passaram com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro no teste do PostgreSQL:', error);
  } finally {
    await pool.end();
  }
}

testPostgresQueries();
