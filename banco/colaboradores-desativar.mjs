// Tira dos cadastros quem foi demitido: marca como inativo (ativo = false) os colaboradores listados em dados/colaboradores-demitidos.csv
// (npm run colaboradores:desativar). Quem está inativo some das listas (Atendimento, Gestão Administrativa), mas NADA é apagado:
// as medidas disciplinares e os atendimentos antigos continuam ligados à chapa. Dá para desfazer: se a chapa voltar para
// dados/colaboradores.csv e rodar "npm run colaboradores:atualizar", a pessoa fica ativa de novo.
// Tudo numa transação: se der erro, nada é gravado. Rodar duas vezes não faz mal.
import pg from "pg";
import { lerCSV } from "./importar-core.mjs";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta a DATABASE_URL no arquivo .env."); process.exit(1); }
const chapas = [...new Set(lerCSV("colaboradores-demitidos.csv").map(x => String(x.chapa || "").trim()).filter(Boolean))];
if (!chapas.length) { console.error("Nenhuma chapa em dados/colaboradores-demitidos.csv."); process.exit(1); }

const db = new pg.Client({ connectionString: url });
try {
  await db.connect();
  await db.query("begin");
  const r = await db.query("update colaboradores set ativo = false, atualizado_em = now() where chapa = any($1::text[]) and ativo returning chapa", [chapas]);
  await db.query("commit");
  const tot = (await db.query("select count(*)::int as n, count(*) filter (where ativo)::int as a from colaboradores")).rows[0];
  const marcados = r.rows.length, jaInativos = chapas.length - marcados;
  console.log(`Pronto: ${marcados} colaborador(es) marcado(s) como inativo(s).${jaInativos ? ` ${jaInativos} da lista já estava(m) inativo(s) ou não existe(m) no banco.` : ""}`);
  console.log(`No banco agora: ${tot.n} colaboradores (${tot.a} ativos). Ninguém foi apagado.`);
} catch (e) {
  await db.query("rollback").catch(() => {});
  console.error("Erro (nada foi gravado):", e.message);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
