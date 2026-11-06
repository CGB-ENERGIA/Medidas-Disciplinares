// GET /api/eu → quem está logado (401 se ninguém)
import { rota } from "./_lib/db.js";
import { usuarioDaSessao, ok, erro } from "./_lib/auth.js";

export const GET = rota(async request => {
  const u = await usuarioDaSessao(request);
  if (!u) return erro("Faça login para continuar.", 401);
  return ok({ id: u.id, usuario: u.usuario, nome: u.nome, perfil: u.perfil, chave: u.chave_pessoa, trocar_senha: u.trocar_senha });
});
