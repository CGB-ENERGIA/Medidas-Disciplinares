// Zera o Setor de TI (Central Administrativa): apaga as compras/notas (ti_notas) e as novas aquisições (ti_aquis) do banco.
// Antes de apagar, guarda uma cópia em dados/ti-backup-AAAA-MM-DD.json (a pasta dados/ não vai para o GitHub).
// A configuração (meta mensal, grupos de contrato e nomes de fornecedores, em ti_cfg) é mantida.
//   npm run ti:zerar
import { writeFileSync, mkdirSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta a DATABASE_URL no .env."); process.exit(1); }
const db = new pg.Client({ connectionString: url });
await db.connect();
try {
  const { rows } = await db.query("select colecao, id, dados from ca_docs where colecao in ('ti_notas', 'ti_aquis') order by colecao, id");
  mkdirSync("dados", { recursive: true });
  const arq = `dados/ti-backup-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(arq, JSON.stringify(rows, null, 1));
  console.log(`Cópia de segurança: ${arq} (${rows.length} registro(s)).`);
  await db.query("begin");
  const r = await db.query("delete from ca_docs where colecao in ('ti_notas', 'ti_aquis')");
  await db.query("commit");
  console.log(`Setor de TI zerado: ${r.rowCount} registro(s) apagado(s). A meta e os fornecedores continuam.`);
} catch (e) { await db.query("rollback").catch(() => {}); console.error("Erro, nada foi apagado:", e.message); process.exitCode = 1; }
finally { await db.end(); }
