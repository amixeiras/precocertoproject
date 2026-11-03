-- ==============================================================================
-- DML SCRIPT: LIMPEZA DE TODOS OS ESTABELECIMENTOS CADASTRADOS (SQLITE)
-- Exclui todas as ofertas e todos os estabelecimentos da base de dados.
-- Mantém 100% preservados os produtos (PRODUCTS), categorias (CATEGORIES),
-- regiões (REGIONS) e usuários administradores (USERS).
-- ==============================================================================

PRAGMA foreign_keys = ON;

DELETE FROM MARKET_OFFERS;
DELETE FROM MARKETS;

