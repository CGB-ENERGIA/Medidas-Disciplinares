// Carga da base do módulo Horas Extras (só quem tem nível "gestor" no módulo).
// A planilha é lida no navegador e enviada em lotes (a Vercel aceita até 4,5 MB por requisição).
//   POST /api/he-carga { acao: "iniciar", tipo: "batidas" | "cadastro", arquivo }      → { carga }
//   POST /api/he-carga { acao: "lote", carga, linhas: [...] }                          → { linhas, novas, alteradas, iguais, duplicadas }
//   POST /api/he-carga { acao: "concluir", carga }                                     → o resumo da carga
// Regras da carga de batidas (chave = chapa + data):
//   linha nova           → entra
//   linha diferente      → é atualizada e o antes/depois fica em he_ajustes (que não aceita alteração nem exclusão)
//   linha igual          → não muda nada
//   linha que não veio   → é mantida
// Cada lote roda num único comando SQL (tudo ou nada). Reenviar o mesmo lote é seguro: vira "iguais".
import { createHash } from "node:crypto";
import { consulta, rota } from "./_lib/db.js";
import { comLogin, lerJSON, ok, erro } from "./_lib/auth.js";

const MAX_LOTE = 1500;
const txt = (v, n) => String(v ?? "").trim().slice(0, n);
const inteiro = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Uma linha de batidas: minutos desde 00:00. Devolve null se a linha não serve.
function normalizarBatida(r) {
  if (!r || typeof r !== "object") return null;
  const chapa = txt(r.chapa, 20), data = typeof r.data === "string" && ISO.test(r.data) ? r.data : null;
  if (!chapa || !data) return null;
  if (!Array.isArray(r.p) || r.p.length > 10) return null;
  const p = r.p.map(v => inteiro(v, 0, 1439)); if (p.includes(null)) return null;
  const s = Array.isArray(r.s) && r.s.length === 4 ? r.s.map(v => inteiro(v, 0, 1439) ?? 0) : [0, 0, 0, 0];
  const x = r.x && typeof r.x === "object" ? r.x : {};
  const n = v => inteiro(v, 0, 5999) ?? 0;
  const o = { chapa, data, nome: txt(r.nome, 120), funcao: txt(r.funcao, 80), p, s,
    ht: r.ht == null ? null : inteiro(r.ht, 0, 5999), hb: r.hb == null ? null : inteiro(r.hb, 0, 5999),
    xe: n(x.ent), xa: n(x.alm), xs: n(x.sai), xe2: n(x.ent2), xs2: n(x.sai2) };
  // O hash cobre só o que conta como "ajuste" (nome e função não)
  o.hash = createHash("sha1").update(JSON.stringify([o.p, o.s, o.ht, o.hb, o.xe, o.xa, o.xs, o.xe2, o.xs2])).digest("hex");
  return o;
}

import { padronizarBase } from "./_lib/bases.js";
function normalizarCadastro(r) {
  if (!r || typeof r !== "object") return null;
  const chapa = txt(r.chapa, 20); if (!chapa) return null;
  return { chapa, grupo: txt(r.grupo, 40), base: txt(padronizarBase(r.base), 80), setor: txt(r.setor, 80), coord: txt(r.coord, 120),
    sup: txt(r.sup, 120), eq: txt(r.eq, 120), teq: txt(r.teq, 80), tf: txt(r.tf, 40) };
}

// Banco de horas: tempos em minutos; o saldo pode ser negativo
const mins = v => (Number.isInteger(v) && v >= -999999 && v <= 999999 ? v : 0);
function normalizarBanco(r) {
  if (!r || typeof r !== "object") return null;
  const chapa = txt(r.chapa, 20); if (!chapa) return null;
  const o = { chapa, codccusto: txt(r.codccusto, 30), ccusto: txt(r.ccusto, 120), nome: txt(r.nome, 120), secao: txt(r.secao, 120), funcao: txt(r.funcao, 80),
    perc: Number.isFinite(r.perc) ? Math.max(0, Math.min(100, Math.round(r.perc * 100) / 100)) : null,
    ea: mins(r.ea), fa: mins(r.fa), aa: mins(r.aa), sa: mins(r.sa), ee: mins(r.ee), fe: mins(r.fe), ae: mins(r.ae), s: mins(r.s) };
  o.hash = createHash("sha1").update(JSON.stringify([o.ccusto, o.secao, o.perc, o.ea, o.fa, o.aa, o.sa, o.ee, o.fe, o.ae, o.s])).digest("hex");
  return o;
}
// Banco dinâmica: uma linha por colaborador (anterior e atual: realizadas, atrasos, saldo; positivas e negativas), em minutos
function normalizarDin(r) {
  if (!r || typeof r !== "object") return null;
  const chapa = txt(r.chapa, 20); if (!chapa) return null;
  const m = v => (Number.isInteger(v) && v >= 0 && v <= 999999 ? v : 0);
  const o = { chapa, nome: txt(r.nome, 120), funcao: txt(r.funcao, 80), ar: m(r.ar), aa: m(r.aa), as: m(r.as), tr: m(r.tr), ta: m(r.ta), ts: m(r.ts), pos: m(r.pos), neg: m(r.neg) };
  // Saldo, positivas e negativas seguem as fórmulas da planilha a partir de realizadas e atrasos. O valor que veio na planilha é mantido
  // (ela arredonda em horas decimais, então pode diferir em 1 minuto), mas se estiver fora das fórmulas por mais que isso é erro de preenchimento e vale a fórmula.
  const fx = (v, f) => (Math.abs(v - f) > 1 ? f : v);
  o.as = fx(o.as, Math.max(o.ar - o.aa, 0)); o.ts = fx(o.ts, Math.max(o.tr - o.ta, 0));
  o.pos = fx(o.pos, Math.max(o.ar - o.aa + o.tr - o.ta, 0)); o.neg = fx(o.neg, Math.max(o.aa + o.ta - o.ar - o.tr, 0));
  o.hash = createHash("sha1").update(JSON.stringify([o.ar, o.aa, o.as, o.tr, o.ta, o.ts, o.pos, o.neg])).digest("hex");
  return o;
}

const SQL_DIN = `
with novos as (
  select * from jsonb_to_recordset($1::jsonb) as r(chapa text, nome text, funcao text, ar int, aa int, "as" int, tr int, ta int, ts int, pos int, neg int, hash text)
), antigos as (
  select b.* from he_banco_din b join novos n on n.chapa = b.chapa and b.referencia = $3::date where b.hash <> n.hash
), aj as (
  insert into he_banco_ajustes (carga_id, periodo, chapa, codccusto, antes, depois, campos)
  select $2::bigint, $3::date, a.chapa, 'DIN',
    jsonb_build_object('ea', a.ant_real, 'aa', a.ant_atr, 'sa', a.ant_saldo, 'ee', a.atu_real, 'ae', a.atu_atr, 's', a.atu_saldo, 'pos', a.positivas, 'neg', a.negativas),
    jsonb_build_object('ea', n.ar, 'aa', n.aa, 'sa', n."as", 'ee', n.tr, 'ae', n.ta, 's', n.ts, 'pos', n.pos, 'neg', n.neg),
    array_remove(array[
      case when a.ant_real  is distinct from n.ar  then 'ANT_REALIZADAS' end,
      case when a.ant_atr   is distinct from n.aa  then 'ANT_ATRASOS' end,
      case when a.ant_saldo is distinct from n."as" then 'ANT_SALDO' end,
      case when a.atu_real  is distinct from n.tr  then 'ATUAL_REALIZADAS' end,
      case when a.atu_atr   is distinct from n.ta  then 'ATUAL_ATRASOS' end,
      case when a.atu_saldo is distinct from n.ts  then 'ATUAL_SALDO' end,
      case when a.positivas is distinct from n.pos then 'POSITIVAS' end,
      case when a.negativas is distinct from n.neg then 'NEGATIVAS' end
    ], null)
  from antigos a join novos n on n.chapa = a.chapa
  returning 1
), up as (
  insert into he_banco_din (referencia, chapa, nome, funcao, ant_real, ant_atr, ant_saldo, atu_real, atu_atr, atu_saldo, positivas, negativas, hash, carga_id)
  select $3::date, chapa, nome, funcao, ar, aa, "as", tr, ta, ts, pos, neg, hash, $2::bigint from novos
  on conflict (referencia, chapa) do update set nome = excluded.nome, funcao = excluded.funcao, ant_real = excluded.ant_real, ant_atr = excluded.ant_atr,
    ant_saldo = excluded.ant_saldo, atu_real = excluded.atu_real, atu_atr = excluded.atu_atr, atu_saldo = excluded.atu_saldo, positivas = excluded.positivas,
    negativas = excluded.negativas, hash = excluded.hash, carga_id = excluded.carga_id, atualizado_em = now()
  where he_banco_din.hash <> excluded.hash
  returning (xmax = 0) as inserido
)
select count(*) filter (where inserido)::int as novas, count(*) filter (where not inserido)::int as alteradas from up`;

// Premissas: tipo "processo" (chave = centro de custo) ou "base" (chave = seção)
function normalizarPremissa(r) {
  if (!r || typeof r !== "object" || !["processo", "base"].includes(r.tipo)) return null;
  const chave = txt(r.chave, 160).toUpperCase(), valor = txt(r.valor, 120);
  return chave && valor ? { tipo: r.tipo, chave, valor } : null;
}

const SQL_BANCO = `
with novos as (
  select * from jsonb_to_recordset($1::jsonb) as r(chapa text, codccusto text, ccusto text, nome text, secao text, funcao text, perc numeric,
    ea int, fa int, aa int, sa int, ee int, fe int, ae int, s int, hash text)
), antigos as (
  select b.* from he_banco b join novos n on n.chapa = b.chapa and n.codccusto = b.codccusto and b.periodo = $3::date where b.hash <> n.hash
), aj as (
  insert into he_banco_ajustes (carga_id, periodo, chapa, codccusto, antes, depois, campos)
  select $2::bigint, $3::date, a.chapa, a.codccusto,
    jsonb_build_object('ccusto', a.ccusto, 'secao', a.secao, 'perc', a.perc_rat, 'ea', a.extra_ant, 'fa', a.falta_ant, 'aa', a.atraso_ant, 'sa', a.saldo_ant, 'ee', a.extra_atu, 'fe', a.falta_atu, 'ae', a.atraso_atu, 's', a.saldo),
    jsonb_build_object('ccusto', n.ccusto, 'secao', n.secao, 'perc', n.perc, 'ea', n.ea, 'fa', n.fa, 'aa', n.aa, 'sa', n.sa, 'ee', n.ee, 'fe', n.fe, 'ae', n.ae, 's', n.s),
    array_remove(array[
      case when a.ccusto     is distinct from n.ccusto then 'CCUSTO' end,
      case when a.secao      is distinct from n.secao  then 'SECAO' end,
      case when a.perc_rat   is distinct from n.perc   then 'PERC_RAT' end,
      case when a.extra_ant  is distinct from n.ea then 'EXTRA_ANT' end,
      case when a.falta_ant  is distinct from n.fa then 'FALTA_ANT' end,
      case when a.atraso_ant is distinct from n.aa then 'ATRASO_ANT' end,
      case when a.saldo_ant  is distinct from n.sa then 'SALDOANT' end,
      case when a.extra_atu  is distinct from n.ee then 'EXTRA_ATU' end,
      case when a.falta_atu  is distinct from n.fe then 'FALTA_ATU' end,
      case when a.atraso_atu is distinct from n.ae then 'ATRASO_ATU' end,
      case when a.saldo      is distinct from n.s  then 'SALDO' end
    ], null)
  from antigos a join novos n on n.chapa = a.chapa and n.codccusto = a.codccusto
  returning 1
), up as (
  insert into he_banco (periodo, chapa, codccusto, ccusto, nome, secao, funcao, perc_rat, extra_ant, falta_ant, atraso_ant, saldo_ant,
      extra_atu, falta_atu, atraso_atu, saldo, hash, carga_id)
  select $3::date, chapa, codccusto, ccusto, nome, secao, funcao, perc, ea, fa, aa, sa, ee, fe, ae, s, hash, $2::bigint from novos
  on conflict (periodo, chapa, codccusto) do update set ccusto = excluded.ccusto, nome = excluded.nome, secao = excluded.secao, funcao = excluded.funcao,
    perc_rat = excluded.perc_rat, extra_ant = excluded.extra_ant, falta_ant = excluded.falta_ant, atraso_ant = excluded.atraso_ant, saldo_ant = excluded.saldo_ant,
    extra_atu = excluded.extra_atu, falta_atu = excluded.falta_atu, atraso_atu = excluded.atraso_atu, saldo = excluded.saldo,
    hash = excluded.hash, carga_id = excluded.carga_id, atualizado_em = now()
  where he_banco.hash <> excluded.hash
  returning (xmax = 0) as inserido
)
select count(*) filter (where inserido)::int as novas, count(*) filter (where not inserido)::int as alteradas from up`;

const SQL_PREMISSAS = `
with novos as (select * from jsonb_to_recordset($1::jsonb) as r(tipo text, chave text, valor text)),
up as (
  insert into he_premissas (tipo, chave, valor, carga_id) select tipo, chave, valor, $2::bigint from novos
  on conflict (tipo, chave) do update set valor = excluded.valor, carga_id = excluded.carga_id, atualizado_em = now()
  where he_premissas.valor <> excluded.valor
  returning (xmax = 0) as inserido
)
select count(*) filter (where inserido)::int as novas, count(*) filter (where not inserido)::int as alteradas from up`;

const SQL_BATIDAS = `
with novos as (
  select * from jsonb_to_recordset($1::jsonb) as r(chapa text, data date, nome text, funcao text, p jsonb, s jsonb,
    ht int, hb int, xe int, xa int, xs int, xe2 int, xs2 int, hash text)
), antigos as (
  select b.* from he_batidas b join novos n on n.chapa = b.chapa and n.data = b.data where b.hash <> n.hash
), aj as (
  insert into he_ajustes (carga_id, chapa, data, antes, depois, campos)
  select $2::bigint, a.chapa, a.data,
    jsonb_build_object('p', a.batidas, 's', a.previsto, 'ht', a.htrab, 'hb', a.hbase, 'xe', a.x_ent, 'xa', a.x_alm, 'xs', a.x_sai, 'xe2', a.x_ent2, 'xs2', a.x_sai2),
    jsonb_build_object('p', n.p, 's', n.s, 'ht', n.ht, 'hb', n.hb, 'xe', n.xe, 'xa', n.xa, 'xs', n.xs, 'xe2', n.xe2, 'xs2', n.xs2),
    array_remove(array[
      case when a.batidas  is distinct from n.p   then 'batidas' end,
      case when a.previsto is distinct from n.s   then 'previsto' end,
      case when a.htrab    is distinct from n.ht  then 'HTRAB' end,
      case when a.hbase    is distinct from n.hb  then 'HBASE' end,
      case when a.x_ent    is distinct from n.xe  then 'EXTRA ENTRADA' end,
      case when a.x_alm    is distinct from n.xa  then 'EXTRA ALMOÇO' end,
      case when a.x_sai    is distinct from n.xs  then 'EXTRA SAIDA' end,
      case when a.x_ent2   is distinct from n.xe2 then 'EXTRA ENTRADA2' end,
      case when a.x_sai2   is distinct from n.xs2 then 'EXTRA SAIDA2' end
    ], null)
  from antigos a join novos n on n.chapa = a.chapa and n.data = a.data
  returning 1
), up as (
  insert into he_batidas (chapa, data, nome, funcao, batidas, previsto, htrab, hbase, x_ent, x_alm, x_sai, x_ent2, x_sai2, hash, carga_id)
  select chapa, data, nome, funcao, p, s, ht, hb, xe, xa, xs, xe2, xs2, hash, $2::bigint from novos
  on conflict (chapa, data) do update set nome = excluded.nome, funcao = excluded.funcao, batidas = excluded.batidas, previsto = excluded.previsto,
    htrab = excluded.htrab, hbase = excluded.hbase, x_ent = excluded.x_ent, x_alm = excluded.x_alm, x_sai = excluded.x_sai,
    x_ent2 = excluded.x_ent2, x_sai2 = excluded.x_sai2, hash = excluded.hash, carga_id = excluded.carga_id, atualizado_em = now()
  where he_batidas.hash <> excluded.hash
  returning (xmax = 0) as inserido
)
select count(*) filter (where inserido)::int as novas, count(*) filter (where not inserido)::int as alteradas from up`;

const SQL_CADASTRO = `
with novos as (
  select * from jsonb_to_recordset($1::jsonb) as r(chapa text, grupo text, base text, setor text, coord text, sup text, eq text, teq text, tf text)
), up as (
  insert into he_cadastro (chapa, grupo, base, setor, coord, sup, eq, teq, tf, carga_id)
  select chapa, grupo, base, setor, coord, sup, eq, teq, tf, $2::bigint from novos
  on conflict (chapa) do update set grupo = excluded.grupo, base = excluded.base, setor = excluded.setor, coord = excluded.coord,
    sup = excluded.sup, eq = excluded.eq, teq = excluded.teq, tf = excluded.tf, carga_id = excluded.carga_id, atualizado_em = now()
  where he_cadastro.manual is not true and (he_cadastro.grupo, he_cadastro.base, he_cadastro.setor, he_cadastro.coord, he_cadastro.sup, he_cadastro.eq, he_cadastro.teq, he_cadastro.tf)
    is distinct from (excluded.grupo, excluded.base, excluded.setor, excluded.coord, excluded.sup, excluded.eq, excluded.teq, excluded.tf)
  returning (xmax = 0) as inserido
)
select count(*) filter (where inserido)::int as novas, count(*) filter (where not inserido)::int as alteradas from up`;

// ---------------------------------------------------------------------------------------------------------------------
// Prévia (mesmo padrão do Gerenciador de Equipes: analisar → erros por linha → aplicar). Não grava nada: compara as linhas do lote
// com o que já está no banco e devolve o que seria criado, o que mudaria (de → para) e as linhas com erro.
// ---------------------------------------------------------------------------------------------------------------------
const hm = m => (m == null ? "—" : `${m < 0 ? "−" : ""}${String(Math.floor(Math.abs(m) / 60)).padStart(2, "0")}:${String(Math.abs(m) % 60).padStart(2, "0")}`);
const lista = a => (Array.isArray(a) && a.length ? a.map(hm).join(" · ") : "—");
const txtv = v => (v == null || v === "" ? "—" : String(v));
const num = v => (v == null ? null : Number(v));
const IGUAL = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Por que uma linha não serve (o texto vai para a tela, com o número da linha da planilha)
function motivoInvalida(tipo, r) {
  if (!r || typeof r !== "object") return "linha vazia";
  if (tipo === "premissas") return !txt(r.chave, 160) || !txt(r.valor, 120) ? "centro de custo/seção ou valor em branco" : "tipo de premissa inválido";
  if (!txt(r.chapa, 20)) return "chapa em branco";
  if (tipo === "batidas") {
    if (!(typeof r.data === "string" && ISO.test(r.data) && !Number.isNaN(Date.parse(r.data)))) return "data da batida inválida";
    if (!Array.isArray(r.p) || r.p.length > 10) return "mais de 10 batidas no dia";
    if (r.p.some(v => inteiro(v, 0, 1439) === null)) return "horário de batida fora de 00:00 a 23:59";
  }
  return "linha inválida";
}

const CAMPOS = {
  batidas: [["p", "batidas", lista], ["s", "previsto", lista], ["ht", "HTRAB", hm], ["hb", "HBASE", hm], ["xe", "EXTRA ENTRADA", hm], ["xa", "EXTRA ALMOÇO", hm], ["xs", "EXTRA SAIDA", hm], ["xe2", "EXTRA ENTRADA2", hm], ["xs2", "EXTRA SAIDA2", hm]],
  banco: [["ccusto", "CCUSTO", txtv], ["secao", "SECAO", txtv], ["perc", "PERC_RAT", txtv], ["ea", "EXTRA_ANT", hm], ["fa", "FALTA_ANT", hm], ["aa", "ATRASO_ANT", hm], ["sa", "SALDOANT", hm], ["ee", "EXTRA_ATU", hm], ["fe", "FALTA_ATU", hm], ["ae", "ATRASO_ATU", hm], ["s", "SALDO", hm]],
  bancodin: [["ar", "Ant. realizadas", hm], ["aa", "Ant. atrasos", hm], ["as", "Ant. saldo", hm], ["tr", "Atual realizadas", hm], ["ta", "Atual atrasos", hm], ["ts", "Atual saldo", hm], ["pos", "Positivas", hm], ["neg", "Negativas", hm]],
  cadastro: [["grupo", "Grupo", txtv], ["base", "Base", txtv], ["setor", "Setor", txtv], ["coord", "Coordenador", txtv], ["sup", "Supervisor / responsável", txtv], ["eq", "Equipe", txtv], ["teq", "Tipo de equipe", txtv], ["tf", "Direto / Indireto", txtv]],
  premissas: [["valor", "Valor", txtv]],
};
const NORM = { batidas: normalizarBatida, cadastro: normalizarCadastro, banco: normalizarBanco, premissas: normalizarPremissa, bancodin: normalizarDin };
const CHAVE = { batidas: o => `${o.chapa}|${o.data}`, cadastro: o => o.chapa, banco: o => `${o.chapa}|${o.codccusto}`, premissas: o => `${o.tipo}|${o.chave}`, bancodin: o => o.chapa };
const MOSTRA = { batidas: o => ({ chapa: o.chapa, nome: o.nome, data: o.data }), cadastro: o => ({ chapa: o.chapa, nome: "" }), banco: o => ({ chapa: o.chapa, nome: o.nome, data: o.ccusto }),
  premissas: o => ({ chapa: o.chave, nome: o.tipo }), bancodin: o => ({ chapa: o.chapa, nome: o.nome }) };

// o que já existe no banco para as chaves deste lote
async function existentes(tipo, linhas, per) {
  const ch = linhas.map(o => o.chapa);
  if (tipo === "batidas") return consulta(`select chapa, data::text as data, batidas as p, previsto as s, htrab as ht, hbase as hb, x_ent as xe, x_alm as xa, x_sai as xs, x_ent2 as xe2, x_sai2 as xs2
      from he_batidas where (chapa, data) in (select * from unnest($1::text[], $2::date[]))`, [ch, linhas.map(o => o.data)]);
  if (tipo === "banco") return consulta(`select chapa, codccusto, ccusto, secao, perc_rat as perc, extra_ant as ea, falta_ant as fa, atraso_ant as aa, saldo_ant as sa, extra_atu as ee, falta_atu as fe, atraso_atu as ae, saldo as s
      from he_banco where periodo = $3::date and (chapa, codccusto) in (select * from unnest($1::text[], $2::text[]))`, [ch, linhas.map(o => o.codccusto), per]);
  if (tipo === "bancodin") return consulta(`select chapa, ant_real as ar, ant_atr as aa, ant_saldo as "as", atu_real as tr, atu_atr as ta, atu_saldo as ts, positivas as pos, negativas as neg
      from he_banco_din where referencia = $2::date and chapa = any($1::text[])`, [ch, per]);
  if (tipo === "cadastro") return consulta("select chapa, grupo, base, setor, coord, sup, eq, teq, tf, manual from he_cadastro where chapa = any($1::text[])", [ch]);
  return consulta("select tipo, chave, valor from he_premissas where (tipo, chave) in (select * from unnest($1::text[], $2::text[]))", [linhas.map(o => o.tipo), linhas.map(o => o.chave)]);
}

async function previa(c) {
  const tipo = c.tipo; if (!NORM[tipo]) return erro("Tipo de carga inválido.", 400);
  if (!Array.isArray(c.linhas) || !c.linhas.length) return erro("Lote vazio.", 400);
  if (c.linhas.length > MAX_LOTE) return erro(`O lote aceita até ${MAX_LOTE} linhas.`, 400);
  const comData = tipo === "banco" || tipo === "bancodin", per = comData && ISO.test(c.periodo || "") ? c.periodo : null;
  if (comData && !per) return erro("Informe a data de referência do banco de horas.", 400);
  const unicas = new Map(), erros = []; let duplicadas = 0;
  for (const l of c.linhas) {
    const o = NORM[tipo](l);
    if (!o) { erros.push({ linha: Number.isInteger(l?.n) ? l.n : null, chapa: txt(l?.chapa ?? l?.chave, 40), nome: txt(l?.nome, 60), erro: motivoInvalida(tipo, l) }); continue; }
    const k = CHAVE[tipo](o); if (unicas.has(k)) duplicadas++; unicas.set(k, o);
  }
  const linhas = [...unicas.values()];
  const r = { linhas: linhas.length, novas: 0, alteradas: 0, iguais: 0, protegidas: 0, duplicadas, erros: erros.slice(0, 200), totalErros: erros.length, criados: [], atualizados: [] };
  if (!linhas.length) return ok(r);
  const ex = new Map((await existentes(tipo, linhas, per)).map(x => [CHAVE[tipo](x), x]));
  for (const o of linhas) {
    const x = ex.get(CHAVE[tipo](o));
    if (!x) { r.novas++; if (r.criados.length < 100) r.criados.push(MOSTRA[tipo](o)); continue; }
    if (tipo === "cadastro" && x.manual) { r.protegidas++; continue; }   // vínculo editado à mão: a carga não o sobrescreve
    const mud = CAMPOS[tipo].filter(([k]) => !IGUAL(k === "perc" ? num(o[k]) : o[k], k === "perc" ? num(x[k]) : x[k]))
      .map(([k, rot, f]) => ({ campo: rot, de: f(x[k]), para: f(o[k]) }));
    if (!mud.length) { r.iguais++; continue; }
    r.alteradas++; if (r.atualizados.length < 300) r.atualizados.push({ ...MOSTRA[tipo](o), mudancas: mud });
  }
  return ok(r);
}

const idCarga = v => (/^\d{1,18}$/.test(String(v ?? "")) ? String(v) : null);

export const POST = rota(comLogin(async (request, _q, u) => {
  const c = await lerJSON(request);
  if (!c) return erro("Envie os dados em JSON.", 400);

  if (c.acao === "previa") return previa(c);

  if (c.acao === "iniciar") {
    if (!["batidas", "cadastro", "banco", "premissas", "bancodin"].includes(c.tipo)) return erro("Tipo de carga inválido.", 400);
    // o banco de horas é de um período: a data de fechamento é obrigatória
    const comData = c.tipo === "banco" || c.tipo === "bancodin";
    const per = comData ? (ISO.test(c.periodo || "") && !Number.isNaN(Date.parse(c.periodo)) ? c.periodo : null) : null;
    if (comData && !per) return erro("Informe a data de fechamento do período do banco de horas.", 400);
    // A data é a de referência da posição do banco (o período vai de 16 a 15; pode ser uma atualização no meio do período, ex.: 01/11).
    // Cada data guarda uma posição; reenviar a mesma data atualiza onde mudou.
    const [r] = await consulta("insert into he_cargas (tipo, arquivo, usuario_id, usuario_nome, periodo_ini, periodo_fim) values ($1, $2, $3, $4, $5, $5) returning id::text as id",
      [c.tipo, txt(c.arquivo, 200), u.id, u.nome, per]);
    return ok({ carga: r.id });
  }

  const id = idCarga(c.carga); if (!id) return erro("Carga inválida.", 400);
  const [carga] = await consulta("select id::text as id, tipo, usuario_id::text as usuario_id, concluida_em, periodo_fim::text as periodo_fim from he_cargas where id = $1", [id]);
  if (!carga || carga.usuario_id !== String(u.id)) return erro("Carga não encontrada.", 404);
  if (carga.concluida_em) return erro("Esta carga já foi concluída. Inicie outra.", 409);

  if (c.acao === "lote") {
    if (!Array.isArray(c.linhas) || !c.linhas.length) return erro("Lote vazio.", 400);
    if (c.linhas.length > MAX_LOTE) return erro(`O lote aceita até ${MAX_LOTE} linhas.`, 400);
    const norm = { batidas: normalizarBatida, cadastro: normalizarCadastro, banco: normalizarBanco, premissas: normalizarPremissa, bancodin: normalizarDin }[carga.tipo];
    const chave = o => ({ batidas: `${o.chapa}|${o.data}`, cadastro: o.chapa, banco: `${o.chapa}|${o.codccusto}`, bancodin: o.chapa, premissas: `${o.tipo}|${o.chave}` })[carga.tipo];
    const unicas = new Map(); let invalidas = 0; const errosLinha = [];
    for (const l of c.linhas) {
      const o = norm(l); if (!o) { invalidas++; if (errosLinha.length < 50) errosLinha.push({ linha: Number.isInteger(l?.n) ? l.n : null, chapa: txt(l?.chapa ?? l?.chave, 40), erro: motivoInvalida(carga.tipo, l) }); continue; }
      unicas.set(chave(o), o);   // a última repetição vence
    }
    const linhas = [...unicas.values()], duplicadas = c.linhas.length - invalidas - linhas.length;
    if (!linhas.length) return erro("Nenhuma linha válida neste lote.", 400);
    const sql = { batidas: SQL_BATIDAS, cadastro: SQL_CADASTRO, banco: SQL_BANCO, premissas: SQL_PREMISSAS, bancodin: SQL_DIN }[carga.tipo];
    const args = carga.tipo === "banco" || carga.tipo === "bancodin" ? [JSON.stringify(linhas), id, carga.periodo_fim] : [JSON.stringify(linhas), id];
    const [r] = await consulta(sql, args);
    const iguais = linhas.length - r.novas - r.alteradas;
    const datas = carga.tipo === "batidas" ? linhas.map(l => l.data).sort() : [];
    await consulta(`update he_cargas set linhas = linhas + $2, novas = novas + $3, alteradas = alteradas + $4, iguais = iguais + $5,
        periodo_ini = case when $6::date is null then periodo_ini else least(coalesce(periodo_ini, $6::date), $6::date) end,
        periodo_fim = case when $7::date is null then periodo_fim else greatest(coalesce(periodo_fim, $7::date), $7::date) end
      where id = $1`, [id, linhas.length, r.novas, r.alteradas, iguais, datas[0] || null, datas[datas.length - 1] || null]);
    return ok({ linhas: linhas.length, novas: r.novas, alteradas: r.alteradas, iguais, duplicadas, invalidas, erros: errosLinha });
  }

  if (c.acao === "concluir") {
    const [r] = await consulta(`update he_cargas set concluida_em = now() where id = $1
      returning id::text as id, tipo, arquivo, linhas, novas, alteradas, iguais, periodo_ini::text as periodo_ini, periodo_fim::text as periodo_fim`, [id]);
    return ok(r);
  }
  return erro("Ação inválida.", 400);
}, { modulo: "horas", nivel: ["gestor"] }));
