// Cria um usuário direto no banco (usado para o PRIMEIRO usuário do DP; os demais o DP cria pela tela "Usuários").
// Uso:
//   npm run usuario:criar -- --usuario igor.carvalho --nome "Igor Carvalho" --perfil dp
//   npm run usuario:criar -- --usuario joao.silva --nome "João Silva" --perfil supervisor --chave "LUIS FILIPE"
// Mostra uma senha temporária na tela: no primeiro acesso a pessoa troca por uma senha só dela.
import pg from "pg";
import { parseArgs } from "node:util";
import { hashSenha, senhaTemporaria, normalizarUsuario, usuarioValido } from "../api/_lib/senha.js";

const { values: a } = parseArgs({ options: { usuario: { type: "string" }, nome: { type: "string" }, perfil: { type: "string" }, chave: { type: "string" } } });
const usuario = normalizarUsuario(a.usuario), nome = String(a.nome || "").trim(), perfil = a.perfil, chave = a.chave ? a.chave.trim() : null;
const falha = m => { console.error("Erro:", m); process.exit(1); };
if (!usuarioValido(usuario)) falha("--usuario deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado (ex.: joao.silva).");
if (nome.length < 3) falha('Informe --nome "Nome completo".');
if (!["supervisor", "coordenador", "dp"].includes(perfil)) falha("--perfil deve ser supervisor, coordenador ou dp.");
if (perfil !== "dp" && !chave) falha(`Para ${perfil}, informe --chave com o nome dele na estrutura de equipes (ex.: --chave "AFONSO").`);
if (!process.env.DATABASE_URL) falha("Falta a DATABASE_URL no arquivo .env.");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  if (chave) {
    const col = perfil === "supervisor" ? "supervisor" : "coordenador";
    const { rows: [{ n }] } = await db.query(`select count(*)::int as n from equipes where ${col} = $1`, [chave]);
    if (!n) falha(`"${chave}" não existe como ${perfil} na estrutura de equipes.`);
  }
  const { rows: existe } = await db.query("select 1 from usuarios where usuario = $1", [usuario]);
  if (existe.length) falha(`O usuário "${usuario}" já existe. Para trocar a senha, use a tela Usuários (Redefinir senha).`);
  const temp = senhaTemporaria();
  await db.query("insert into usuarios (usuario, nome, perfil, chave_pessoa, senha_hash, trocar_senha) values ($1, $2, $3, $4, $5, true)",
    [usuario, nome, perfil, perfil === "dp" ? null : chave, await hashSenha(temp)]);
  console.log(`\nUsuário criado: ${usuario} (${perfil})`);
  console.log(`Senha temporária: ${temp}`);
  console.log("No primeiro acesso o sistema pede para trocar por uma senha nova.\n");
} catch (e) {
  falha(e.message);
} finally {
  await db.end().catch(() => {});
}
