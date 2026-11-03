-- ====================================================================
-- DDL: Tabelas para Padrões de Scraping e Vinculação a Estabelecimentos
-- ====================================================================

-- 1. Tabela de Padrões de Seletores Reutilizáveis
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

-- 2. Tabela de Associação: Vincula Padrão de Scraping ao Estabelecimento
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

-- 3. Adição de coluna de imagem e scraper_patterns_id nas tabelas se ainda não existirem
-- (Executado programaticamente via ALTER TABLE no bootstrap do SQLite e scripts de migração)
