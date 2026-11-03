-- ==============================================================================
-- DML SCRIPT: LIMPEZA DE TODOS OS DADOS (EXCETO TABELA USERS)
-- Apaga todos os registros do banco SQLite preservando estritamente USERS.
-- ==============================================================================

PRAGMA foreign_keys = OFF;

DELETE FROM MARKET_OFFERS;
DELETE FROM MARKET_SCRAPER_PATTERNS;
DELETE FROM PRODUCTS;
DELETE FROM MARKETS;
DELETE FROM CATEGORY_PARAMETERS;
DELETE FROM CATEGORIES;
DELETE FROM REGIONS;
DELETE FROM SCRAPER_PATTERNS;

PRAGMA foreign_keys = ON;

