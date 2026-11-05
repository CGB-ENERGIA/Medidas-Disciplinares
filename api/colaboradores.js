// GET /api/colaboradores → colaboradores com a equipe
// Filtros opcionais: ?base=BCB  ?supervisor=LUIS%20FILIPE  ?coordenador=AFONSO  ?inativos=1
// A busca por nome/chapa continua no próprio site (lista pequena, busca sem acento já pronta lá).
// Quando o login entrar, o filtro por supervisor/coordenador passa a vir do usuário logado, não da URL.
import { consulta, ok, rota } from "./_lib/db.js";

export const GET = rota(async (_req, q) => {
  const onde = [], p = [];
  const add = (cond, valor) => { p.push(valor); onde.push(`${cond} $${p.length}`); };
  if (q.get("inativos") !== "1") onde.push("c.ativo");
  if (q.get("base")) add("c.base =", q.get("base"));
  if (q.get("supervisor")) add("e.supervisor =", q.get("supervisor"));
  if (q.get("coordenador")) add("e.coordenador =", q.get("coordenador"));

  const linhas = await consulta(`
    select c.chapa, c.nome, c.funcao, c.base, c.centro_custo, c.sexo, c.sexo_origem, c.ativo,
           e.setor, e.equipe, e.tipo_equipe, e.supervisor, e.coordenador
      from colaboradores c left join equipes e using (chapa)
     ${onde.length ? "where " + onde.join(" and ") : ""}
     order by c.nome`, p);
  return ok({ total: linhas.length, colaboradores: linhas });
});
