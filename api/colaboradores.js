// GET /api/colaboradores → colaboradores com a equipe (exige login; só o que o perfil pode ver)
// Filtros opcionais: ?base=BCB  ?supervisor=…  ?coordenador=…  ?inativos=1
// PATCH { chapa, sexo: "M"|"F" } → o DP confirma o sexo (Sr./Sra. no documento); vale para todos e sobrevive à importação
import { consulta, rota } from "./_lib/db.js";
import { comLogin, escopoEquipe, lerJSON, ok, erro } from "./_lib/auth.js";

export const GET = rota(comLogin(async (_req, q, u) => {
  const p = [], onde = [escopoEquipe(u, p)];
  const add = (cond, valor) => { p.push(valor); onde.push(`${cond} $${p.length}`); };
  if (q.get("inativos") !== "1") onde.push("c.ativo");
  if (q.get("base")) add("c.base =", q.get("base"));
  if (q.get("supervisor")) add("e.supervisor =", q.get("supervisor"));
  if (q.get("coordenador")) add("e.coordenador =", q.get("coordenador"));

  const linhas = await consulta(`
    select c.chapa, c.nome, c.funcao, c.base, c.centro_custo, c.sexo, c.sexo_origem, c.ativo,
           e.setor, e.equipe, e.tipo_equipe, e.supervisor, e.coordenador
      from colaboradores c left join equipes e using (chapa)
     where ${onde.join(" and ")}
     order by c.nome`, p);
  return ok({ total: linhas.length, colaboradores: linhas });
}));

export const PATCH = rota(comLogin(async request => {
  const c = await lerJSON(request);
  if (!c || !c.chapa || !/^[MF]$/.test(c.sexo || "")) return erro("Informe a chapa e o sexo (M ou F).", 400);
  const [r] = await consulta("update colaboradores set sexo = $2, sexo_origem = 'dp', atualizado_em = now() where chapa = $1 returning chapa", [String(c.chapa), c.sexo]);
  if (!r) return erro("Colaborador não encontrado.", 404);
  return ok({ salvo: true });
}, { perfis: ["dp"], nivel: ["gestor"] }));
