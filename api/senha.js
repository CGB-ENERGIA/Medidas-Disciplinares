// POST /api/senha  { atual, nova } → troca a senha do próprio usuário
// Também é o caminho obrigatório no primeiro acesso (senha temporária).
import { consulta, rota } from "./_lib/db.js";
import { comLogin, lerJSON, tokenAtual, ok, erro } from "./_lib/auth.js";
import { conferirSenha, hashSenha, problemaSenha } from "./_lib/senha.js";

export const POST = rota(comLogin(async (request, _q, u) => {
  const corpo = await lerJSON(request);
  if (!corpo) return erro("Envie a senha atual e a nova.", 400);
  const [{ senha_hash }] = await consulta("select senha_hash from usuarios where id = $1", [u.id]);
  if (!(await conferirSenha(String(corpo.atual || ""), senha_hash))) return erro("A senha atual não confere.", 400);
  if (String(corpo.nova || "") === String(corpo.atual || "")) return erro("A senha nova precisa ser diferente da atual.", 400);
  const p = problemaSenha(corpo.nova); if (p) return erro(p, 400);
  await consulta("update usuarios set senha_hash = $2, trocar_senha = false where id = $1", [u.id, await hashSenha(corpo.nova)]);
  // quem estiver logado com a senha antiga em outro computador sai
  await consulta("delete from sessoes where usuario_id = $1 and token_hash <> $2", [u.id, tokenAtual(request) || ""]);
  return ok({ trocada: true });
}, { liberaTrocaSenha: true, modulo: null }));
