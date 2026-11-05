// Uso:
//   npm run db:testar     → confere a conexão com o Neon
//   npm run db:schema     → cria as tabelas
//   npm run db:importar   → importa os CSVs da pasta dados/
// A conexão vem de DATABASE_URL, no arquivo .env (nunca coloque a senha aqui no código).
import pg from "pg";
import { criarTabelas, importar, contar } from "./importar-core.mjs";

const acao = process.argv[2];
const url = process.env.DATABASE_URL;
if (!url || url.includes("COLE_AQUI")) {
  console.error("Falta a DATABASE_URL no arquivo .env (copie o .env.example para .env e cole a connection string do Neon).");
  process.exit(1);
}

const db = new pg.Client({ connectionString: url });
try {
  await db.connect();
  if (acao === "testar") {
    const { rows } = await db.query("select current_database() as banco, current_user as usuario, version() as versao");
    console.log(`Conectado ao banco "${rows[0].banco}" como ${rows[0].usuario}.`);
    console.log(rows[0].versao.split(",")[0]);
  } else if (acao === "schema") {
    await criarTabelas(db);
    console.log("Tabelas criadas (ou já existiam).");
  } else if (acao === "importar") {
    console.log("Importando…");
    await importar(db);
    console.log("\nTotal no banco:");
    for (const [t, n] of Object.entries(await contar(db))) console.log(`  ${t.padEnd(22)} ${String(n).padStart(5)}`);
  } else {
    console.error("Ação desconhecida. Use: testar, schema ou importar.");
    process.exitCode = 1;
  }
} catch (e) {
  console.error("Erro:", e.message);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
