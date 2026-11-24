// Junta novos inscritos ao Banco de talentos do Contratações (aba "Inscritos"), sem apagar nada.
//
//   npm run talentos:importar             → junta e grava (faz uma cópia de segurança antes)
//   npm run talentos:importar -- --simular → só mostra o que faria, sem gravar
//
// Entrada: contratacoes-exportacao-talentos/talentos-novos.json (gerado das planilhas do RH; fica só no seu computador)
// Como junta:
//   - a mesma pessoa (nome igual, sem acento, ou mesmo telefone com o mesmo primeiro nome) vira UMA só:
//     ganha os registros novos no histórico e os dados que faltavam (telefone, e-mail, cidade, CNH, programas);
//   - quem não existia entra com um id novo;
//   - nada do que já estava no banco é apagado; as marcações feitas no site (talentosEd) continuam valendo.
// Pode rodar de novo sem duplicar. Quando uma planilha vem atualizada, os registros dela substituem os da versão anterior.
import pg from "pg";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "contratacoes-exportacao-talentos");
const ENTRADA = join(PASTA, "talentos-novos.json");
const SIMULAR = process.argv.includes("--simular");
const MAX_PARTE = 2_000_000;   // cada parte fica bem abaixo do limite de um documento (3,5 MB)

const url = process.env.DATABASE_URL;
if (!url || url.includes("COLE_AQUI")) { console.error("Falta a DATABASE_URL no arquivo .env."); process.exit(1); }
if (!existsSync(ENTRADA)) { console.error("Não achei " + ENTRADA); process.exit(1); }

const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const dig = s => String(s || "").replace(/\D/g, "");
const chaveH = h => JSON.stringify([h.fonte || "", h.d || "", norm(h.funcao), norm(h.st), norm(h.obs), norm(h.cert)]);

const novos = JSON.parse(readFileSync(ENTRADA, "utf8"));
const db = new pg.Client({ connectionString: url });
try {
  await db.connect();
  const { rows } = await db.query("select id, dados from ct_docs where colecao = 'talentos' and not removido");
  const meta = (rows.find(r => r.id === "meta") || {}).dados || {};
  const nPartes = meta.partes || 0;
  const partes = Array.from({ length: nPartes }, (_, i) => rows.find(r => r.id === "p" + (i + 1)));
  if (partes.some(p => !p)) { console.error("O banco de talentos atual está incompleto (falta alguma parte). Nada foi gravado."); process.exit(1); }
  const lista = partes.flatMap(p => p.dados.r || []);
  // quem foi cadastrado pelo site (um documento por pessoa, id "c-…") entra na conta para não duplicar e passa a morar nas partes
  const doSite = rows.filter(r => r.id.startsWith("c-") && r.dados && r.dados.p);
  for (const r of doSite) lista.push({ ...r.dados.p, id: r.id });
  console.log(`Banco de talentos atual: ${lista.length} pessoas (${nPartes} parte(s) das planilhas${doSite.length ? ` + ${doSite.length} do site` : ""}).`);

  // cópia de segurança do que está no banco agora
  if (!SIMULAR) {
    mkdirSync(PASTA, { recursive: true });
    const arq = join(PASTA, `backup-talentos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);
    writeFileSync(arq, JSON.stringify({ meta, partes: partes.map(p => ({ id: p.id, dados: p.dados })), doSite: doSite.map(r => ({ id: r.id, dados: r.dados })) }));
    console.log("Cópia de segurança salva em " + arq);
  }

  const porNome = new Map(), porTel = new Map(), ids = new Set();
  lista.forEach(p => { porNome.set(norm(p.nome), p); const t = dig(p.tel); if (t.length >= 10) porTel.set(t, p); ids.add(p.id); });
  let juntou = 0, entrou = 0, regNovos = 0, regIguais = 0, regTrocados = 0;
  const FONTES = new Set(novos.fontes || []), vistos = new Set();
  for (const n of novos.pessoas) {
    let p = porNome.get(norm(n.nome));
    if (!p) { const t = dig(n.tel), q = t.length >= 10 && porTel.get(t); if (q && norm(q.nome).split(" ")[0] === norm(n.nome).split(" ")[0]) p = q; }
    if (p) {
      juntou++; vistos.add(p.id);
      for (const c of ["tel", "email", "cidade", "cnh"]) if (n[c] && !p[c]) p[c] = n[c];
      if (n.tags) p.tags = [...new Set([...(p.tags || []), ...n.tags])];
      p.hist = p.hist || [];
      // a versão nova de cada planilha SUBSTITUI a anterior: tira os registros antigos dessas planilhas e põe os atuais
      const antes = new Set(p.hist.filter(h => FONTES.has(h.fonte)).map(chaveH));
      p.hist = p.hist.filter(h => !FONTES.has(h.fonte));
      const tem = new Set(p.hist.map(chaveH));
      for (const h of n.hist) { if (tem.has(chaveH(h))) continue; p.hist.push(h); tem.add(chaveH(h)); if (antes.has(chaveH(h))) { regIguais++; antes.delete(chaveH(h)); } else regNovos++; }
      regTrocados += antes.size;
      p.hist.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
    } else {
      let id = n.id; while (ids.has(id)) id = id + "x";
      lista.push({ ...n, id }); ids.add(id);   // as planilhas novas já vêm sem repetição: compara só com quem já estava no banco
      entrou++; regNovos += n.hist.length;
    }
  }
  // todos com os mesmos campos (a tela espera a lista de programas e o histórico sempre presentes)
  for (const p of lista) { for (const c of ["tel", "email", "cidade", "cnh"]) if (p[c] == null) p[c] = ""; if (!Array.isArray(p.tags)) p.tags = []; if (!Array.isArray(p.hist)) p.hist = []; }
  lista.sort((a, b) => norm(a.nome).localeCompare(norm(b.nome)));
  console.log(`Planilhas novas: ${novos.pessoas.length} pessoas.`);
  console.log(`  ${juntou} já estavam no banco (ganharam os registros novos)`);
  console.log(`  ${entrou} pessoas novas`);
  console.log(`  ${regNovos} registros novos ou atualizados · ${regIguais} iguais aos que já estavam · ${regTrocados} versões antigas substituídas`);
  const sairam = lista.filter(p => !vistos.has(p.id) && !novos.pessoas.some(n => n.id === p.id) && (p.hist || []).some(h => FONTES.has(h.fonte)));
  if (sairam.length) console.log(`  ${sairam.length} pessoa(s) não estão mais nas planilhas novas: continuam no banco como estavam (${sairam.slice(0, 8).map(p => p.nome).join(", ")}${sairam.length > 8 ? "…" : ""})`);
  console.log(`Banco de talentos depois: ${lista.length} pessoas.`);

  // divide em partes e grava
  const novasPartes = []; let atual = [], tam = 0;
  for (const p of lista) { const t = JSON.stringify(p).length + 1; if (atual.length && tam + t > MAX_PARTE) { novasPartes.push(atual); atual = []; tam = 0; } atual.push(p); tam += t; }
  if (atual.length) novasPartes.push(atual);
  if (SIMULAR) console.log(`(simulação: gravaria ${novasPartes.length} parte(s); nada foi gravado)`);
  else {
  await db.query("begin");
  const grava = (id, dados) => db.query(`insert into ct_docs (colecao, id, dados) values ('talentos', $1, $2::jsonb)
      on conflict (colecao, id) do update set dados = excluded.dados, removido = false, atualizado_em = now(), versao = nextval('ct_versao_seq')`, [id, JSON.stringify(dados)]);
  for (let i = 0; i < novasPartes.length; i++) await grava("p" + (i + 1), { r: novasPartes[i] });
  for (let i = novasPartes.length; i < nPartes; i++)
    await db.query("update ct_docs set removido = true, atualizado_em = now(), versao = nextval('ct_versao_seq') where colecao = 'talentos' and id = $1", ["p" + (i + 1)]);
  for (const r of doSite)
    await db.query("update ct_docs set removido = true, atualizado_em = now(), versao = nextval('ct_versao_seq') where colecao = 'talentos' and id = $1", [r.id]);
  const fontes = [...new Set([...(meta.fontes || []), ...(novos.fontes || [])])];
  await grava("meta", { ...meta, partes: novasPartes.length, total: lista.length, fontes, atualizado: new Date().toISOString().slice(0, 10) });
  await db.query("insert into ct_log (usuario_nome, colecao, doc_id, acao) values ('importação das planilhas do RH', 'talentos', 'meta', $1)",
    [`juntou ${novos.pessoas.length} pessoas (${entrou} novas, ${juntou} atualizadas)`]);
  await db.query("commit");
  console.log(`Gravado: ${novasPartes.length} parte(s). Abra Contratações › Banco de talentos › Inscritos.`);
  }
} catch (e) {
  await db.query("rollback").catch(() => {});
  console.error("Erro (nada foi gravado):", e.message);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
