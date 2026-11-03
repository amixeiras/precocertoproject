-- ====================================================================
-- DML SCRIPT 6: Semeia Padrões de Seletores Iniciais e Vincula ao Estabelecimento
-- ====================================================================

INSERT OR IGNORE INTO SCRAPER_PATTERNS (id, name, card_container, product_name, current_price, original_price, discount_tag, unit, image_selector, created_at)
VALUES 
(
  'pat-vipcommerce',
  'VIP Commerce (D''avó Supermercados, etc.)',
  'vip-produto-preco',
  'a[title], a[aria-label]',
  '[data-cy="preco"]',
  '[data-cy="preco-antigo"]',
  '[data-cy="tag-oferta"]',
  '[data-cy="unidade"]',
  'img, .vip-produto-imagem img, [data-cy="imagem"]',
  datetime('now')
),
(
  'pat-vip-commerce',
  'VIP Commerce (D''avó Supermercados, etc.)',
  'vip-produto-preco',
  'a[title], a[aria-label]',
  '[data-cy="preco"]',
  '[data-cy="preco-antigo"]',
  '[data-cy="tag-oferta"]',
  '[data-cy="unidade"]',
  'img, .vip-produto-imagem img, [data-cy="imagem"]',
  datetime('now')
),
(
  'pat-vtex',
  'VTEX Padrão (E-commerce / Shibata)',
  '.vtex-search-result-3-x-galleryItem, .product-card',
  '.vtex-product-summary-2-x-nameContainer, h3, a',
  '.vtex-product-price-1-x-sellingPrice, [class*="sellingPrice"]',
  '.vtex-product-price-1-x-listPrice, [class*="listPrice"]',
  '[class*="discount"]',
  '[class*="unit"]',
  '.vtex-product-summary-2-x-image, img',
  datetime('now')
),
(
  'pat-generico',
  'Padrão Genérico (Cards Web)',
  '.product-card, .item-card, article[class*="product"]',
  'h2, h3, h4, [class*="title"], a',
  '[class*="preco"], [class*="price"], strong',
  'del, s, [class*="antigo"], [class*="original"]',
  '[class*="desconto"], [class*="discount"], [class*="tag"]',
  '[class*="unidade"], [class*="unit"]',
  'img',
  datetime('now')
);

-- Vinculação inicial ao D'avó, Shibata e Semar se existirem na base
INSERT OR REPLACE INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
SELECT 'msp-mkt-davo-vip', 'davo-alto-ipiranga', 'pat-vipcommerce', 'pat-vipcommerce', 'https://www.davo.com.br/ofertas', datetime('now')
WHERE EXISTS (SELECT 1 FROM MARKETS WHERE id = 'davo-alto-ipiranga');

INSERT OR REPLACE INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
SELECT 'msp-davo-vip', 'davo-alto-ipiranga', 'pat-vip-commerce', 'pat-vip-commerce', 'https://www.davo.com.br/ofertas', datetime('now')
WHERE EXISTS (SELECT 1 FROM MARKETS WHERE id = 'davo-alto-ipiranga');

INSERT OR REPLACE INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
SELECT 'msp-shibata-vtex', 'shibata-mogilar', 'pat-vtex', 'pat-vtex', 'https://www.shibata.com.br/ofertas', datetime('now')
WHERE EXISTS (SELECT 1 FROM MARKETS WHERE id = 'shibata-mogilar');

INSERT OR REPLACE INTO MARKET_SCRAPER_PATTERNS (id, market_id, pattern_id, scraper_patterns_id, catalog_url, created_at)
SELECT 'msp-semar-generico', 'semar-centro', 'pat-generico', 'pat-generico', 'https://www.supermercadossemar.com.br/ofertas', datetime('now')
WHERE EXISTS (SELECT 1 FROM MARKETS WHERE id = 'semar-centro');

