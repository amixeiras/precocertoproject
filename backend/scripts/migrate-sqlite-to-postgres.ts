import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

async function migrate() {
  console.log('===========================================================');
  console.log('🚀 [MIGRAÇÃO] SQLite (precocerto.db) ➜ PostgreSQL');
  console.log('===========================================================');

  const connectionString =
    process.env['DATABASE_URL'] || 'postgresql://postgres:postgrespassword@localhost:5432/precocerto';
  console.log(`🔌 Conectando ao PostgreSQL em: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso com o PostgreSQL!');

    // 1. Aplica o Schema DDL no PostgreSQL
    const ddlPath = path.resolve(__dirname, 'ddl/postgres_schema.sql');
    if (fs.existsSync(ddlPath)) {
      console.log('📄 Aplicando schema DDL no PostgreSQL...');
      const ddlSql = fs.readFileSync(ddlPath, 'utf-8');
      await client.query(ddlSql);
      console.log('✅ Schema DDL criado/atualizado com sucesso no PostgreSQL.');
    }

    // 2. Abre o SQLite de origem
    const sqlitePath = path.resolve(__dirname, '../data/precocerto.db');
    if (!fs.existsSync(sqlitePath)) {
      console.error(`❌ Banco SQLite não encontrado em: ${sqlitePath}`);
      client.release();
      await pool.end();
      return;
    }

    const sqlite = new Database(sqlitePath);
    console.log(`🗄️ SQLite de origem conectado: ${sqlitePath}`);

    // Ordem de migração para respeitar chaves estrangeiras
    const tabelas = [
      'REGIONS',
      'CATEGORIES',
      'MARKETS',
      'PRODUCTS',
      'MARKET_OFFERS',
      'USERS',
      'CATEGORY_PARAMETERS',
      'SCRAPER_PATTERNS',
      'MARKET_SCRAPER_PATTERNS'
    ];

    for (const tabela of tabelas) {
      const rows = sqlite.prepare(`SELECT * FROM ${tabela}`).all() as Record<string, any>[];
      if (rows.length === 0) {
        console.log(`ℹ️ [${tabela}] 0 registros.`);
        continue;
      }

      console.log(`⏳ Migrando ${rows.length} registros para ${tabela}...`);
      const colunas = Object.keys(rows[0]!);

      for (const row of rows) {
        const placeholders = colunas.map((_, i) => `$${i + 1}`).join(', ');
        const colunasStr = colunas.join(', ');
        const values = colunas.map((c) => row[c] ?? null);

        const updateSet = colunas
          .filter((c) => c !== 'id')
          .map((c) => `${c} = EXCLUDED.${c}`)
          .join(', ');

        const conflictClause =
          updateSet.length > 0
            ? `ON CONFLICT (id) DO UPDATE SET ${updateSet}`
            : 'ON CONFLICT (id) DO NOTHING';

        const sql = `
          INSERT INTO ${tabela} (${colunasStr})
          VALUES (${placeholders})
          ${conflictClause}
        `;

        await client.query(sql, values);
      }

      console.log(`✅ [${tabela}] ${rows.length} registros sincronizados.`);
    }

    console.log('===========================================================');
    console.log('🎉 Migração de SQLite para PostgreSQL concluída com sucesso!');
    console.log('===========================================================');

    sqlite.close();
    client.release();
  } catch (error: any) {
    console.error('❌ Erro durante a migração para o PostgreSQL:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();

