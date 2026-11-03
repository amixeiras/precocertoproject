-- ==============================================================================
-- DDL SCRIPT: CRIAÇÃO DO BANCO DE DADOS PREÇO CERTO (SQLITE)
-- Arquitetura alinhada com DDD e Diagrama Entidade-Relacionamento
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. TABELA REGIONS (Regiões e Bairros)
CREATE TABLE IF NOT EXISTS REGIONS (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 2. TABELA MARKETS (Supermercados e Filiais)
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

-- 3. TABELA CATEGORIES (Categorias de Produtos)
CREATE TABLE IF NOT EXISTS CATEGORIES (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT
);

-- 4. TABELA PRODUCTS (Catálogo Padronizado de Produtos)
CREATE TABLE IF NOT EXISTS PRODUCTS (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    barcode_ean TEXT UNIQUE,
    unit TEXT NOT NULL,
    image_url TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES CATEGORIES(id) ON DELETE CASCADE
);

-- 5. TABELA MARKET_OFFERS (Ofertas Publicadas por Supermercado)
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
    image_url TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (market_id) REFERENCES MARKETS(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCTS(id) ON DELETE CASCADE
);

-- 6. TABELA USERS (Administradores do Sistema)
CREATE TABLE IF NOT EXISTS USERS (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_markets_region ON MARKETS(region_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON PRODUCTS(category_id);
CREATE INDEX IF NOT EXISTS idx_offers_market ON MARKET_OFFERS(market_id);
CREATE INDEX IF NOT EXISTS idx_offers_product ON MARKET_OFFERS(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_top_deal ON MARKET_OFFERS(is_top_deal);
CREATE INDEX IF NOT EXISTS idx_offers_active ON MARKET_OFFERS(is_active);
CREATE INDEX IF NOT EXISTS idx_users_username ON USERS(username);

