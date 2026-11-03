import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../data/precocerto.db');

function limparTudoExcetoUsers(): void {
  console.log('=====================================================');
  console.log('🗑️  [PREÇO CERTO] LIMPEZA TOTAL DE DADOS (EXCETO USERS)');
  console.log('=====================================================');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Banco de dados não encontrado em: ${DB_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  const transacao = db.transaction(() => {
    db.pragma('foreign_keys = OFF');

    const resOffers = db.prepare('DELETE FROM MARKET_OFFERS').run();
    console.log(`🧹 Ofertas excluídas (MARKET_OFFERS):                     ${resOffers.changes}`);

    const resMsp = db.prepare('DELETE FROM MARKET_SCRAPER_PATTERNS').run();
    console.log(`🧹 Vínculos de scraping excluídos (MARKET_SCRAPER_PATTERNS): ${resMsp.changes}`);

    const resProducts = db.prepare('DELETE FROM PRODUCTS').run();
    console.log(`🧹 Produtos excluídos (PRODUCTS):                         ${resProducts.changes}`);

    const resMarkets = db.prepare('DELETE FROM MARKETS').run();
    console.log(`🧹 Estabelecimentos excluídos (MARKETS):                  ${resMarkets.changes}`);

    const resCatParams = db.prepare('DELETE FROM CATEGORY_PARAMETERS').run();
    console.log(`🧹 Parâmetros de categoria excluídos (CATEGORY_PARAMS):    ${resCatParams.changes}`);

    const resCategories = db.prepare('DELETE FROM CATEGORIES').run();
    console.log(`🧹 Categorias excluídas (CATEGORIES):                     ${resCategories.changes}`);

    const resRegions = db.prepare('DELETE FROM REGIONS').run();
    console.log(`🧹 Regiões excluídas (REGIONS):                           ${resRegions.changes}`);

    const resPatterns = db.prepare('DELETE FROM SCRAPER_PATTERNS').run();
    console.log(`🧹 Padrões de scraping excluídos (SCRAPER_PATTERNS):      ${resPatterns.changes}`);

    db.pragma('foreign_keys = ON');
  });

  transacao();

  // Verificação pós-limpeza
  const tables = ['REGIONS', 'MARKETS', 'CATEGORIES', 'CATEGORY_PARAMETERS', 'PRODUCTS', 'MARKET_OFFERS', 'SCRAPER_PATTERNS', 'MARKET_SCRAPER_PATTERNS', 'USERS'];
  console.log('\n-----------------------------------------------------');
  console.log('📊 Estado das tabelas em ' + DB_PATH + ':');
  for (const t of tables) {
    try {
      const count = (db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as any).c;
      console.log(`   - ${t.padEnd(25)}: ${count} registros`);
    } catch (e: any) {
      console.log(`   - ${t.padEnd(25)}: erro (${e.message})`);
    }
  }

  console.log('=====================================================');
  console.log('✅ Todos os dados apagados com sucesso, tabela USERS 100% preservada!');
  console.log('=====================================================\n');

  db.close();
}

limparTudoExcetoUsers();

