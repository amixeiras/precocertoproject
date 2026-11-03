-- ==============================================================================
-- DDL SCRIPT: TABELA DE PARAMETRIZAÇÃO DE CATEGORIA (SQLITE)
-- Mapeia identificadores, parâmetros e descrições vinculados à categoria.
-- ==============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS CATEGORY_PARAMETERS (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES CATEGORIES(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cat_params_category ON CATEGORY_PARAMETERS(category_id);

