// Carrega a Tabela de Acompanhamento do RH nas telas de processos do Contratações (Início, Candidatos, Agenda, Vagas, Histórico, Painel).
//
//   npm run processos:importar               → grava (faz uma cópia de segurança antes)
//   npm run processos:importar -- --simular  → só mostra o que faria
//
// Entrada: contratacoes-exportacao-processos/processos.json (gerado por banco/processos-tratar.py; fica só no seu computador)
// Regras:
//   - cada linha da tabela vira um processo com id fixo: rodar de novo atualiza o mesmo processo, não duplica;
//   - processo que alguém já mexeu pelo site (etapa lançada, encerrado, editado) NÃO é sobrescrito;
//   - o que veio da planilha antes e saiu da lista é retirado do site (fica escondido, não apagado); o que foi cadastrado direto no site não é tocado.
import pg from "pg";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "contratacoes-exportacao-processos");
const ENTRADA = join(PASTA, "processos.json");
const SIMULAR = process.argv.includes("--simular");
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();

const url = process.env.DATABASE_URL;
if (!url || url.includes("COLE_AQUI")) { console.error("Falta a DATABASE_URL no arquivo .env."); process.exit(1); }
if (!existsSync(ENTRADA)) { console.error("Não achei " + ENTRADA); process.exit(1); }
const dadosNovos = JSON.parse(readFileSync(ENTRADA, "utf8"));

const db = new pg.Client({ connectionString: url });
try {
  await db.connect();
  const { rows: antes } = await db.query("select colecao, id, dados, removido, atualizado_por is not null as mexido from ct_docs where colecao in ('candidatos', 'vagas')");
  const doSite = antes.filter(r => !r.id.startsWith("imp")).length;
  console.log(`No site hoje: ${antes.filter(r => r.colecao === "candidatos" && !r.removido).length} processos e ${antes.filter(r => r.colecao === "vagas" && !r.removido).length} vagas (${doSite} cadastrados direto no site, que não serão tocados).`);
  if (!SIMULAR && antes.length) {
    mkdirSync(PASTA, { recursive: true });
    const arq = join(PASTA, `backup-processos-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);
    writeFileSync(arq, JSON.stringify(antes));
    console.log("Cópia de segurança salva em " + arq);
  }
  const ja = new Map(antes.map(r => [r.colecao + "/" + r.id, r]));
  const resumo = {};
  const lotes = { candidatos: [], vagas: [] };
  for (const [col, lista] of [["candidatos", dadosNovos.candidatos], ["vagas", dadosNovos.vagas]]) {
    const r = resumo[col] = { novos: 0, atualizados: 0, iguais: 0, protegidos: 0 };
    for (const x of lista) {
      const { id, ...dados } = x, a = ja.get(col + "/" + id);
      if (a && (a.mexido || a.removido)) { r.protegidos++; continue; }
      if (a) {
        const ord = v => Array.isArray(v) ? v.map(ord) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ord(v[k])])) : v;
        const semHist = o => JSON.stringify(ord({ ...o, hist: undefined }));
        if (semHist(a.dados) === semHist(dados)) { r.iguais++; continue; }
        r.atualizados++;
      } else r.novos++;
      lotes[col].push({ id, dados, sol: norm(dados.solicitante) || null });
    }
  }
  // o que veio da planilha numa importação anterior e não está mais na lista: sai do site (só se ninguém mexeu pelo site)
  const tirar = { candidatos: [], vagas: [] };
  for (const [col, lista] of [["candidatos", dadosNovos.candidatos], ["vagas", dadosNovos.vagas]]) {
    const ids = new Set(lista.map(x => x.id));
    for (const a of antes) if (a.colecao === col && a.id.startsWith("imp") && !a.removido && !ids.has(a.id)) { if (a.mexido) resumo[col].protegidos++; else tirar[col].push(a.id); }
    resumo[col].retirados = tirar[col].length;
  }
  const nome = { candidatos: "Processos (candidatos)", vagas: "Vagas" };
  for (const col of ["candidatos", "vagas"]) {
    const r = resumo[col];
    console.log(`${nome[col]}: ${r.novos} novos · ${r.atualizados} atualizados · ${r.iguais} iguais${r.retirados ? ` · ${r.retirados} retirados do site` : ""} · ${r.protegidos} já mexidos no site (mantidos como estão)`);
  }
  const c = dadosNovos.candidatos;
  const conta = s => c.filter(x => x.situacao === s).length;
  const nBanco = conta("banco");
  console.log(`Na tabela: ${conta("andamento")} em andamento · ${conta("concluido")} concluídos · ${conta("cancelado")} cancelados · ${conta("suspenso")} suspensos${nBanco ? ` · ${nBanco} guardados no Banco de talentos` : ""}.`);
  if (SIMULAR) console.log("(simulação: nada foi gravado)");
  else {
    await db.query("begin");
    for (const col of ["candidatos", "vagas"]) {
      for (let i = 0; i < lotes[col].length; i += 200) {
        const parte = lotes[col].slice(i, i + 200);
        await db.query(`insert into ct_docs (colecao, id, dados, solicitante_norm)
            select $1, x->>'id', x->'dados', x->>'sol' from jsonb_array_elements($2::jsonb) x
          on conflict (colecao, id) do update set dados = excluded.dados, solicitante_norm = excluded.solicitante_norm,
            atualizado_em = now(), versao = nextval('ct_versao_seq')
          where ct_docs.atualizado_por is null and not ct_docs.removido`, [col, JSON.stringify(parte)]);
      }
    }
    for (const col of ["candidatos", "vagas"]) if (tirar[col].length)
      await db.query(`update ct_docs set removido = true, atualizado_em = now(), versao = nextval('ct_versao_seq')
                      where colecao = $1 and id = any($2::text[]) and atualizado_por is null`, [col, tirar[col]]);
    await db.query("insert into ct_log (usuario_nome, colecao, doc_id, acao) values ('importação da Tabela de Acompanhamento', 'candidatos', 'lote', $1)",
      [`${resumo.candidatos.novos} novos, ${resumo.candidatos.atualizados} atualizados; vagas: ${resumo.vagas.novos} novas, ${resumo.vagas.atualizados} atualizadas`]);
    await db.query("commit");
    console.log("Gravado. Abra Contratações › Início e Candidatos.");
  }
} catch (e) {
  await db.query("rollback").catch(() => {});
  console.error("Erro (nada foi gravado):", e.message);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
