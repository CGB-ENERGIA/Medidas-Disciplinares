// Documentos da Central Administrativa (lançamentos, cadastros, sugestões...). Cada documento é um JSON, como no Artifact.
//   GET  /api/ca-docs?col=hlan              → todos os documentos da coleção que a pessoa pode ler
//   GET  /api/ca-docs?col=cfg&id=metas      → um documento
//   GET  /api/ca-docs?nomes=uuid,uuid       → { uuid: { name } } (quem mandou cada sugestão)
//   POST /api/ca-docs { col, id, dados }    → grava (cria ou substitui)
//   POST /api/ca-docs { col, id, remover: true } → apaga
// Regras (api/_lib/ca.js): cada coleção pertence a uma área; consulta lê, gestor grava; o administrador faz tudo.
// Sugestões (sug): cada pessoa lê e grava só a sua; o administrador lê e responde todas. Produtividade (eqp): o administrador e quem tem a chave "Ver Produtividade da equipe" em Usuários.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, lerJSON, ok, erro } from "./_lib/auth.js";
import { colecaoValida, podeLer, erroGravar, temCentral } from "./_lib/ca.js";

const MAX_DOC = 3_500_000;
const idValido = id => typeof id === "string" && id.length > 0 && id.length <= 200;

export const GET = rota(comLogin(async (_req, q, u) => {
  if (!temCentral(u)) return erro("Seu acesso não inclui a Central Administrativa.", 403);
  if (q.get("nomes") !== null) {
    const ids = (q.get("nomes") || "").split(",").map(s => s.trim()).filter(s => /^[0-9a-f-]{36}$/.test(s)).slice(0, 100);
    if (!ids.length) return ok({});
    const l = await consulta("select id::text as id, nome from usuarios where id = any($1::uuid[])", [ids]);
    return ok(Object.fromEntries(l.map(x => [x.id, { name: x.nome }])));
  }
  const col = q.get("col");
  if (!colecaoValida(col)) return erro("Coleção inválida.", 400);
  if (!podeLer(u, col)) return erro("Seu acesso não inclui esta área.", 403);
  const id = q.get("id");
  if (id !== null) {
    if (!idValido(id)) return erro("Id inválido.", 400);
    if (col === "sug" && !u.admin && id !== u.id) return ok({ existe: false });
    const [r] = await consulta("select dados from ca_docs where colecao = $1 and id = $2", [col, id]);
    return ok(r ? { existe: true, id, dados: r.dados } : { existe: false });
  }
  const linhas = col === "sug" && !u.admin
    ? await consulta("select id, dados from ca_docs where colecao = $1 and id = $2", [col, u.id])
    : await consulta("select id, dados from ca_docs where colecao = $1 order by atualizado_em", [col]);
  return ok({ docs: linhas.map(r => ({ id: r.id, dados: r.dados })) });
}, { modulo: null }));

export const POST = rota(comLogin(async (request, _q, u) => {
  if (!temCentral(u)) return erro("Seu acesso não inclui a Central Administrativa.", 403);
  const c = await lerJSON(request); if (!c) return erro("Dados inválidos.", 400);
  const { col, id } = c;
  if (!colecaoValida(col) || !idValido(id)) return erro("Coleção ou id inválido.", 400);
  const e = erroGravar(u, col, id); if (e) return erro(e, 403);
  if (c.remover) {
    await consulta("delete from ca_docs where colecao = $1 and id = $2", [col, id]);
    return ok({ removido: true });
  }
  const d = c.dados;
  if (!d || typeof d !== "object" || Array.isArray(d)) return erro("Dados inválidos.", 400);
  const txt = JSON.stringify(d);
  if (txt.length > MAX_DOC) return erro("O registro ficou grande demais para guardar.", 413);
  await consulta(`insert into ca_docs (colecao, id, dados, atualizado_por) values ($1, $2, $3::jsonb, $4)
                  on conflict (colecao, id) do update set dados = excluded.dados, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
    [col, id, txt, u.id]);
  return ok({ salvo: true });
}, { modulo: null }));
