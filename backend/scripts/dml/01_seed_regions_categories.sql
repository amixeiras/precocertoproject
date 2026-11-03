-- ==============================================================================
-- DML SCRIPT 1: CARGA DE REGIÕES E CATEGORIAS
-- ==============================================================================

-- 1. Inserção de Regiões
INSERT OR IGNORE INTO REGIONS (id, name, city, state, created_at) VALUES
('reg-mogilar', 'Mogilar', 'Mogi das Cruzes', 'SP', CURRENT_TIMESTAMP),
('reg-vila-oliveira', 'Vila Oliveira', 'Mogi das Cruzes', 'SP', CURRENT_TIMESTAMP),
('reg-centro', 'Centro', 'Mogi das Cruzes', 'SP', CURRENT_TIMESTAMP),
('reg-alto-ipiranga', 'Alto Ipiranga', 'Mogi das Cruzes', 'SP', CURRENT_TIMESTAMP),
('reg-braz-cubas', 'Braz Cubas', 'Mogi das Cruzes', 'SP', CURRENT_TIMESTAMP),
('reg-cesar-de-souza', 'César de Souza', 'Mogi das Cruzes', 'SP', CURRENT_TIMESTAMP);

-- 2. Inserção de Categorias
INSERT OR IGNORE INTO CATEGORIES (id, name, slug, icon) VALUES
('cat-carnes', 'Carnes & Aves', 'carnes', 'ph-drumstick'),
('cat-hortifruti', 'Hortifrúti', 'hortifruti', 'ph-plant'),
('cat-mercearia', 'Mercearia', 'mercearia', 'ph-grains'),
('cat-laticinios', 'Laticínios & Ovos', 'laticinios', 'ph-egg'),
('cat-bebidas', 'Bebidas', 'bebidas', 'ph-brandy'),
('cat-limpeza', 'Limpeza & Higiene', 'limpeza', 'ph-sparkle');

