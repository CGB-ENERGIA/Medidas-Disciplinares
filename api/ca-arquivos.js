// Arquivos da Central Administrativa (PDF/XML das notas do Setor de TI).
//   POST /api/ca-arquivos   corpo = o próprio arquivo; tipo em Content-Type e nome em X-Nome → { id, url, contentType, sizeBytes }
//   GET  /api/ca-arquivos?id=…   baixa o arquivo (quem tem acesso à Central)
// Enviar: gestor do Setor de TI ou administrador.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, ok, erro } from "./_lib/auth.js";
import { temCentral } from "./_lib/ca.js";

const MAX_BYTES = 4_000_000; // limite da Vercel para o corpo da requisição: 4,5 MB
const TIPOS = new Set(["application/pdf", "text/xml", "application/xml", "image/jpeg", "image/png", "image/webp",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

export const POST = rota(comLogin(async (request, _q, u) => {
  const ti = u.modulos.ti;
  if (!u.admin && !(ti && ti.nivel === "gestor")) return erro("Só o gestor do Setor de TI envia arquivos.", 403);
  const tipo = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!TIPOS.has(tipo)) return erro("Tipo de arquivo não aceito. Use PDF, XML, imagem ou Excel.", 415);
  const buf = Buffer.from(await request.arrayBuffer());
  if (!buf.length) return erro("Arquivo vazio.", 400);
  if (buf.length > MAX_BYTES) return erro("O arquivo passa de 4 MB. Reduza o tamanho e tente de novo.", 413);
  let nome = "arquivo"; try { nome = decodeURIComponent(request.headers.get("x-nome") || "arquivo"); } catch {}
  const [a] = await consulta("insert into ca_arquivos (nome, tipo, tamanho, conteudo, enviado_por) values ($1, $2, $3, $4, $5) returning id",
    [nome.slice(0, 200), tipo, buf.length, buf, u.id]);
  return ok({ id: a.id, url: "/api/ca-arquivos?id=" + a.id, contentType: tipo, sizeBytes: buf.length }, 201);
}, { modulo: null }));

export const GET = rota(comLogin(async (_req, q, u) => {
  if (!temCentral(u)) return erro("Seu acesso não inclui a Central Administrativa.", 403);
  const id = q.get("id") || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return erro("Arquivo não encontrado.", 404);
  const [a] = await consulta("select nome, tipo, conteudo from ca_arquivos where id = $1", [id]);
  if (!a) return erro("Arquivo não encontrado.", 404);
  const nome = encodeURIComponent(a.nome || "arquivo");
  return new Response(a.conteudo, { headers: {
    "content-type": a.tipo, "cache-control": "private, no-store",
    "content-disposition": `inline; filename*=UTF-8''${nome}`,
    "x-content-type-options": "nosniff", "content-security-policy": "sandbox" } });
}, { modulo: null }));
