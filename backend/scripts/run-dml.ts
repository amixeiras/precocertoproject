import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

function main() {
  console.log('🚀 [DML Runner] Executando scripts de DML no SQLite...');

  const dbDir = path.resolve(__dirname, '../data');
  const dbPath = path.join(dbDir, 'precocerto.db');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Banco de dados SQLite não encontrado. Execute o DDL primeiro!');
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  const dmlDir = path.resolve(__dirname, 'dml');
  const files = fs.readdirSync(dmlDir).filter((f) => /^\d+.*\.sql$/.test(f)).sort();

  for (const file of files) {
    const filePath = path.join(dmlDir, file);
    console.log(`📄 Executando DML: ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf-8');
    db.exec(sql);
  }

  const regCount = (db.prepare('SELECT COUNT(*) as c FROM REGIONS').get() as any).c;
  const mktCount = (db.prepare('SELECT COUNT(*) as c FROM MARKETS').get() as any).c;
  const catCount = (db.prepare('SELECT COUNT(*) as c FROM CATEGORIES').get() as any).c;
  const prdCount = (db.prepare('SELECT COUNT(*) as c FROM PRODUCTS').get() as any).c;
  const offCount = (db.prepare('SELECT COUNT(*) as c FROM MARKET_OFFERS').get() as any).c;
  const usrCount = (db.prepare('SELECT COUNT(*) as c FROM USERS').get() as any).c;
  const patCount = (db.prepare('SELECT COUNT(*) as c FROM SCRAPER_PATTERNS').get() as any).c;
  const mspCount = (db.prepare('SELECT COUNT(*) as c FROM MARKET_SCRAPER_PATTERNS').get() as any).c;
  const paramCount = (db.prepare('SELECT COUNT(*) as c FROM CATEGORY_PARAMETERS').get() as any).c;

  console.log('✅ [DML Runner] Carga de dados concluída no banco: ' + dbPath);
  console.log(`📊 Estatísticas atuais do SQLite:`);
  console.log(`   - Regiões:             ${regCount}`);
  console.log(`   - Mercados:            ${mktCount}`);
  console.log(`   - Categorias:          ${catCount}`);
  console.log(`   - Parâmetros Categ.:   ${paramCount}`);
  console.log(`   - Produtos:            ${prdCount}`);
  console.log(`   - Ofertas:             ${offCount}`);
  console.log(`   - Administradores:     ${usrCount}`);
  console.log(`   - Padrões Scraper:     ${patCount}`);
  console.log(`   - Vinculações Padrões: ${mspCount}`);

  db.close();
}

main();

