// Sessões de login e controle de acesso por perfil.
// O navegador guarda só um código aleatório num cookie HttpOnly (o JavaScript da página não lê);
// o banco guarda o hash desse código. Sair apaga a sessão no banco.
import { randomBytes, createHash } from "node:crypto";
import { consulta, ok, erro } from "./db.js";

export const COOKIE = "md_sessao";
const DURACAO_H = 10; // uma jornada de trabalho; depois pede login de novo

const hashToken = t => createHash("sha256").update(t).digest("hex");

function lerCookie(request, nome) {
  const c = request.headers.get("cookie") || "";
  for (const parte of c.split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nome) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
}

const cookie = (valor, maxAge) => `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export async function criarSessao(request, usuarioId) {
  const token = randomBytes(32).toString("base64url");
  await consulta("delete from sessoes where usuario_id = $1 and expira_em < now()", [usuarioId]);
  await consulta(`insert into sessoes (token_hash, usuario_id, expira_em, ip, agente)
                  values ($1, $2, now() + make_interval(hours => $3), $4, $5)`,
    [hashToken(token), usuarioId, DURACAO_H, ipDe(request), (request.headers.get("user-agent") || "").slice(0, 300)]);
  return cookie(token, DURACAO_H * 3600);
}

export async function encerrarSessao(request) {
  const t = lerCookie(request, COOKIE);
  if (t) await consulta("delete from sessoes where token_hash = $1", [hashToken(t)]);
  return cookie("", 0);
}

export const ipDe = request => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;

// Usuário da sessão atual (ou null)
export async function usuarioDaSessao(request) {
  const t = lerCookie(request, COOKIE);
  if (!t) return null;
  const [u] = await consulta(`
    select u.id, u.usuario, u.nome, u.perfil, u.chave_pessoa, u.trocar_senha
      from sessoes s join usuarios u on u.id = s.usuario_id
     where s.token_hash = $1 and s.expira_em > now() and u.ativo`, [hashToken(t)]);
  return u || null;
}

// Envolve uma rota que exige login. opcoes.perfis limita quem pode usar (ex.: ["dp"]).
// Enquanto a pessoa estiver com senha temporária, só pode trocar a senha (opcoes.liberaTrocaSenha).
export const comLogin = (fn, opcoes = {}) => async (request, params) => {
  const u = await usuarioDaSessao(request);
  if (!u) return erro("Faça login para continuar.", 401);
  if (u.trocar_senha && !opcoes.liberaTrocaSenha) return erro("Troque a sua senha temporária para continuar.", 403);
  if (opcoes.perfis && !opcoes.perfis.includes(u.perfil)) return erro("Seu perfil não tem acesso a isto.", 403);
  return fn(request, params, u);
};

// Filtro de equipe pelo perfil: devolve a condição SQL (sobre o apelido "e" de equipes) e acrescenta o parâmetro.
//   DP → vê tudo · Coordenador → equipes em que é coordenador · Supervisor → equipes em que é supervisor
export function escopoEquipe(u, params) {
  if (u.perfil === "dp") return "true";
  if (!u.chave_pessoa) return "false";
  params.push(u.chave_pessoa);
  return u.perfil === "supervisor" ? `e.supervisor = $${params.length}` : `e.coordenador = $${params.length}`;
}

// Corpo JSON das requisições que alteram dados (exigir JSON também bloqueia envio de formulário de outro site)
export async function lerJSON(request) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) return null;
  try { return await request.json(); } catch { return null; }
}

// Resposta com cookie
export const comCookie = (resposta, setCookie) => { resposta.headers.append("set-cookie", setCookie); return resposta; };
export { ok, erro };
