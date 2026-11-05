// Cadastro de usuários (só o DP)
//   GET   /api/usuarios → lista + chaves de supervisor/coordenador disponíveis na estrutura de equipes
//   POST  /api/usuarios { usuario, nome, perfil, chave } → cria e devolve a senha temporária (mostrada uma única vez)
//   PATCH /api/usuarios { id, nome?, perfil?, chave?, ativo?, redefinir_senha? }
import { consulta, rota } from "./_lib/db.js";
import { comLogin, lerJSON, ok, erro } from "./_lib/auth.js";
import { hashSenha, senhaTemporaria, normalizarUsuario, usuarioValido } from "./_lib/senha.js";

const PERFIS = ["supervisor", "coordenador", "dp"];
const SO_DP = { perfis: ["dp"] };

async function validarChave(perfil, chave) {
  if (perfil === "dp") return { chave: null };
  const k = String(chave || "").trim();
  if (!k) return { problema: `Escolha a qual ${perfil} da estrutura de equipes este usuário corresponde.` };
  const col = perfil === "supervisor" ? "supervisor" : "coordenador";
  const [{ n }] = await consulta(`select count(*)::int as n from equipes where ${col} = $1`, [k]);
  if (!n) return { problema: `"${k}" não existe como ${perfil} na estrutura de equipes.` };
  return { chave: k };
}

export const GET = rota(comLogin(async () => {
  const [usuarios, sups, coords] = await Promise.all([
    consulta(`select id, usuario, nome, perfil, chave_pessoa as chave, ativo, trocar_senha,
                     bloqueado_ate > now() as bloqueado, ultimo_acesso, criado_em
                from usuarios order by ativo desc, nome`),
    consulta("select supervisor as chave, count(*)::int as n from equipes where supervisor is not null group by 1 order by 1"),
    consulta(`select e.coordenador as chave, g.nome, count(*)::int as n
                from equipes e left join gestores g on g.chave = e.coordenador
               where e.coordenador is not null group by 1, 2 order by 1`)
  ]);
  return ok({ usuarios, chaves: { supervisor: sups, coordenador: coords } });
}, SO_DP));

export const POST = rota(comLogin(async request => {
  const c = await lerJSON(request); if (!c) return erro("Dados inválidos.", 400);
  const usuario = normalizarUsuario(c.usuario), nome = String(c.nome || "").trim(), perfil = c.perfil;
  if (!usuarioValido(usuario)) return erro("Usuário deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado (ex.: joao.silva).", 400);
  if (nome.length < 3) return erro("Informe o nome completo.", 400);
  if (!PERFIS.includes(perfil)) return erro("Perfil inválido.", 400);
  const v = await validarChave(perfil, c.chave); if (v.problema) return erro(v.problema, 400);
  const [existe] = await consulta("select 1 from usuarios where usuario = $1", [usuario]);
  if (existe) return erro(`O usuário "${usuario}" já existe.`, 409);
  const temp = senhaTemporaria();
  const [novo] = await consulta(`insert into usuarios (usuario, nome, perfil, chave_pessoa, senha_hash, trocar_senha)
                                 values ($1, $2, $3, $4, $5, true) returning id`, [usuario, nome, perfil, v.chave, await hashSenha(temp)]);
  return ok({ id: novo.id, usuario, senha_temporaria: temp }, 201);
}, SO_DP));

export const PATCH = rota(comLogin(async (request, _q, eu) => {
  const c = await lerJSON(request); if (!c || !c.id) return erro("Dados inválidos.", 400);
  const [u] = await consulta("select id, perfil, chave_pessoa from usuarios where id = $1", [c.id]);
  if (!u) return erro("Usuário não encontrado.", 404);
  if (u.id === eu.id && (c.ativo === false || (c.perfil && c.perfil !== "dp"))) return erro("Você não pode desativar nem tirar o perfil DP de si mesmo.", 400);

  const sets = [], p = [u.id];
  const set = (col, val) => { p.push(val); sets.push(`${col} = $${p.length}`); };
  if (c.nome !== undefined) { const n = String(c.nome).trim(); if (n.length < 3) return erro("Informe o nome completo.", 400); set("nome", n); }
  if (c.perfil !== undefined || c.chave !== undefined) {
    const perfil = c.perfil ?? u.perfil; if (!PERFIS.includes(perfil)) return erro("Perfil inválido.", 400);
    const v = await validarChave(perfil, c.chave ?? u.chave_pessoa); if (v.problema) return erro(v.problema, 400);
    set("perfil", perfil); set("chave_pessoa", v.chave);
  }
  if (c.ativo !== undefined) set("ativo", !!c.ativo);
  let temp = null;
  if (c.redefinir_senha) {
    temp = senhaTemporaria();
    set("senha_hash", await hashSenha(temp)); set("trocar_senha", true); set("tentativas_falhas", 0); set("bloqueado_ate", null);
  }
  if (!sets.length) return erro("Nada para alterar.", 400);
  await consulta(`update usuarios set ${sets.join(", ")} where id = $1`, p);
  // desativou ou redefiniu a senha: derruba as sessões abertas dessa pessoa
  if (c.ativo === false || c.redefinir_senha || c.perfil !== undefined || c.chave !== undefined) await consulta("delete from sessoes where usuario_id = $1", [u.id]);
  return ok({ alterado: true, ...(temp ? { senha_temporaria: temp } : {}) });
}, SO_DP));
