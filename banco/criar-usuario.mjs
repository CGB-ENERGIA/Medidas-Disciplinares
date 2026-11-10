// Cria um usuário direto no banco (usado para o PRIMEIRO administrador; os demais o administrador cria pela tela "Usuários").
// Uso:
//   npm run usuario:criar -- --usuario igor.carvalho --nome "Igor Carvalho" --admin
//   npm run usuario:criar -- --usuario joao.silva --nome "João Silva" --medidas supervisor
//   npm run usuario:criar -- --usuario ana.souza --nome "Ana Souza" --medidas coordenador --contratacoes usuario
//     --admin          controle total dos dois módulos
//     --medidas        supervisor | coordenador | dp
//     --contratacoes   usuario | gestor | leitura
// Mostra uma senha temporária na tela: no primeiro acesso a pessoa troca por uma senha só dela.
import pg from "pg";
import { parseArgs } from "node:util";
import { hashSenha, senhaTemporaria, normalizarUsuario, usuarioValido } from "../api/_lib/senha.js";

const { values: a } = parseArgs({ options: {
  usuario: { type: "string" }, nome: { type: "string" }, admin: { type: "boolean" },
  medidas: { type: "string" }, contratacoes: { type: "string" }, perfil: { type: "string" } } });
const usuario = normalizarUsuario(a.usuario), nome = String(a.nome || "").trim(), admin = !!a.admin;
const medidas = a.medidas || a.perfil || null, contratacoes = a.contratacoes || null; // --perfil continua valendo (nome antigo de --medidas)
const falha = m => { console.error("Erro:", m); process.exit(1); };
if (!usuarioValido(usuario)) falha("--usuario deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado (ex.: joao.silva).");
if (nome.length < 3) falha('Informe --nome "Nome completo".');
if (medidas && !["supervisor", "coordenador", "dp"].includes(medidas)) falha("--medidas deve ser supervisor, coordenador ou dp.");
if (contratacoes && !["usuario", "gestor", "leitura"].includes(contratacoes)) falha("--contratacoes deve ser usuario, gestor ou leitura.");
if (!admin && !medidas && !contratacoes) falha("Informe pelo menos um acesso: --admin, --medidas ou --contratacoes.");
if (!process.env.DATABASE_URL) falha("Falta a DATABASE_URL no arquivo .env.");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  const { rows: existe } = await db.query("select 1 from usuarios where usuario = $1", [usuario]);
  if (existe.length) falha(`O usuário "${usuario}" já existe. Para trocar a senha, use a tela Usuários (Redefinir senha).`);
  const temp = senhaTemporaria();
  await db.query("insert into usuarios (usuario, nome, perfil, contratacoes, admin, senha_hash, trocar_senha) values ($1, $2, $3, $4, $5, $6, true)",
    [usuario, nome, medidas, contratacoes, admin, await hashSenha(temp)]);
  console.log(`\nUsuário criado: ${usuario}${admin ? " (administrador)" : ""}`);
  if (medidas) console.log(`  Medidas Disciplinares: ${medidas}`);
  if (contratacoes) console.log(`  Contratações: ${contratacoes}`);
  console.log(`Senha temporária: ${temp}`);
  console.log("No primeiro acesso o sistema pede para trocar por uma senha nova.\n");
} catch (e) {
  falha(e.message);
} finally {
  await db.end().catch(() => {});
}
