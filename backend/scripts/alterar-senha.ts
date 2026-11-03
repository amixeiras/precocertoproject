import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../data/precocerto.db');

function alterarSenhaAdmin(): void {
  const args = process.argv.slice(2);
  const novaSenha = args[0];

  if (!novaSenha) {
    console.error('❌ Por favor, informe a nova senha como argumento.');
    console.log('👉 Exemplo: npm run admin:senha -- "MinhaNovaSenha123"');
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  const resultado = db
    .prepare("UPDATE USERS SET password = ? WHERE username = 'admin'")
    .run(novaSenha);

  if (resultado.changes > 0) {
    console.log(`✅ [SQLite] Senha do usuário 'admin' alterada com sucesso para: "${novaSenha}"`);
  } else {
    // Se o usuário admin não existir, insere
    db.prepare("INSERT INTO USERS (id, username, password, created_at) VALUES ('usr-admin', 'admin', ?, datetime('now'))").run(novaSenha);
    console.log(`✅ [SQLite] Usuário 'admin' criado com sucesso com a nova senha.`);
  }

  db.close();
}

alterarSenhaAdmin();

