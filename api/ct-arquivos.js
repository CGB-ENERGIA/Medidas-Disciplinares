// Arquivos do módulo Contratações (currículos, certificados, documentos e RPs assinadas).
//   POST /api/ct-arquivos   corpo = o próprio arquivo; tipo em Content-Type e nome em X-Nome → { id, contentType, sizeBytes }
//   GET  /api/ct-arquivos?id=…   baixa o arquivo (só para quem está logado e tem acesso ao módulo)
// Gestor (Recrutamento) e usuário (Solicitante, para a RP assinada) enviam; a Gestão (leitura) só baixa.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, ok, erro } from "./_lib/auth.js";

const MAX_BYTES = 4_000_000; // o limite da Vercel para o corpo da requisição é 4,5 MB
const TIPOS = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "text/plain",
  "application/msword", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

export const POST = rota(comLogin(async (request, _q, u) => {
  if (u.modulos.contratacoes.nivel === "leitura") return erro("Seu acesso a Contratações é só de leitura.", 403);
  const tipo = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!TIPOS.has(tipo)) return erro("Tipo de arquivo não aceito. Use PDF, imagem (JPG, PNG), Word ou Excel.", 415);
  const buf = Buffer.from(await request.arrayBuffer());
  if (!buf.length) return erro("Arquivo vazio.", 400);
  if (buf.length > MAX_BYTES) return erro("O arquivo passa de 4 MB. Reduza o tamanho e tente de novo.", 413);
  let nome = "arquivo"; try { nome = decodeURIComponent(request.headers.get("x-nome") || "arquivo"); } catch {}
  const [a] = await consulta("insert into ct_arquivos (nome, tipo, tamanho, conteudo, enviado_por) values ($1, $2, $3, $4, $5) returning id",
    [nome.slice(0, 200), tipo, buf.length, buf, u.id]);
  return ok({ id: a.id, contentType: tipo, sizeBytes: buf.length }, 201);
}, { modulo: "contratacoes" }));

export const GET = rota(comLogin(async (_req, q, u) => {
  const id = q.get("id") || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return erro("Arquivo não encontrado.", 404);
  const [a] = await consulta("select nome, tipo, conteudo from ct_arquivos where id = $1", [id]);
  if (!a) return erro("Arquivo não encontrado.", 404);
  const nome = encodeURIComponent(a.nome || "arquivo");
  return new Response(a.conteudo, { headers: {
    "content-type": a.tipo, "cache-control": "private, no-store",
    "content-disposition": `attachment; filename*=UTF-8''${nome}`,
    "x-content-type-options": "nosniff", "content-security-policy": "sandbox" } });
}, { modulo: "contratacoes" }));
