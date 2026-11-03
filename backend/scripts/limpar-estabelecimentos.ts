import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../data/precocerto.db');

function limparTodosEstabelecimentos(): void {
  console.log('=====================================================');
  console.log('🗑️  [PREÇO CERTO] EXCLUSÃO DE TODOS OS ESTABELECIMENTOS');
  console.log('=====================================================');

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  const transacao = db.transaction(() => {
    // 1. Apaga todas as ofertas associadas
    const resOffers = db.prepare('DELETE FROM MARKET_OFFERS').run();
    console.log(`🧹 Ofertas excluídas (MARKET_OFFERS): ${resOffers.changes}`);

    // 2. Apaga todos os estabelecimentos
    const resMarkets = db.prepare('DELETE FROM MARKETS').run();
    console.log(`🏬 Estabelecimentos excluídos (MARKETS): ${resMarkets.changes}`);

    // 3. Verificação de integridade dos produtos
    const totalProdutos = (db.prepare('SELECT COUNT(*) as count FROM PRODUCTS').get() as { count: number }).count;
    const totalRegioes = (db.prepare('SELECT COUNT(*) as count FROM REGIONS').get() as { count: number }).count;
    const totalCategorias = (db.prepare('SELECT COUNT(*) as count FROM CATEGORIES').get() as { count: number }).count;
    const totalUsuarios = (db.prepare('SELECT COUNT(*) as count FROM USERS').get() as { count: number }).count;

    console.log('-----------------------------------------------------');
    console.log(`📦 Catálogo de Produtos preservado: ${totalProdutos} itens`);
    console.log(`📍 Regiões preservadas:              ${totalRegioes} regiões`);
    console.log(`🏷️  Categorias preservadas:           ${totalCategorias} categorias`);
    console.log(`👤 Usuários preservados:             ${totalUsuarios} administradores`);
  });

  transacao();

  console.log('=====================================================');
  console.log('✅ Todos os estabelecimentos foram apagados com sucesso!');
  console.log('=====================================================');

  db.close();
}

limparTodosEstabelecimentos();

