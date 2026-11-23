// Edição dos vínculos de um colaborador (só nível "gestor" do módulo Horas Extras).
//   POST /api/he-cadastro { chapa, grupo, base, setor, coord, sup, eq, teq, tf }  → { ok, campos }
// O vínculo editado fica protegido: a carga do base-resumo não o sobrescreve. Cada edição é registrada (antes/depois) em he_cadastro_log,
// que não aceita alteração nem exclusão.
import { consulta, rota } from "./_lib/db.js";
import { padronizarBase } from "./_lib/bases.js";
import { comLogin, lerJSON, ok, erro } from "./_lib/auth.js";

const CAMPOS = ["grupo", "base", "setor", "coord", "sup", "eq", "teq", "tf"];
const txt = (v, n) => String(v ?? "").trim().slice(0, n);

export const POST = rota(comLogin(async (request, _q, u) => {
  const c = await lerJSON(request);
  if (!c) return erro("Envie os dados em JSON.", 400);
  const chapa = txt(c.chapa, 20);
  if (!chapa) return erro("Informe a chapa.", 400);
  const [existe] = await consulta("select (select count(*) from he_batidas where chapa = $1) + (select count(*) from he_cadastro where chapa = $1) as n", [chapa]);
  if (!Number(existe.n)) return erro("Chapa não encontrada no banco.", 404);

  const novo = {}; for (const k of CAMPOS) novo[k] = txt(k === "base" ? padronizarBase(c[k]) : c[k], k === "grupo" || k === "teq" || k === "tf" ? 80 : 120);
  const [antigo] = await consulta("select grupo, base, setor, coord, sup, eq, teq, tf from he_cadastro where chapa = $1", [chapa]);
  const antes = antigo || Object.fromEntries(CAMPOS.map(k => [k, null]));
  const mudou = CAMPOS.filter(k => (antes[k] ?? "") !== novo[k]);
  if (!mudou.length) return ok({ ok: true, campos: [] });

  await consulta(`insert into he_cadastro (chapa, grupo, base, setor, coord, sup, eq, teq, tf, manual, editado_em, editado_por)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, now(), $10)
      on conflict (chapa) do update set grupo = excluded.grupo, base = excluded.base, setor = excluded.setor, coord = excluded.coord, sup = excluded.sup,
        eq = excluded.eq, teq = excluded.teq, tf = excluded.tf, manual = true, editado_em = now(), editado_por = $10, atualizado_em = now()`,
    [chapa, novo.grupo, novo.base, novo.setor, novo.coord, novo.sup, novo.eq, novo.teq, novo.tf, u.nome]);
  await consulta("insert into he_cadastro_log (chapa, usuario, campos, antes, depois) values ($1, $2, $3, $4::jsonb, $5::jsonb)",
    [chapa, u.nome, mudou, JSON.stringify(antes), JSON.stringify(novo)]);
  return ok({ ok: true, campos: mudou });
}, { modulo: "horas", nivel: ["gestor"] }));
