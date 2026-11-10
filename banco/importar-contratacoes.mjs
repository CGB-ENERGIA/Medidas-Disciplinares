// Importa os dados do site de Contratações antigo (Artifact) para o Neon.
//
//   1) No site antigo, rode o trecho de banco/contratacoes-exportar-antigo.js (ver banco/LEIA-ME.md). Ele baixa um .zip.
//   2) Descompacte o .zip numa pasta (fora do repositório!). Ela terá: dados.json, arquivos.json e a pasta arquivos/.
//   3) Confira sem gravar:   npm run ct:importar -- --pasta "C:\caminho\da\pasta" --simular
//      Importe de verdade:   npm run ct:importar -- --pasta "C:\caminho\da\pasta"
//
// Pode rodar de novo sem duplicar: documentos são substituídos pelo mesmo id e cada arquivo é guardado uma vez só.
// Os dados têm nomes e currículos de pessoas: a pasta NÃO deve ir para o GitHub nem ficar solta em local sem controle de acesso.
import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { COLECOES, norm } from "../api/_lib/ct.js";

const { values: a } = parseArgs({ options: { pasta: { type: "string" }, simular: { type: "boolean" } } });
const falha = m => { console.error("Erro:", m); process.exit(1); };
if (!a.pasta) falha('Informe --pasta "caminho da pasta descompactada".');
if (!process.env.DATABASE_URL) falha("Falta a DATABASE_URL no arquivo .env.");

const ler = async (nome, padrao) => { try { return JSON.parse(await readFile(join(a.pasta, nome), "utf8")); } catch (e) { if (padrao !== undefined) return padrao; falha(`Não consegui ler ${nome} na pasta: ${e.message}`); } };
const dados = await ler("dados.json");                  // { colecao: { docId: {...} } }
const tipos = await ler("arquivos.json", {});           // { idAntigo: { tipo, nome } }
let nomesArq = []; try { nomesArq = await readdir(join(a.pasta, "arquivos")); } catch {}
const ARQ_OK = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "text/plain", "application/msword", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

// Resumo do que vai entrar
const colecoes = Object.keys(dados);
const desconhecidas = colecoes.filter(c => !COLECOES.includes(c));
if (desconhecidas.length) console.warn(`Atenção: coleções ignoradas (não fazem parte do módulo): ${desconhecidas.join(", ")}`);
console.log("\nO que há na pasta:");
for (const c of COLECOES) if (dados[c]) console.log(`  ${c.padEnd(12)} ${String(Object.keys(dados[c]).length).padStart(6)} documentos`);
console.log(`  arquivos     ${String(nomesArq.length).padStart(6)}`);

// Todo texto que seja o id de um arquivo antigo passa a apontar para o id novo
const trocarIds = (v, mapa) => typeof v === "string" ? (mapa.has(v) ? mapa.get(v) : v) : Array.isArray(v) ? v.map(x => trocarIds(x, mapa)) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trocarIds(x, mapa)])) : v;

if (a.simular) {
  const grandes = []; let semTipo = 0;
  for (const n of nomesArq) { const t = (tipos[n] || {}).tipo; if (!ARQ_OK.has(t)) semTipo++; }
  console.log(`\nSimulação: nada foi gravado. ${semTipo ? `${semTipo} arquivo(s) sem tipo aceito (serão ignorados). ` : ""}Para importar, rode de novo sem --simular.`);
  process.exit(0);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");
  // 1) arquivos: cada um entra uma vez (o id antigo fica em origem_id)
  const mapa = new Map(); let novos = 0, jaTinha = 0, ignorados = 0, grandes = 0;
  for (const nome of nomesArq) {
    const meta = tipos[nome] || {};
    if (!ARQ_OK.has(meta.tipo)) { ignorados++; continue; }
    const { rows: [ex] } = await db.query("select id from ct_arquivos where origem_id = $1", [nome]);
    if (ex) { mapa.set(nome, ex.id); jaTinha++; continue; }
    const buf = await readFile(join(a.pasta, "arquivos", nome));
    if (buf.length > 4_000_000) grandes++;
    const { rows: [novo] } = await db.query("insert into ct_arquivos (nome, tipo, tamanho, conteudo, origem_id) values ($1, $2, $3, $4, $5) returning id",
      [String(meta.nome || nome).slice(0, 200), meta.tipo, buf.length, buf, nome]);
    mapa.set(nome, novo.id); novos++;
  }
  // 2) documentos
  let docs = 0;
  for (const col of colecoes.filter(c => COLECOES.includes(c))) {
    for (const [id, d] of Object.entries(dados[col])) {
      const doc = trocarIds(d, mapa);
      const sol = ["candidatos", "vagas"].includes(col) ? norm(doc.solicitante) || null : null;
      await db.query(`insert into ct_docs (colecao, id, dados, solicitante_norm) values ($1, $2, $3::jsonb, $4)
                      on conflict (colecao, id) do update set dados = excluded.dados, solicitante_norm = excluded.solicitante_norm,
                        atualizado_em = now(), removido = false, versao = nextval('ct_versao_seq')`, [col, id, JSON.stringify(doc), sol]);
      docs++;
    }
  }
  await db.query("insert into ct_log (usuario_nome, colecao, doc_id, acao) values ('importação', '*', $1, $2)", [`pasta importada`, `importou ${docs} documentos e ${novos} arquivos`]);
  await db.query("commit");
  console.log(`\nImportado: ${docs} documentos; arquivos: ${novos} novos, ${jaTinha} já estavam, ${ignorados} ignorados (tipo não aceito).`);
  if (grandes) console.warn(`Atenção: ${grandes} arquivo(s) passam de 4 MB. Eles entraram, mas o download pelo site pode falhar (limite da Vercel). Reduza-os depois.`);
  console.log("Confira no site: Contratações → Painel (totais de vagas, candidatos e banco de talentos).\n");
} catch (e) {
  await db.query("rollback").catch(() => {});
  falha("a importação foi desfeita (nada foi gravado): " + e.message);
} finally {
  await db.end().catch(() => {});
}
