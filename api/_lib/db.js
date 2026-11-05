// Conexão com o Neon para as funções da Vercel (driver HTTP, próprio para serverless).
// A DATABASE_URL vem das variáveis de ambiente da Vercel (ou do .env, no teste local).
import { neon } from "@neondatabase/serverless";

let _sql;
export function sql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Consulta com parâmetros ($1, $2…): devolve as linhas
export const consulta = (texto, params = []) => sql().query(texto, params);

// Respostas padronizadas
export const ok = (dados, status = 200) => Response.json(dados, { status, headers: { "cache-control": "no-store" } });
export const erro = (mensagem, status = 400) => ok({ erro: mensagem }, status);

// Envolve a função: qualquer falha vira um erro 500 em JSON, sem expor detalhes do banco
export const rota = fn => async request => {
  try { return await fn(request, new URL(request.url).searchParams); }
  catch (e) { console.error(e); return erro("Erro interno no servidor.", 500); }
};
