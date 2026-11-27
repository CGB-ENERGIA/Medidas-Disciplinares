// GET /api/ct-nomes?ids=uuid,uuid → { uuid: { name } }   (o histórico dos candidatos mostra quem fez cada alteração)
// Só devolve o nome. Vale para quem tem acesso ao módulo Contratações.
// GET /api/ct-nomes?equipe=1 → { equipe: [{ id, nome, usuario }] }  quem é do Recrutamento (para atribuir demandas). Só para o Recrutamento.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, ok } from "./_lib/auth.js";

export const GET = rota(comLogin(async (_req, q, u) => {
  if (q.get("equipe")) {
    if (u.modulos.contratacoes.nivel !== "gestor") return ok({ equipe: [] });
    const linhas = await consulta("select id::text as id, nome, usuario from usuarios where ativo and excluido_em is null and (admin or contratacoes = 'gestor') order by nome");
    return ok({ equipe: linhas });
  }
  const ids = (q.get("ids") || "").split(",").map(s => s.trim()).filter(s => /^[0-9a-f-]{36}$/.test(s)).slice(0, 60);
  if (!ids.length) return ok({});
  const linhas = await consulta("select id::text as id, nome from usuarios where id = any($1::uuid[])", [ids]);
  return ok(Object.fromEntries(linhas.map(l => [l.id, { name: l.nome }])));
}, { modulo: "contratacoes" }));
