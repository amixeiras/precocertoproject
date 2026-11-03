-- ==============================================================================
-- DML SCRIPT: INSERÇÃO DO USUÁRIO ADMINISTRADOR PADRÃO (SQLITE)
-- Usuário: admin
-- Senha: Play@2026
-- ==============================================================================

INSERT OR REPLACE INTO USERS (id, username, password, created_at)
VALUES (
    'usr-admin',
    'admin',
    'Play@2026',
    '2026-10-11 00:00:00'
);

