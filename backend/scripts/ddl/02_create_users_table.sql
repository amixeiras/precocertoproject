-- ==============================================================================
-- DDL SCRIPT: CRIAÇÃO DA TABELA DE USUÁRIOS ADMIN (SQLITE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS USERS (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON USERS(username);

