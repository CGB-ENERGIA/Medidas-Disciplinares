// Cadastro de usuários e de acessos por módulo (só o administrador)
//   GET    /api/usuarios → lista (sem os excluídos)
//   POST   /api/usuarios { usuario, nome, admin?, medidas?, contratacoes? } → cria e devolve a senha temporária (mostrada uma única vez)
//   PATCH  /api/usuarios { id, usuario?, nome?, admin?, medidas?, contratacoes?, ativo?, redefinir_senha? }
//   DELETE /api/usuarios { id } → exclui. Sem nenhum registro em medidas: apaga de vez.
//          Se já participou de alguma medida: some da lista, perde o acesso e o login fica livre (a auditoria continua).
// Acessos:
//   admin        → controle total dos dois módulos (age como DP em Medidas e como gestor em Contratações)
//   medidas      → "supervisor" | "coordenador" (usuários) | "dp" (gestor) | "" (sem acesso)
//   contratacoes → "usuario" (solicitante) | "gestor" (Recrutamento) | "leitura" (Gestão) | "" (sem acesso)
// Todos os perfis veem todas as equipes; não há vínculo com a estrutura de equipes.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, lerJSON, ok, erro } from "./_lib/auth.js";
import { hashSenha, senhaTemporaria, normalizarUsuario, usuarioValido } from "./_lib/senha.js";

const MEDIDAS = ["supervisor", "coordenador", "dp"];
const CONTRATACOES = ["usuario", "gestor", "leitura"];
const SO_ADMIN = { admin: true, modulo: null };

const vazioParaNulo = v => (v === undefined || v === null || v === "" ? null : v);
const erroAcesso = (medidas, contratacoes) => {
  if (medidas !== null && !MEDIDAS.includes(medidas)) return "Perfil de Medidas Disciplinares inválido.";
  if (contratacoes !== null && !CONTRATACOES.includes(contratacoes)) return "Nível de Contratações inválido.";
  return null;
};
// Quantos administradores ativos existem, sem contar o usuário informado
const outrosAdmins = async id => (await consulta("select count(*)::int as n from usuarios where admin and ativo and excluido_em is null and id <> $1", [id]))[0].n;

export const GET = rota(comLogin(async () => {
  const usuarios = await consulta(`select id, usuario, nome, admin, perfil as medidas, contratacoes, ativo, trocar_senha,
                                          bloqueado_ate > now() as bloqueado, ultimo_acesso, criado_em
                                     from usuarios where excluido_em is null order by ativo desc, nome`);
  return ok({ usuarios });
}, SO_ADMIN));

export const POST = rota(comLogin(async request => {
  const c = await lerJSON(request); if (!c) return erro("Dados inválidos.", 400);
  const usuario = normalizarUsuario(c.usuario), nome = String(c.nome || "").trim(), admin = c.admin === true;
  const medidas = vazioParaNulo(c.medidas), contratacoes = vazioParaNulo(c.contratacoes);
  if (!usuarioValido(usuario)) return erro("Usuário deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado (ex.: joao.silva).", 400);
  if (nome.length < 3) return erro("Informe o nome completo.", 400);
  const e = erroAcesso(medidas, contratacoes); if (e) return erro(e, 400);
  if (!admin && !medidas && !contratacoes) return erro("Escolha pelo menos um acesso: administrador, Medidas Disciplinares ou Contratações.", 400);
  const [existe] = await consulta("select 1 from usuarios where usuario = $1", [usuario]);
  if (existe) return erro(`O usuário "${usuario}" já existe.`, 409);
  const temp = senhaTemporaria();
  const [novo] = await consulta(`insert into usuarios (usuario, nome, perfil, contratacoes, admin, chave_pessoa, senha_hash, trocar_senha)
                                 values ($1, $2, $3, $4, $5, null, $6, true) returning id`,
    [usuario, nome, medidas, contratacoes, admin, await hashSenha(temp)]);
  return ok({ id: novo.id, usuario, senha_temporaria: temp }, 201);
}, SO_ADMIN));

export const PATCH = rota(comLogin(async (request, _q, eu) => {
  const c = await lerJSON(request); if (!c || !c.id) return erro("Dados inválidos.", 400);
  const [u] = await consulta("select id, usuario, admin, perfil, contratacoes from usuarios where id = $1 and excluido_em is null", [c.id]);
  if (!u) return erro("Usuário não encontrado.", 404);

  const novoAdmin = c.admin === undefined ? u.admin : c.admin === true;
  const medidas = c.medidas === undefined ? u.perfil : vazioParaNulo(c.medidas);
  const contratacoes = c.contratacoes === undefined ? u.contratacoes : vazioParaNulo(c.contratacoes);
  const e = erroAcesso(medidas, contratacoes); if (e) return erro(e, 400);
  if (u.id === eu.id && (c.ativo === false || novoAdmin === false)) return erro("Você não pode desativar nem tirar o próprio acesso de administrador.", 400);
  if (!novoAdmin && !medidas && !contratacoes) return erro("O usuário precisa ter pelo menos um acesso. Para tirar tudo, desative ou exclua o usuário.", 400);
  if (u.admin && (!novoAdmin || c.ativo === false) && (await outrosAdmins(u.id)) === 0) return erro("É preciso manter pelo menos um administrador ativo.", 400);

  const sets = [], p = [u.id];
  const set = (col, val) => { p.push(val); sets.push(`${col} = $${p.length}`); };
  if (c.usuario !== undefined) {
    const novo = normalizarUsuario(c.usuario);
    if (!usuarioValido(novo)) return erro("Usuário deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado (ex.: joao.silva).", 400);
    const [outro] = await consulta("select 1 from usuarios where usuario = $1 and id <> $2", [novo, u.id]);
    if (outro) return erro(`O usuário "${novo}" já existe.`, 409);
    set("usuario", novo);
  }
  if (c.nome !== undefined) { const n = String(c.nome).trim(); if (n.length < 3) return erro("Informe o nome completo.", 400); set("nome", n); }
  const mudouAcesso = novoAdmin !== u.admin || medidas !== u.perfil || contratacoes !== u.contratacoes;
  if (mudouAcesso) { set("admin", novoAdmin); set("perfil", medidas); set("contratacoes", contratacoes); set("chave_pessoa", null); }
  if (c.ativo !== undefined) set("ativo", !!c.ativo);
  let temp = null;
  if (c.redefinir_senha) {
    temp = senhaTemporaria();
    set("senha_hash", await hashSenha(temp)); set("trocar_senha", true); set("tentativas_falhas", 0); set("bloqueado_ate", null);
  }
  if (!sets.length) return erro("Nada para alterar.", 400);
  await consulta(`update usuarios set ${sets.join(", ")} where id = $1`, p);
  // desativou, redefiniu a senha ou mudou os acessos: derruba as sessões abertas dela
  if (c.ativo === false || c.redefinir_senha || mudouAcesso) await consulta("delete from sessoes where usuario_id = $1", [u.id]);
  return ok({ alterado: true, ...(temp ? { senha_temporaria: temp } : {}) });
}, SO_ADMIN));

export const DELETE = rota(comLogin(async (request, _q, eu) => {
  const c = await lerJSON(request); if (!c || !c.id) return erro("Dados inválidos.", 400);
  if (c.id === eu.id) return erro("Você não pode excluir o próprio usuário.", 400);
  const [u] = await consulta("select id, usuario, admin from usuarios where id = $1 and excluido_em is null", [c.id]);
  if (!u) return erro("Usuário não encontrado.", 404);
  if (u.admin && (await outrosAdmins(u.id)) === 0) return erro("É preciso manter pelo menos um administrador ativo.", 400);
  const [{ usado }] = await consulta(`select exists (select 1 from medidas where solicitante_id = $1)
                                          or exists (select 1 from medidas_historico where usuario_id = $1)
                                          or exists (select 1 from medidas_arquivos where enviado_por = $1)
                                          or exists (select 1 from ct_docs where criado_por = $1 or atualizado_por = $1)
                                          or exists (select 1 from ct_arquivos where enviado_por = $1)
                                          or exists (select 1 from ct_log where usuario_id = $1) as usado`, [u.id]);
  await consulta("delete from sessoes where usuario_id = $1", [u.id]);
  if (!usado) { await consulta("delete from usuarios where id = $1", [u.id]); return ok({ excluido: true, definitivo: true }); }
  // Já participou de medidas: não dá para apagar sem perder quem fez cada passo. Sai da lista, perde o acesso e libera o login.
  await consulta(`update usuarios set ativo = false, excluido_em = now(),
                         usuario = usuario || '.excluido.' || to_char(now(), 'YYYYMMDDHH24MISS') where id = $1`, [u.id]);
  return ok({ excluido: true, definitivo: false });
}, SO_ADMIN));
