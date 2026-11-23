// Cálculo da análise de Horas Extras no servidor: o navegador recebe só os totais prontos, não as batidas.
//   POST /api/he-analise { acao: "resumo", de, ate, tol, chapas }  → totais por colaborador, por semana e por dia da semana
//   POST /api/he-analise { acao: "dias", chapa, de, ate, tol }     → o detalhe dia a dia de um colaborador
// "chapas" (opcional) é a lista de colaboradores que passaram nos filtros de filiação e na busca; sem ela vale a base toda.
// As regras da HE do dia ficam todas na consulta DIA_SQL abaixo (uma só fonte para o resumo e para o detalhe).
import { consulta, rota } from "./_lib/db.js";
import { comLogin, lerJSON, ok, erro } from "./_lib/auth.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const LIM_HE_DIA = 120;   // minutos: acima disso o dia conta em "dias com mais de 2 h de HE"

/* Regras da HE do dia (mesmas da planilha de controle, com as correções combinadas). Parâmetros: $1 de, $2 até, $3 tolerância (min), $4 chapas (ou null).
   1. 4 batidas usam EXTRA ENTRADA + ALMOÇO + SAIDA; 2 batidas usam EXTRA ENTRADA2 + SAIDA2; outras quantidades ficam fora (fora).
   2. Dia sem jornada prevista (HBASE 00:00): a HE do dia é o HTRAB, lançado na saída.
   3. Jornada prevista parcial (última posição do previsto 00:00, ex.: sábado só de manhã): entrada contra a primeira entrada prevista e saída contra a última saída prevista, com sinal.
   4. Jornada completa: as colunas da planilha são o lado positivo; entram com sinal contrário o atraso na entrada, o almoço mais longo que o previsto e a saída antes do previsto.
   5. Dentro da tolerância |HTRAB − HBASE| ≤ tol: jornada normal, o dia não conta HE (desc guarda o que foi descartado).
   5b. Dia com HBASE > 0 mas sem horário previsto (ENT1 a SAI2 zerados): a planilha traz nas colunas EXTRA o próprio horário da batida, então vale HTRAB − HBASE (sinal incluído).
   5c. Jornada do dia (alertas): soma dos turnos pelas batidas (2 batidas: saída − entrada, sem desconto de almoço).
   6. O total do dia é líquido: dia abaixo da base fica negativo (neg). */
const DIA_SQL = `
b as (
  select chapa, data, batidas, previsto, htrab, hbase, x_ent, x_alm, x_sai, x_ent2, x_sai2,
    jsonb_array_length(batidas) as n,
    (batidas->>0)::int as p0, (batidas->>1)::int as p1, (batidas->>2)::int as p2,
    (previsto->>0)::int as s0, (previsto->>1)::int as s1, (previsto->>2)::int as s2, (previsto->>3)::int as s3
  from he_batidas
  where ($1::date is null or data >= $1::date) and ($2::date is null or data <= $2::date) and ($4::text[] is null or chapa = any($4::text[]))
), c1 as (
  select b.*, (n in (2, 4)) as par,
    case when n in (2, 4) then (batidas->>(n - 1))::int end as pl,
    coalesce(nullif(s3, 0), nullif(s2, 0), nullif(s1, 0), nullif(s0, 0), 0) as ultima,
    case n when 4 then x_ent when 2 then x_ent2 else 0 end as e0,
    case n when 4 then x_alm else 0 end as a0,
    case n when 4 then x_sai when 2 then x_sai2 else 0 end as z0
  from b
), c2 as (
  select c1.*,
    (par and coalesce(hbase, -1) = 0 and coalesce(htrab, 0) > 0) as semj,
    (par and coalesce(hbase, 0) > 0 and coalesce(s0, 0) = 0) as semprev,
    (par and coalesce(hbase, 0) > 0 and s0 > 0 and s3 = 0 and ultima > s0) as parcial,
    (par and coalesce(hbase, 0) > 0 and s0 > 0 and s3 > 0) as completa
  from c1
), c3 as (
  select c2.*,
    case when semj or semprev then 0 when parcial then s0 - p0 when completa then e0 - greatest(p0 - s0, 0) else e0 end as se,
    case when semj or parcial or semprev then 0
         when completa then a0 - case when n = 4 and s1 > 0 and s2 > 0 then greatest((p2 - p1) - (s2 - s1), 0) else 0 end
         else a0 end as sa,
    case when semj then htrab when semprev then coalesce(htrab, hbase) - hbase when parcial then pl - ultima when completa then z0 - greatest(s3 - pl, 0) else z0 end as sz
  from c2
), c4 as (
  select c3.*, se + sa + sz as bruto,
    case when htrab is not null and hbase is not null then htrab - hbase end as net
  from c3
), c5 as (
  select c4.*, (net is not null and abs(net) <= $3::int) as ader from c4
), d as (
  select c5.chapa, c5.data, c5.batidas, c5.previsto, c5.htrab, c5.hbase, c5.n, c5.par, c5.semj, c5.net, c5.ader,
    c5.se, c5.sa, c5.sz, (n > 0 and not par) as fora,
    case when parcial then ultima end as parc,
    case when ader and bruto <> 0 then 0 else se end as ent,
    case when ader and bruto <> 0 then 0 else sa end as alm,
    case when ader and bruto <> 0 then 0 else sz end as sai,
    case when ader and bruto <> 0 then abs(bruto) else 0 end as descartada,
    jj.j, case when jj.j > 0 and n >= 4 then (case when p2 - p1 < 0 then p2 - p1 + 1440 else p2 - p1 end) end as alm_dur
  from c5
  left join lateral (
    select sum(case when q.v < 0 then q.v + 1440 else q.v end)::int as j
    from (select (batidas->>(i + 1))::int - (batidas->>i)::int as v from generate_series(0, n - 2, 2) i) q
    where c5.n >= 2 and c5.n % 2 = 0
  ) jj on true
), dd as (
  select d.*, ent + alm + sai as tot from d
)`;

const SQL_RESUMO = `
with ${DIA_SQL},
col as (
  select chapa, sum(ent)::int as ent, sum(alm)::int as alm, sum(sai)::int as sai, sum(tot)::int as tot,
    count(*) filter (where tot > 0)::int as dias_he, count(*) filter (where par)::int as dias_trab,
    count(*) filter (where tot > ${LIM_HE_DIA})::int as gt2, count(*) filter (where n % 2 = 1)::int as imp,
    coalesce(sum(j) filter (where j > 0), 0)::int as js, count(*) filter (where j > 0)::int as jn,
    coalesce(sum(alm_dur) filter (where j > 0 and n >= 4), 0)::int as as_, count(*) filter (where j > 0 and n >= 4)::int as an,
    coalesce(sum(net) filter (where net > $3::int), 0)::int as ger, coalesce(sum(-net) filter (where net < -$3::int), 0)::int as comp,
    sum(descartada)::int as desc_, coalesce(sum(tot) filter (where hbase = 0 and tot > 0), 0)::int as he_sem_j,
    count(*) filter (where hbase = 0 and tot > 0)::int as dias_sem_j
  from dd group by chapa
), wk as (
  select date_trunc('week', data)::date::text as w, sum(ent)::int as ent, sum(alm)::int as alm, sum(sai)::int as sai, sum(tot)::int as tot,
    count(distinct chapa) filter (where tot > 0)::int as pess
  from dd group by 1
), dw as (
  select extract(dow from data)::int as w, sum(ent)::int as ent, sum(alm)::int as alm, sum(sai)::int as sai, sum(tot)::int as tot,
    count(distinct chapa) filter (where tot > 0)::int as pess
  from dd group by 1
)
select (select coalesce(json_agg(col), '[]'::json) from col) as colabs,
       (select coalesce(json_agg(wk order by w), '[]'::json) from wk) as sem,
       (select coalesce(json_agg(dw order by w), '[]'::json) from dw) as dow`;

const SQL_DIAS = `
with ${DIA_SQL}
select data::text as data, batidas as p, previsto as s, htrab as ht, hbase as hb, net, ader, fora, semj as sem_j, parc,
  se as s_ent, sa as s_alm, sz as s_sai, tot, descartada as desc_, greatest(-tot, 0) as neg
from dd order by data`;

/* Quem compõe uma semana ($5 = segunda-feira) ou um dia da semana ($5 = 0 a 6): horas por colaborador e quantos dias. */
const SQL_QUANDO = `
with ${DIA_SQL}
select chapa, sum(ent)::int as ent, sum(alm)::int as alm, sum(sai)::int as sai, sum(tot)::int as tot, count(*) filter (where tot <> 0)::int as dias,
  string_agg(to_char(data, 'DD/MM') || ' ' || case when tot < 0 then '-' else '' end || lpad((abs(tot) / 60)::text, 2, '0') || ':' || lpad((abs(tot) % 60)::text, 2, '0'), ', ' order by data) filter (where tot <> 0) as datas
from dd
where case when $6::text = 'semana' then date_trunc('week', data)::date::text = $5::text else extract(dow from data)::int = $5::int end
group by chapa having sum(tot) <> 0 order by sum(tot) desc`;

/* Banco dinâmica (mesma estrutura da planilha de controle): por colaborador, horas realizadas (extras) e atrasos (faltas + atrasos) do período anterior e do atual,
   da posição do banco guardada em he_banco_din (data de referência = $5). Junto vai a HE líquida calculada pelas batidas do período (de 16 a 15, até a data
   de referência), para conferir o que o sistema mostra com o que o RM traz. */
const SQL_BANCO_DIN = `
with ${DIA_SQL},
sis as (select chapa, sum(tot) filter (where data <= $5::date)::int as he_ate, sum(tot) filter (where data > $5::date)::int as he_apos from dd group by chapa),
bk as (
  select chapa, nome, funcao, ant_real as ea, ant_atr as aa, atu_real as ee, atu_atr as ae from he_banco_din where referencia = $5::date
)
select bk.chapa, bk.nome, bk.funcao, bk.ea, bk.aa, bk.ee, bk.ae, sis.he_ate, sis.he_apos from bk left join sis on sis.chapa = bk.chapa order by bk.nome`;

// início do período (dia 16) em que a data de referência cai
const inicioPeriodo = ref => { const [a, m, d] = ref.split("-").map(Number); const x = d >= 16 ? new Date(Date.UTC(a, m - 1, 16)) : new Date(Date.UTC(a, m - 2, 16)); return x.toISOString().slice(0, 10); };

export const POST = rota(comLogin(async (request, _q, _u) => {
  const c = await lerJSON(request);
  if (!c) return erro("Envie os dados em JSON.", 400);
  const de = ISO.test(c.de || "") ? c.de : null, ate = ISO.test(c.ate || "") ? c.ate : null;
  const tol = Number.isInteger(c.tol) && c.tol >= 0 && c.tol <= 1440 ? c.tol : 10;

  if (c.acao === "dias") {
    const chapa = String(c.chapa ?? "").trim().slice(0, 20);
    if (!chapa) return erro("Informe a chapa.", 400);
    const l = await consulta(SQL_DIAS, [de, ate, tol, [chapa]]);
    return ok({ dias: l });
  }

  if (c.acao === "quando") {
    const tipo = c.tipo === "semana" ? "semana" : "dow", valor = String(c.valor ?? "");
    if (tipo === "semana" ? !ISO.test(valor) : !/^[0-6]$/.test(valor)) return erro("Valor inválido.", 400);
    let chapas = null;
    if (c.chapas != null) {
      if (!Array.isArray(c.chapas) || c.chapas.length > 5000) return erro("Lista de colaboradores inválida.", 400);
      chapas = c.chapas.map(x => String(x).trim().slice(0, 20)).filter(Boolean);
    }
    const l = await consulta(SQL_QUANDO, [de, ate, tol, chapas, valor, tipo]);
    return ok({ linhas: l });
  }

  if (c.acao === "banco") {
    if (!ISO.test(c.ref || "")) return erro("Informe a data de referência (AAAA-MM-DD).", 400);
    const ini = inicioPeriodo(c.ref);
    const l = await consulta(SQL_BANCO_DIN, [ini, null, tol, null, c.ref]);
    const [m] = await consulta("select max(data)::text as ate from he_batidas where data > $1::date", [c.ref]);
    return ok({ ref: c.ref, de: ini, ate: m.ate, linhas: l.map(x => [x.chapa, x.nome, x.funcao, x.ea, x.aa, x.ee, x.ae, x.he_ate, x.he_apos]) });
  }

  if (c.acao === "resumo") {
    let chapas = null;
    if (c.chapas != null) {
      if (!Array.isArray(c.chapas) || c.chapas.length > 5000) return erro("Lista de colaboradores inválida.", 400);
      chapas = c.chapas.map(x => String(x).trim().slice(0, 20)).filter(Boolean);
    }
    const [r] = await consulta(SQL_RESUMO, [de, ate, tol, chapas]);
    return ok({ colabs: r.colabs, sem: r.sem, dow: r.dow });
  }
  return erro("Ação inválida.", 400);
}, { modulo: "horas" }));
