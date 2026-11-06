// Gera uma senha temporária nova para um usuário (quando ninguém do DP consegue entrar para redefinir pela tela).
// Uso:  npm run usuario:redefinir -- --usuario igor.carvalho
// Também desbloqueia o usuário e encerra as sessões abertas. No próximo acesso, o sistema pede para criar uma senha nova.
import pg from "pg";
import { parseArgs } from "node:util";
import { hashSenha, senhaTemporaria, normalizarUsuario } from "../api/_lib/senha.js";

const { values: a } = parseArgs({ options: { usuario: { type: "string" } } });
const usuario = normalizarUsuario(a.usuario);
const falha = m => { console.error("Erro:", m); process.exit(1); };
if (!usuario) falha("Informe --usuario (ex.: --usuario igor.carvalho).");
if (!process.env.DATABASE_URL) falha("Falta a DATABASE_URL no arquivo .env.");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  const temp = senhaTemporaria();
  const { rows } = await db.query(`update usuarios set senha_hash = $2, trocar_senha = true, tentativas_falhas = 0, bloqueado_ate = null, ativo = true
                                    where usuario = $1 returning id`, [usuario, await hashSenha(temp)]);
  if (!rows.length) falha(`O usuário "${usuario}" não existe.`);
  await db.query("delete from sessoes where usuario_id = $1", [rows[0].id]);
  console.log(`\nSenha redefinida para: ${usuario}`);
  console.log(`Senha temporária: ${temp}`);
  console.log("Entre com ela no site; o sistema vai pedir para você criar uma senha nova.\n");
} catch (e) {
  falha(e.message);
} finally {
  await db.end().catch(() => {});
}
