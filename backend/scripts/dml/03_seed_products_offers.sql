-- ==============================================================================
-- DML SCRIPT 3: CARGA DE PRODUTOS PADRONIZADOS E OFERTAS POR SUPERMERCADO
-- ==============================================================================

-- 1. Inserção de Produtos Padronizados no Catálogo
INSERT OR REPLACE INTO PRODUCTS (id, category_id, canonical_name, barcode_ean, unit, created_at) VALUES
('prod-arroz-camil-5kg', 'cat-mercearia', 'Arroz Tipo 1 Camil 5kg', '7896006700018', '5kg', CURRENT_TIMESTAMP),
('prod-feijao-camil-1kg', 'cat-mercearia', 'Feijão Carioca Camil 1kg', '7896006700056', '1kg', CURRENT_TIMESTAMP),
('prod-picanha-maturatta', 'cat-carnes', 'Picanha Bovina Maturatta kg', '7891000000011', 'kg', CURRENT_TIMESTAMP),
('prod-alcatra-kg', 'cat-carnes', 'Alcatra com Maminha Bovina kg', '7891000000073', 'kg', CURRENT_TIMESTAMP),
('prod-leite-piracanjuba-1l', 'cat-laticinios', 'Leite Integral Piracanjuba 1L', '7898215150014', '1L', CURRENT_TIMESTAMP),
('prod-queijo-mucarela', 'cat-laticinios', 'Queijo Muçarela Fatiado 100g', '7891000000097', '100g', CURRENT_TIMESTAMP),
('prod-cafe-pilao-500g', 'cat-mercearia', 'Café Torrado e Moído Pilão 500g', '7896089010014', '500g', CURRENT_TIMESTAMP),
('prod-oleo-liza-900ml', 'cat-mercearia', 'Óleo de Soja Liza 900ml', '7891000000059', '900ml', CURRENT_TIMESTAMP),
('prod-cerveja-heineken', 'cat-bebidas', 'Cerveja Heineken Lata 350ml', '7891000000080', '350ml', CURRENT_TIMESTAMP),
('prod-sabao-omo-16kg', 'cat-limpeza', 'Sabão em Pó OMO Lavagem Perfeita 1.6kg', '7891150035023', '1.6kg', CURRENT_TIMESTAMP),
('prod-detergente-ype-500ml', 'cat-limpeza', 'Detergente Líquido Ypê 500ml', '7891000000110', '500ml', CURRENT_TIMESTAMP),
('prod-tomate-italiano', 'cat-hortifruti', 'Tomate Italiano Selecionado kg', '7891000000127', 'kg', CURRENT_TIMESTAMP),
('prod-banana-prata-kg', 'cat-hortifruti', 'Banana Prata Fresca kg', '7891000000134', 'kg', CURRENT_TIMESTAMP);

-- 2. Inserção de Ofertas nos Supermercados (com Top Deals 1..5)
INSERT OR REPLACE INTO MARKET_OFFERS (id, market_id, product_id, current_price, original_price, is_top_deal, display_order, valid_until, is_active, created_at) VALUES
-- Shibata Mogilar (Mogilar)
('off-shb-1', 'shibata-mogilar', 'prod-arroz-camil-5kg', 25.89, 32.90, 1, 1, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-shb-2', 'shibata-mogilar', 'prod-leite-piracanjuba-1l', 4.19, 5.60, 1, 2, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-shb-3', 'shibata-mogilar', 'prod-picanha-maturatta', 68.90, 89.90, 1, 3, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-shb-4', 'shibata-mogilar', 'prod-cafe-pilao-500g', 18.99, 23.90, 1, 4, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-shb-5', 'shibata-mogilar', 'prod-cerveja-heineken', 4.39, 5.49, 1, 5, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-shb-6', 'shibata-mogilar', 'prod-feijao-camil-1kg', 6.99, 9.80, 0, 6, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-shb-7', 'shibata-mogilar', 'prod-sabao-omo-16kg', 24.90, 31.90, 0, 7, '2026-10-31', 1, CURRENT_TIMESTAMP),

-- Alabarce Vila Oliveira (Vila Oliveira)
('off-ala-1', 'alabarce-vila-oliveira', 'prod-picanha-maturatta', 64.90, 89.90, 1, 1, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ala-2', 'alabarce-vila-oliveira', 'prod-alcatra-kg', 41.90, 52.90, 1, 2, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ala-3', 'alabarce-vila-oliveira', 'prod-arroz-camil-5kg', 26.90, 33.50, 1, 3, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ala-4', 'alabarce-vila-oliveira', 'prod-leite-piracanjuba-1l', 4.49, 5.49, 1, 4, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ala-5', 'alabarce-vila-oliveira', 'prod-oleo-liza-900ml', 6.99, 8.49, 1, 5, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ala-6', 'alabarce-vila-oliveira', 'prod-tomate-italiano', 6.99, 10.90, 0, 6, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ala-7', 'alabarce-vila-oliveira', 'prod-queijo-mucarela', 5.49, 7.90, 0, 7, '2026-10-31', 1, CURRENT_TIMESTAMP),

-- Assaí Atacadista (Braz Cubas)
('off-ass-1', 'assai-braz-cubas', 'prod-arroz-camil-5kg', 24.90, 31.90, 1, 1, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ass-2', 'assai-braz-cubas', 'prod-feijao-camil-1kg', 6.89, 8.99, 1, 2, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ass-3', 'assai-braz-cubas', 'prod-oleo-liza-900ml', 6.79, 8.29, 1, 3, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ass-4', 'assai-braz-cubas', 'prod-sabao-omo-16kg', 22.90, 28.90, 1, 4, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-ass-5', 'assai-braz-cubas', 'prod-leite-piracanjuba-1l', 4.89, 5.69, 1, 5, '2026-10-31', 1, CURRENT_TIMESTAMP),

-- D'avó Hipermercados (Alto Ipiranga)
('off-dav-1', 'davo-alto-ipiranga', 'prod-feijao-camil-1kg', 6.99, 9.20, 1, 1, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-dav-2', 'davo-alto-ipiranga', 'prod-cafe-pilao-500g', 16.90, 22.90, 1, 2, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-dav-3', 'davo-alto-ipiranga', 'prod-banana-prata-kg', 4.99, 8.90, 1, 3, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-dav-4', 'davo-alto-ipiranga', 'prod-detergente-ype-500ml', 1.89, 2.79, 1, 4, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-dav-5', 'davo-alto-ipiranga', 'prod-oleo-liza-900ml', 5.69, 7.50, 1, 5, '2026-10-31', 1, CURRENT_TIMESTAMP),

-- Semar Centro (Centro)
('off-sem-1', 'semar-centro', 'prod-arroz-camil-5kg', 26.49, 32.90, 1, 1, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-sem-2', 'semar-centro', 'prod-feijao-camil-1kg', 7.19, 9.40, 1, 2, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-sem-3', 'semar-centro', 'prod-leite-piracanjuba-1l', 4.39, 5.50, 1, 3, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-sem-4', 'semar-centro', 'prod-detergente-ype-500ml', 1.99, 2.89, 1, 4, '2026-10-31', 1, CURRENT_TIMESTAMP),
('off-sem-5', 'semar-centro', 'prod-cafe-pilao-500g', 17.90, 22.90, 1, 5, '2026-10-31', 1, CURRENT_TIMESTAMP);

