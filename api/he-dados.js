// Leitura dos dados do módulo Horas Extras (quem tem acesso ao módulo, em qualquer nível).
//   GET /api/he-dados?tipo=resumo                       → o que o banco tem: linhas, colaboradores, período, últimas cargas
//   GET /api/he-dados?tipo=colabs                       → [[chapa, nome, função], ...]
//   GET /api/he-dados?tipo=cadastro                     → filiação de cada chapa
//   GET /api/he-dados?tipo=batidas&de=&ate=&apos=       → uma página de batidas; "proximo" leva à página seguinte (null = acabou)
//   GET /api/he-dados?tipo=ajustes                      → os últimos ajustes (antes/depois)
// Linhas de batidas vão em formato compacto: [chapa, data, batidas, previsto, htrab, hbase, xent, xalm, xsai, xent2, xsai2].
import { consulta, rota } from "./_lib/db.js";
import { comLogin, ok, erro } from "./_lib/auth.js";

const PAGINA = 6000;   // ~1 MB por página, bem abaixo do limite de 4,5 MB da Vercel
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const GET = rota(comLogin(async (_req, q) => {
  const tipo = q.get("tipo");

  if (tipo === "resumo") {
    const [r] = await consulta(`select count(*)::int as linhas, count(distinct chapa)::int as colaboradores, min(data)::text as de, max(data)::text as ate from he_batidas`);
    const cargas = await consulta(`select id::text as id, tipo, arquivo, usuario_nome, iniciada_em, concluida_em, linhas, novas, alteradas, iguais,
        periodo_ini::text as periodo_ini, periodo_fim::text as periodo_fim from he_cargas order by id desc limit 15`);
    const [c] = await consulta("select count(*)::int as chapas from he_cadastro");
    const bancos = await consulta("select periodo::text as periodo, count(*)::int as linhas, count(distinct chapa)::int as colaboradores from he_banco group by periodo order by periodo desc");
    const dins = await consulta("select referencia::text as periodo, count(*)::int as colaboradores from he_banco_din group by referencia order by referencia desc");
    return ok({ ...r, cadastro: c.chapas, cargas, bancos, dins });
  }

  // Alerta de banco de horas: saldo positivo do período x saldo positivo do período anterior (o que existir no banco antes dele), por colaborador
  if (tipo === "banco") {
    const per = q.get("periodo");
    if (!ISO.test(per || "")) return erro("Informe o período (AAAA-MM-DD).", 400);
    const [pa] = await consulta("select max(periodo)::text as p from he_banco where periodo < $1::date", [per]);
    const l = await consulta(`
      with a as (
        select chapa, max(nome) as nome, sum(greatest(saldo, 0))::int as m,
          (array_agg(funcao order by perc_rat desc nulls last))[1] as funcao,
          (array_agg(upper(btrim(ccusto)) order by perc_rat desc nulls last))[1] as ccusto,
          (array_agg(upper(btrim(secao)) order by perc_rat desc nulls last))[1] as secao
        from he_banco where periodo = $1::date group by chapa
      ), b as (
        select chapa, sum(greatest(saldo, 0))::int as m from he_banco where periodo = $2::date group by chapa
      )
      select a.chapa, a.nome, a.funcao, pp.valor as processo, pb.valor as base, a.m as atual, coalesce(b.m, 0) as anterior
      from a left join b on b.chapa = a.chapa
        left join he_premissas pp on pp.tipo = 'processo' and pp.chave = a.ccusto
        left join he_premissas pb on pb.tipo = 'base' and pb.chave = a.secao
      order by a.nome`, [per, pa.p]);
    const cfg = Object.fromEntries((await consulta("select chave, valor from he_config")).map(x => [x.chave, x.valor]));
    return ok({ periodo: per, anterior: pa.p, he_dia_horas: Number(cfg.he_dia_horas) || 2, dias_periodo: Number(cfg.dias_periodo) || 5.5,
      linhas: l.map(x => [x.chapa, x.nome, x.funcao, x.processo, x.base, x.atual, x.anterior]) });
  }

  if (tipo === "colabs") {
    const l = await consulta("select distinct on (chapa) chapa, nome, funcao from he_batidas order by chapa, data desc");
    return ok({ colabs: l.map(x => [x.chapa, x.nome, x.funcao]) });
  }

  if (tipo === "cadastro") {
    return ok({ cadastro: await consulta("select chapa, grupo, base, setor, coord, sup, eq, teq, tf, manual from he_cadastro") });
  }

  if (tipo === "batidas") {
    const de = ISO.test(q.get("de") || "") ? q.get("de") : null, ate = ISO.test(q.get("ate") || "") ? q.get("ate") : null;
    const [ch, dt] = (q.get("apos") || "|").split("|"); const apos = ISO.test(dt || "") ? [ch, dt] : ["", "0001-01-01"];
    const l = await consulta(`select chapa, data::text as data, batidas, previsto, htrab, hbase, x_ent, x_alm, x_sai, x_ent2, x_sai2
        from he_batidas where ($1::date is null or data >= $1::date) and ($2::date is null or data <= $2::date) and (chapa, data) > ($3, $4::date)
        order by chapa, data limit ${PAGINA}`, [de, ate, apos[0], apos[1]]);
    const ult = l[l.length - 1];
    return ok({ linhas: l.map(x => [x.chapa, x.data, x.batidas, x.previsto, x.htrab, x.hbase, x.x_ent, x.x_alm, x.x_sai, x.x_ent2, x.x_sai2]),
      proximo: l.length === PAGINA ? `${ult.chapa}|${ult.data}` : null });
  }

  if (tipo === "ajustes_banco") {
    const l = await consulta(`select a.carga_id::text as carga, a.periodo::text as periodo, a.chapa, (select max(nome) from he_banco b where b.chapa = a.chapa) as nome,
        a.campos, a.antes, a.depois, a.em from he_banco_ajustes a order by a.id desc limit 200`);
    return ok({ ajustes: l });
  }

  if (tipo === "ajustes") {
    const l = await consulta(`select a.carga_id::text as carga, a.chapa, (select nome from he_batidas b where b.chapa = a.chapa limit 1) as nome,
        a.data::text as data, a.campos, a.antes, a.depois, a.em from he_ajustes a order by a.id desc limit 200`);
    return ok({ ajustes: l });
  }

  return erro("Tipo inválido.", 400);
}, { modulo: "horas" }));
