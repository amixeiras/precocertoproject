-- ==============================================================================
-- DML SCRIPT 7: CARGA DE PARAMETRIZAÇÃO DE CATEGORIAS
-- ==============================================================================

INSERT OR REPLACE INTO CATEGORY_PARAMETERS (id, category_id, description, created_at) VALUES
('param-carnes-01', 'cat-carnes', 'Carnes bovinas, aves, suínos e cortes para churrasco', CURRENT_TIMESTAMP),
('param-carnes-02', 'cat-carnes', 'Açougue, picanha, alcatra, frango e linguiças', CURRENT_TIMESTAMP),
('param-horti-01', 'cat-hortifruti', 'Frutas, legumes, verduras frescas e tubérculos', CURRENT_TIMESTAMP),
('param-horti-02', 'cat-hortifruti', 'Tomate, cebola, banana, maçã, batata e folhas verdes', CURRENT_TIMESTAMP),
('param-mercearia-01', 'cat-mercearia', 'Alimentos não perecíveis, grãos, cereais e condimentos', CURRENT_TIMESTAMP),
('param-mercearia-02', 'cat-mercearia', 'Arroz, feijão, café, óleo, açúcar e massas alimentícias', CURRENT_TIMESTAMP),
('param-lati-01', 'cat-laticinios', 'Leites integrais e desnatados, queijos, iogurtes e manteigas', CURRENT_TIMESTAMP),
('param-lati-02', 'cat-laticinios', 'Frios fatiados, presuntos, muçarela e requeijão', CURRENT_TIMESTAMP),
('param-bebidas-01', 'cat-bebidas', 'Refrigerantes, sucos naturais, cervejas, águas minerais e vinhos', CURRENT_TIMESTAMP),
('param-limpeza-01', 'cat-limpeza', 'Detergentes, sabão em pó, desinfetantes e produtos de higiene doméstica', CURRENT_TIMESTAMP);

