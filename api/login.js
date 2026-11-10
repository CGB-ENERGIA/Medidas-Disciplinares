// POST /api/login  { usuario, senha } → cria a sessão (cookie) e devolve os dados do usuário
// Após 5 senhas erradas seguidas, o usuário fica bloqueado por 15 minutos.
import { consulta, rota } from "./_lib/db.js";
import { criarSessao, lerJSON, comCookie, ok, erro } from "./_lib/auth.js";
import { conferirSenha, normalizarUsuario } from "./_lib/senha.js";

const MAX_TENTATIVAS = 5, BLOQUEIO_MIN = 15;
const INVALIDO = "Usuário ou senha inválidos.";

export const POST = rota(async request => {
  const corpo = await lerJSON(request);
  if (!corpo) return erro("Envie usuário e senha.", 400);
  const usuario = normalizarUsuario(corpo.usuario), senha = String(corpo.senha || "");
  if (!usuario || !senha) return erro("Informe usuário e senha.", 400);

  const [u] = await consulta(`select id, usuario, nome, perfil, admin, contratacoes, chave_pessoa, senha_hash, trocar_senha, ativo,
                                     bloqueado_ate > now() as bloqueado
                                from usuarios where usuario = $1 and excluido_em is null`, [usuario]);
  const certa = await conferirSenha(senha, u && u.senha_hash); // roda mesmo sem usuário, para não revelar quem existe
  // Bloqueado: senha errada recebe a mesma resposta de sempre (não revela que o usuário existe); só quem acertou fica sabendo do bloqueio
  if (u && u.bloqueado) return certa ? erro(`Muitas tentativas erradas. Tente de novo em ${BLOQUEIO_MIN} minutos ou peça ao DP para redefinir a senha.`, 429) : erro(INVALIDO, 401);
  if (!u || !u.ativo || !certa) {
    if (u) await consulta(`update usuarios set
        tentativas_falhas = case when tentativas_falhas + 1 >= $2 then 0 else tentativas_falhas + 1 end,
        bloqueado_ate     = case when tentativas_falhas + 1 >= $2 then now() + make_interval(mins => $3) else bloqueado_ate end
      where id = $1`, [u.id, MAX_TENTATIVAS, BLOQUEIO_MIN]);
    return erro(INVALIDO, 401);
  }

  await consulta("update usuarios set tentativas_falhas = 0, bloqueado_ate = null, ultimo_acesso = now() where id = $1", [u.id]);
  const setCookie = await criarSessao(request, u.id);
  return comCookie(ok({ usuario: u.usuario, nome: u.nome, admin: u.admin, trocar_senha: u.trocar_senha }), setCookie);
});
