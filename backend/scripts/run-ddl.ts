import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

function main() {
  console.log('🚀 [DDL Runner] Executando scripts de DDL no SQLite...');

  const dbDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'precocerto.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  const ddlDir = path.resolve(__dirname, 'ddl');
  const files = fs.readdirSync(ddlDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = path.join(ddlDir, file);
    console.log(`📄 Executando DDL: ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf-8');
    db.exec(sql);
  }

  // Migrações seguras para colunas que possam não existir em bancos existentes
  try { db.exec('ALTER TABLE PRODUCTS ADD COLUMN image_url TEXT'); } catch {}
  try { db.exec('ALTER TABLE MARKET_OFFERS ADD COLUMN image_url TEXT'); } catch {}
  try { db.exec('ALTER TABLE MARKET_SCRAPER_PATTERNS ADD COLUMN scraper_patterns_id TEXT'); } catch {}
  try { db.exec('UPDATE MARKET_SCRAPER_PATTERNS SET scraper_patterns_id = pattern_id WHERE scraper_patterns_id IS NULL'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_msp_scraper_patterns ON MARKET_SCRAPER_PATTERNS(scraper_patterns_id)'); } catch {}

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  console.log(`✅ [DDL Runner] Todas as tabelas e índices criados com sucesso no banco: ${dbPath}`);
  console.log(`📋 Tabelas ativas: ${tables.map(t => t.name).join(', ')}`);
  db.close();
}

main();

