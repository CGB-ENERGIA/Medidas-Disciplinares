// Libera (ou retira) o acesso de UMA pessoa ao módulo Horas Extras (ambiente de testes).
// Uso:
//   npm run horas:liberar -- --usuario igor.dionisio --nivel gestor     (gestor = analisa e carrega a base)
//   npm run horas:liberar -- --usuario fulano --nivel usuario            (usuario = só analisa)
//   npm run horas:liberar -- --usuario igor.dionisio --retirar
// O administrador não ganha este módulo sozinho: o acesso vale só para quem for liberado aqui.
import pg from "pg";
import { parseArgs } from "node:util";

const { values: a } = parseArgs({ options: { usuario: { type: "string" }, nivel: { type: "string" }, retirar: { type: "boolean" } } });
const falha = m => { console.error("Erro:", m); process.exit(1); };
const usuario = String(a.usuario || "").trim().toLowerCase();
if (!usuario) falha("Informe --usuario.");
if (!a.retirar && !["usuario", "gestor"].includes(a.nivel)) falha("Informe --nivel usuario ou --nivel gestor (ou --retirar).");
if (!process.env.DATABASE_URL) falha("Falta a DATABASE_URL no arquivo .env.");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  const { rowCount } = await db.query("update usuarios set horas_extras = $2 where usuario = $1 and excluido_em is null",
    [usuario, a.retirar ? null : a.nivel]);
  if (!rowCount) falha(`Usuário "${usuario}" não encontrado.`);
  console.log(a.retirar ? `Horas Extras: acesso de ${usuario} retirado.` : `Horas Extras: ${usuario} agora é "${a.nivel}".`);
} catch (e) { falha(e.message); } finally { await db.end(); }
