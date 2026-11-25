// Prepara a Central Administrativa para o site e (opcional) manda os dados para o Neon.
//
//   npm run central:tabelas → cria só as tabelas e colunas da Central (a parte final do banco/schema.sql)
//   npm run central:site    → gera site/central.html SEM dados pessoais (pode ir para o GitHub)
//   npm run central:banco   → grava no Neon os dados da Central (tabela ca_carga), separados por área,
//                             e importa uma vez os lançamentos exportados do Artifact (tabela ca_docs)
//
// Entrada: central-administrativa/site/central.html (a Central completa, com os dados; fica só no seu computador)
// Os dados vão para o banco comprimidos; o site busca pela API (/api/ca-carga) depois do login, só a parte da área.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, "..");
const ENTRADA = join(AQUI, "site", "central.html");
const SAIDA = join(RAIZ, "site", "central.html");
const EXPORTADO = join(AQUI, "banco-exportado", "central-banco-2026-11-23.json");
const acao = process.argv[2];

const ABRE = '<script id="dados" type="application/json">';
const LE_RAW = "RAW=JSON.parse($('dados').textContent)";

function lerCentral() {
  if (!existsSync(ENTRADA)) { console.error("Não achei " + ENTRADA); process.exit(1); }
  const html = readFileSync(ENTRADA, "utf8");
  const i = html.indexOf(ABRE), j = html.indexOf("</script>", i);
  if (i < 0 || j < 0 || !html.includes(LE_RAW)) { console.error("O central.html não está no formato esperado (bloco de dados não encontrado)."); process.exit(1); }
  return { html, i, j, dados: JSON.parse(html.slice(i + ABRE.length, j)) };
}

// ---------- Dados por área ----------
// Os indicadores gerais cruzam as áreas (ex.: o catálogo calcula todos), então cada área recebe a estrutura completa,
// mas os dados pessoais das OUTRAS áreas vão em branco (nomes, matrículas, endereços, UCs, perguntas do Fale Conosco).
const branco = l => (l || []).map(() => "");
const tira = (lista, campos) => (lista || []).map(x => { const y = { ...x }; for (const c of campos) if (c in y) y[c] = ""; return y; });
function cargaDaArea(D, area) {
  if (area === "admin") return D;
  const x = { ...D };
  if (area !== "financeiro") {
    x.d = { ...D.d, col: branco(D.d.col), sol: branco(D.d.sol), aut: branco(D.d.aut), mot: branco(D.d.mot) };
    x.alim = { ...D.alim, d: { ...D.alim.d, col: branco(D.alim.d.col), sol: branco(D.alim.d.sol), aut: branco(D.alim.d.aut), mot: branco(D.alim.d.mot) } };
    x.loc = { ...D.loc, imv: tira(D.loc.imv, ["lo", "end", "uca", "ucn", "ucag"]) };
  }
  if (area !== "patrimonio") x.pat = { ...D.pat, inv: tira(D.pat.inv, ["nm", "mat"]), cad: tira(D.pat.cad, ["nm", "mat", "nm2", "mat2"]), cron: tira(D.pat.cron, ["obs"]) };
  if (area !== "atendimento") x.fc = { ...D.fc, at: tira(D.fc.at, ["nm", "mat", "q", "res"]) };
  return x;
}
export const AREAS = ["financeiro", "patrimonio", "atendimento", "ti", "admin"];

if (acao === "site") {
  const { html, i, j } = lerCentral();
  let s = html.slice(0, i + ABRE.length) + "{}" + html.slice(j);
  s = s.replace(LE_RAW, "RAW=(window.CA_CARGA||JSON.parse($('dados').textContent))");
  s = s.replace("<head>", '<head><script src="/ca-adaptador.js"></script>');
  writeFileSync(SAIDA, s);
  console.log(`site/central.html gerado sem dados (${(s.length / 1e6).toFixed(1)} MB).`);
} else if (acao === "testar-areas") {          // só para conferência local: grava a carga de cada área em arquivos
  const { dados } = lerCentral(), dir = process.argv[3] || ".";
  for (const a of AREAS) writeFileSync(join(dir, `carga-${a}.json`), JSON.stringify(cargaDaArea(dados, a)));
  console.log("Cargas gravadas em " + dir);
} else if (acao === "tabelas") {             // só a parte da Central no banco/schema.sql (não roda o resto do arquivo)
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("Falta a DATABASE_URL no .env."); process.exit(1); }
  const sqlTudo = readFileSync(join(RAIZ, "banco", "schema.sql"), "utf8");
  const i = sqlTudo.indexOf("-- ---------- Central Administrativa (nov/2026)");
  if (i < 0) { console.error("Não achei a parte da Central no banco/schema.sql."); process.exit(1); }
  const pg = (await import("pg")).default, db = new pg.Client({ connectionString: url });
  await db.connect();
  try { await db.query(sqlTudo.slice(i)); console.log("Tabelas da Central criadas (ou já existiam)."); }
  finally { await db.end(); }
} else if (acao === "banco") {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("Falta a DATABASE_URL no .env."); process.exit(1); }
  const pg = (await import("pg")).default, db = new pg.Client({ connectionString: url });
  await db.connect();
  try {
    const { dados } = lerCentral();
    for (const a of AREAS) {
      const gz = gzipSync(Buffer.from(JSON.stringify(cargaDaArea(dados, a))), { level: 9 });
      await db.query(`insert into ca_carga (area, conteudo, gerado) values ($1, $2, $3)
                      on conflict (area) do update set conteudo = excluded.conteudo, gerado = excluded.gerado, atualizado_em = now()`, [a, gz, dados.gerado || null]);
      console.log(`  ${a.padEnd(12)} ${(gz.length / 1024).toFixed(0)} KB`);
    }
    if (existsSync(EXPORTADO)) {
      const { docs } = JSON.parse(readFileSync(EXPORTADO, "utf8")); let n = 0;
      for (const [caminho, obj] of Object.entries(docs)) {
        if (/^ti_(notas|aquis)\//.test(caminho)) continue;   // Setor de TI começou do zero em 25/11/2026: não volta compra antiga
        const k = caminho.indexOf("/"), col = caminho.slice(0, k), id = caminho.slice(k + 1);
        const r = await db.query(`insert into ca_docs (colecao, id, dados) values ($1, $2, $3::jsonb) on conflict (colecao, id) do nothing`, [col, id, JSON.stringify(obj)]);
        n += r.rowCount;
      }
      console.log(`Lançamentos do Artifact importados: ${n} novo(s) de ${Object.keys(docs).length}.`);
    }
    console.log("Pronto: dados da Central no banco.");
  } finally { await db.end(); }
} else {
  console.error("Use: node central-administrativa/publicar.mjs site | banco");
  process.exitCode = 1;
}
