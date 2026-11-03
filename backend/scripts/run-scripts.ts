import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

function executeSqlFiles(db: Database.Database, dirPath: string, label: string) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Pasta ${dirPath} não encontrada.`);
    return;
  }
  const files = fs.readdirSync(dirPath).filter((f) => /^\d+.*\.sql$/.test(f) || (label === 'DDL' && f.endsWith('.sql'))).sort();
  console.log(`\n📂 Executando scripts em ${label} (${files.length} arquivos):`);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    console.log(`   ▶ Executando ${file}...`);
    const sql = fs.readFileSync(fullPath, 'utf-8');
    db.exec(sql);
  }
}

function main() {
  console.log('=====================================================');
  console.log('🛠️  [PREÇO CERTO] EXECUTOR DE DDL E DML (SQLITE)');
  console.log('=====================================================');

  const dbDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'precocerto.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // 1. Executa DDL
  const ddlDir = path.resolve(__dirname, 'ddl');
  executeSqlFiles(db, ddlDir, 'DDL');

  // Migrações seguras de colunas
  try { db.exec('ALTER TABLE PRODUCTS ADD COLUMN image_url TEXT'); } catch {}
  try { db.exec('ALTER TABLE MARKET_OFFERS ADD COLUMN image_url TEXT'); } catch {}
  try { db.exec('ALTER TABLE MARKET_SCRAPER_PATTERNS ADD COLUMN scraper_patterns_id TEXT'); } catch {}
  try { db.exec('UPDATE MARKET_SCRAPER_PATTERNS SET scraper_patterns_id = pattern_id WHERE scraper_patterns_id IS NULL'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_msp_scraper_patterns ON MARKET_SCRAPER_PATTERNS(scraper_patterns_id)'); } catch {}

  // 2. Executa DML
  const dmlDir = path.resolve(__dirname, 'dml');
  executeSqlFiles(db, dmlDir, 'DML');

  // Estatísticas finais
  const regCount = (db.prepare('SELECT COUNT(*) as c FROM REGIONS').get() as any).c;
  const mktCount = (db.prepare('SELECT COUNT(*) as c FROM MARKETS').get() as any).c;
  const catCount = (db.prepare('SELECT COUNT(*) as c FROM CATEGORIES').get() as any).c;
  const prdCount = (db.prepare('SELECT COUNT(*) as c FROM PRODUCTS').get() as any).c;
  const offCount = (db.prepare('SELECT COUNT(*) as c FROM MARKET_OFFERS').get() as any).c;
  const usrCount = (db.prepare('SELECT COUNT(*) as c FROM USERS').get() as any).c;
  const patCount = (db.prepare('SELECT COUNT(*) as c FROM SCRAPER_PATTERNS').get() as any).c;
  const mspCount = (db.prepare('SELECT COUNT(*) as c FROM MARKET_SCRAPER_PATTERNS').get() as any).c;
  const paramCount = (db.prepare('SELECT COUNT(*) as c FROM CATEGORY_PARAMETERS').get() as any).c;

  console.log('\n=====================================================');
  console.log('✅ BANCO DE DADOS SQLITE PRONTO E ALIMENTADO!');
  console.log('=====================================================');
  console.log(`📊 Local do arquivo: ${dbPath}`);
  console.log(`📍 Regiões cadastradas:        ${regCount}`);
  console.log(`🏪 Mercados cadastrados:       ${mktCount}`);
  console.log(`🏷️ Categorias cadastradas:     ${catCount}`);
  console.log(`📋 Parâmetros de Categoria:    ${paramCount}`);
  console.log(`📦 Produtos cadastrados:       ${prdCount}`);
  console.log(`💰 Ofertas cadastradas:        ${offCount}`);
  console.log(`👤 Administradores:            ${usrCount}`);
  console.log(`⚙️  Padrões de Scraping:        ${patCount}`);
  console.log(`🔗 Vínculos Padrão-Mercado:    ${mspCount}`);
  console.log('=====================================================\n');

  db.close();
}

main();

