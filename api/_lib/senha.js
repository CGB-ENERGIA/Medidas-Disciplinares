// Senhas: hash com scrypt (nativo do Node, sem biblioteca externa).
// Formato guardado no banco: scrypt$N$r$p$sal(base64)$hash(base64)
import { scrypt, randomBytes, timingSafeEqual, randomInt } from "node:crypto";

const N = 16384, R = 8, P = 1, TAM = 64;
const scryptP = (senha, sal, n, r, p) => new Promise((ok, falha) =>
  scrypt(senha, sal, TAM, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? falha(e) : ok(k))));

export async function hashSenha(senha) {
  const sal = randomBytes(16);
  const k = await scryptP(String(senha), sal, N, R, P);
  return `scrypt$${N}$${R}$${P}$${sal.toString("base64")}$${k.toString("base64")}`;
}

export async function conferirSenha(senha, guardado) {
  const partes = String(guardado || "").split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") {
    await scryptP(String(senha), randomBytes(16), N, R, P); // mesmo tempo de resposta quando não há usuário
    return false;
  }
  const [, n, r, p, sal, hash] = partes;
  const esperado = Buffer.from(hash, "base64");
  const k = await scryptP(String(senha), Buffer.from(sal, "base64"), +n, +r, +p);
  return k.length === esperado.length && timingSafeEqual(k, esperado);
}

// Senha temporária fácil de ditar (sem 0/O, 1/l/I)
export function senhaTemporaria(tam = 10) {
  const A = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = ""; for (let i = 0; i < tam; i++) s += A[randomInt(A.length)];
  return s;
}

// Regras da senha nova
export function problemaSenha(senha) {
  const s = String(senha || "");
  if (s.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (s.length > 100) return "A senha pode ter no máximo 100 caracteres.";
  if (!/[a-zA-Z]/.test(s) || !/\d/.test(s)) return "A senha precisa ter letras e números.";
  return null;
}

// Nome de usuário: minúsculo, 3 a 30 caracteres, letras, números, ponto, hífen ou sublinhado
export const normalizarUsuario = u => String(u || "").trim().toLowerCase();
export const usuarioValido = u => /^[a-z0-9._-]{3,30}$/.test(u);
