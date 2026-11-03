-- ==============================================================================
-- DML SCRIPT 2: CARGA DE SUPERMERCADOS COM FLYER_URL
-- ==============================================================================

INSERT OR REPLACE INTO MARKETS (id, region_id, name, address, neighborhood, latitude, longitude, flyer_url, created_at) VALUES
('shibata-mogilar', 'reg-mogilar', 'Shibata Supermercados - Mogilar', 'Rua Manuel de Oliveira, 400', 'Mogilar', -23.5186, -46.1872, 'https://www.shibata.com.br/ofertas', CURRENT_TIMESTAMP),
('alabarce-vila-oliveira', 'reg-vila-oliveira', 'Alabarce Supermercados', 'R. Dr. Deodato Wertheimer, 222', 'Vila Oliveira', -23.5255, -46.1925, 'https://www.alabarce.com.br/promocoes', CURRENT_TIMESTAMP),
('davo-alto-ipiranga', 'reg-alto-ipiranga', 'D''avó Hipermercados', 'Av. Henrique Eroles, 1250', 'Alto Ipiranga', -23.5350, -46.2050, 'https://www.davo.com.br/ofertas', CURRENT_TIMESTAMP),
('assai-braz-cubas', 'reg-braz-cubas', 'Assaí Atacadista', 'Rod. Henrique Eroles, 3500', 'Braz Cubas', -23.5420, -46.2200, 'https://www.assai.com.br/ofertas', CURRENT_TIMESTAMP),
('semar-centro', 'reg-centro', 'Semar Supermercados - Centro', 'R. Dr. Deodato Wertheimer, 1500', 'Centro', -23.5230, -46.1890, 'https://www.supermercadossemar.com.br/ofertas', CURRENT_TIMESTAMP),
('shibata-cesar', 'reg-cesar-de-souza', 'Shibata Supermercados - César', 'Av. Ricieri José Marcatto, 110', 'César de Souza', -23.5120, -46.1600, 'https://www.shibata.com.br/ofertas', CURRENT_TIMESTAMP);

