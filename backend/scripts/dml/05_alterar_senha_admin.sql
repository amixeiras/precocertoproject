-- ==============================================================================
-- SCRIPT PARA ALTERAR A SENHA DO USUÁRIO ADMINISTRADOR
-- Instruções:
-- 1. Altere o valor 'NOVA_SENHA_AQUI' abaixo pela senha que desejar.
-- 2. Execute o comando: npm run db:dml
--    Ou execute diretamente: npx tsx scripts/alterar-senha.ts "SuaNovaSenha"
-- ==============================================================================

UPDATE USERS 
SET password = 'Play@2026' 
WHERE username = 'admin';

