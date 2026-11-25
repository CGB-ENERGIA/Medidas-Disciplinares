// Atualiza a base de colaboradores e equipes a partir de dados/colaboradores.csv (npm run colaboradores:atualizar).
// Só acrescenta e atualiza: ninguém é desativado nem apagado (quem não está no arquivo fica como está).
// Tudo numa transação: se der erro, nada é gravado.
import pg from "pg";
import { lerCSV } from "./importar-core.mjs";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta a DATABASE_URL no arquivo .env."); process.exit(1); }
const vazio = v => (v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim());
const BASES = new Set(["BCB", "STI", "PDT", "PDS", "ITM", "BDC"]);

const linhas = lerCSV("colaboradores.csv").filter(x => vazio(x.chapa) && vazio(x.nome));
const db = new pg.Client({ connectionString: url });
try {
  await db.connect();
  const antes = new Map((await db.query("select chapa from colaboradores")).rows.map(r => [r.chapa, 1]));
  await db.query("begin");
  let novos = 0, atualizados = 0;
  for (let i = 0; i < linhas.length; i += 300) {
    const lote = linhas.slice(i, i + 300);
    const pc = [], vc = [], pe = [], ve = [];
    for (const x of lote) {
      const base = BASES.has(vazio(x.base)) ? vazio(x.base) : null;
      pc.push(x.chapa.trim(), x.nome.trim(), vazio(x.funcao), base, vazio(x.centro_custo));
      vc.push(`($${pc.length - 4}, $${pc.length - 3}, $${pc.length - 2}, $${pc.length - 1}, $${pc.length}, true)`);
      pe.push(x.chapa.trim(), vazio(x.setor), vazio(x.equipe), vazio(x.tipo_equipe), vazio(x.supervisor), vazio(x.coordenador));
      ve.push(`($${pe.length - 5}, $${pe.length - 4}, $${pe.length - 3}, $${pe.length - 2}, $${pe.length - 1}, $${pe.length})`);
      antes.has(x.chapa.trim()) ? atualizados++ : novos++;
    }
    await db.query(`insert into colaboradores (chapa, nome, funcao, base, centro_custo, ativo) values ${vc.join(", ")}
      on conflict (chapa) do update set nome = excluded.nome, funcao = excluded.funcao, base = excluded.base,
      centro_custo = coalesce(excluded.centro_custo, colaboradores.centro_custo), ativo = true, atualizado_em = now()`, pc);
    await db.query(`insert into equipes (chapa, setor, equipe, tipo_equipe, supervisor, coordenador) values ${ve.join(", ")}
      on conflict (chapa) do update set setor = excluded.setor, equipe = excluded.equipe, tipo_equipe = excluded.tipo_equipe,
      supervisor = excluded.supervisor, coordenador = excluded.coordenador, atualizado_em = now()`, pe);
  }
  await db.query("commit");
  const tot = (await db.query("select count(*)::int as n, count(*) filter (where ativo)::int as a from colaboradores")).rows[0];
  console.log(`Pronto: ${novos} colaboradores novos e ${atualizados} atualizados.`);
  console.log(`No banco agora: ${tot.n} colaboradores (${tot.a} ativos). Ninguém foi desativado.`);
} catch (e) {
  await db.query("rollback").catch(() => {});
  console.error("Erro (nada foi gravado):", e.message);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
