// Documentos do módulo Contratações (candidatos, vagas, rm, config, talentos, talentosEd).
//   GET  /api/ct-docs?col=vagas&desde=0     → o que mudou desde a versão informada (a tela repete a chamada para ficar atualizada)
//   GET  /api/ct-docs?col=vagas&id=v123     → um documento
//   POST /api/ct-docs { col, id, dados }    → grava (cria ou substitui)
//   POST /api/ct-docs { col, id, remover: true }   → esconde (nada é apagado de verdade)
//   POST /api/ct-docs { ops: [ ...as duas formas acima... ] }   → várias de uma vez
// Quem pode o quê (nível do usuário em Contratações):
//   gestor  (Recrutamento) lê e grava tudo
//   leitura (Gestão)       lê tudo, não grava
//   usuario (Solicitante)  lê só as vagas e candidatos dele, as configurações e o resumo do RM;
//                          abre vagas em nome dele e anexa a RP assinada nos candidatos das vagas dele
import { consulta, rota } from "./_lib/db.js";
import { comLogin, lerJSON, ok, erro } from "./_lib/auth.js";
import { COLECOES, norm, visivelPara, mesmoConteudo } from "./_lib/ct.js";

const MAX_PAGINA = 3_000_000;   // a resposta da Vercel aceita até 4,5 MB: a tela busca por páginas
const MAX_DOCS = 400;
const MAX_DOC = 3_500_000;      // tamanho máximo de um documento gravado
const MAX_OPS = 60;
const COM_SOLICITANTE = ["candidatos", "vagas"];

const nivelDe = u => u.modulos.contratacoes.nivel;

// O que cada nível LÊ de cada coleção: "todos", "proprios" (só o que é dele), "meta" (só o resumo do RM) ou nada
function regraLeitura(nivel, col) {
  if (nivel !== "usuario") return "todos";
  return { candidatos: "proprios", vagas: "proprios", config: "todos", rm: "meta" }[col] || null;
}
const ehDele = (u, r) => r.criado_por === u.id || visivelPara(r.solicitante_norm, u.nome);

async function listar(u, col, desde) {
  const regra = regraLeitura(nivelDe(u), col);
  if (!regra) return { docs: [], removidos: [], proximo: desde, mais: false };
  const leves = await consulta(`select id, versao::text as versao, length(dados::text)::int as tam, solicitante_norm, criado_por::text as criado_por, removido
                                  from ct_docs where colecao = $1 and versao > $2 order by ct_docs.versao`, [col, desde]);
  const visiveis = leves.filter(r => regra === "todos" || (regra === "meta" ? r.id === "meta" : ehDele(u, r)));
  const pagina = []; let soma = 0, mais = false;
  for (const r of visiveis) {
    if (!r.removido) { if (pagina.length >= MAX_DOCS || (pagina.length && soma + r.tam > MAX_PAGINA)) { mais = true; break; } soma += r.tam; }
    pagina.push(r);
  }
  const proximo = mais ? pagina[pagina.length - 1].versao : (leves.length ? leves[leves.length - 1].versao : String(desde));
  const ids = pagina.filter(r => !r.removido).map(r => r.id);
  const docs = ids.length ? (await consulta("select id, dados from ct_docs where colecao = $1 and id = any($2::text[])", [col, ids])).map(r => ({ id: r.id, dados: r.dados })) : [];
  return { docs, removidos: pagina.filter(r => r.removido).map(r => r.id), proximo, mais };
}

export const GET = rota(comLogin(async (_req, q, u) => {
  const col = q.get("col"); if (!COLECOES.includes(col)) return erro("Coleção inválida.", 400);
  if (q.get("id")) {
    const regra = regraLeitura(nivelDe(u), col);
    const [r] = regra ? await consulta("select id, dados, removido, solicitante_norm, criado_por::text as criado_por from ct_docs where colecao = $1 and id = $2", [col, q.get("id")]) : [];
    const pode = r && !r.removido && (regra === "todos" || (regra === "meta" ? r.id === "meta" : ehDele(u, r)));
    return ok(pode ? { existe: true, id: r.id, dados: r.dados } : { existe: false });
  }
  const desde = /^\d{1,18}$/.test(q.get("desde") || "0") ? q.get("desde") || "0" : "0";
  return ok(await listar(u, col, desde));
}, { modulo: "contratacoes" }));

// Regras de escrita do usuário fim (solicitante). Devolve o motivo da recusa, ou null se pode.
function erroUsuario(u, op, atual) {
  if (op.remover) return "Seu acesso não permite remover registros.";
  const dele = atual && ehDele(u, { criado_por: atual.criado_por, solicitante_norm: atual.solicitante_norm });
  const novoDele = visivelPara(norm(op.dados && op.dados.solicitante), u.nome);
  if (op.col === "vagas") {
    if (atual && !dele) return "Você só altera as vagas que abriu.";
    if (!novoDele) return "Você só abre vagas em seu nome.";
    return null;
  }
  if (op.col === "candidatos") {
    if (!atual || !dele) return "Você só altera candidatos das suas vagas.";
    // só a RP assinada (etapa "req"), o histórico e a data de atualização podem mudar
    const a = atual.dados || {}, n = op.dados || {};
    const esperado = { ...a, atualizadoEm: n.atualizadoEm, hist: n.hist, etapas: { ...(a.etapas || {}), req: (n.etapas || {}).req } };
    if (!esperado.hist) delete esperado.hist; if (!esperado.atualizadoEm) delete esperado.atualizadoEm; if (!esperado.etapas.req) delete esperado.etapas.req;
    const nn = { ...n }; if (!nn.hist) delete nn.hist; if (!nn.atualizadoEm) delete nn.atualizadoEm;
    return mesmoConteudo(esperado, nn) ? null : "Seu acesso só permite anexar a RP assinada.";
  }
  return "Seu acesso não permite gravar nesta área.";
}

async function gravarOp(u, op) {
  const { col, id } = op || {};
  if (!COLECOES.includes(col) || !id || typeof id !== "string" || id.length > 200) return "Coleção ou id inválido.";
  const nivel = nivelDe(u);
  if (nivel === "leitura") return "Seu acesso a Contratações é só de leitura.";
  const [atual] = await consulta("select dados, removido, solicitante_norm, criado_por::text as criado_por from ct_docs where colecao = $1 and id = $2", [col, id]);
  if (nivel === "usuario") { const e = erroUsuario(u, op, atual); if (e) return e; }
  if (op.remover) {
    if (atual && !atual.removido) {
      await consulta("update ct_docs set removido = true, atualizado_por = $3, atualizado_em = now(), versao = nextval('ct_versao_seq') where colecao = $1 and id = $2", [col, id, u.id]);
      await registrar(u, col, id, "removeu");
    }
    return null;
  }
  const d = op.dados;
  if (!d || typeof d !== "object" || Array.isArray(d)) return "Dados inválidos.";
  const txt = JSON.stringify(d);
  if (txt.length > MAX_DOC) return "O registro ficou grande demais para guardar.";
  const sol = COM_SOLICITANTE.includes(col) ? norm(d.solicitante) || null : null;
  await consulta(`insert into ct_docs (colecao, id, dados, solicitante_norm, criado_por, atualizado_por)
                  values ($1, $2, $3::jsonb, $4, $5, $5)
                  on conflict (colecao, id) do update set dados = excluded.dados, solicitante_norm = excluded.solicitante_norm,
                    atualizado_por = excluded.atualizado_por, atualizado_em = now(), removido = false, versao = nextval('ct_versao_seq')`,
    [col, id, txt, sol, u.id]);
  await registrar(u, col, id, atual && !atual.removido ? "alterou" : "criou");
  return null;
}
const registrar = (u, col, id, acao) => consulta("insert into ct_log (usuario_id, usuario_nome, colecao, doc_id, acao) values ($1, $2, $3, $4, $5)", [u.id, u.nome, col, id, acao]);

export const POST = rota(comLogin(async (request, _q, u) => {
  const c = await lerJSON(request); if (!c) return erro("Dados inválidos.", 400);
  const ops = Array.isArray(c.ops) ? c.ops : [c];
  if (!ops.length || ops.length > MAX_OPS) return erro(`Envie de 1 a ${MAX_OPS} operações por vez.`, 400);
  for (const op of ops) { const e = await gravarOp(u, op); if (e) return erro(e, e.startsWith("Seu acesso") || e.startsWith("Você só") ? 403 : 400); }
  return ok({ salvo: ops.length });
}, { modulo: "contratacoes" }));
