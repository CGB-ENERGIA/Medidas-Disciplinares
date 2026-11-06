// GET /api/arquivo?id=N → baixa um arquivo de uma solicitação (ex.: documento assinado).
// Só para quem pode ver a solicitação (mesma regra de equipe do resto do sistema).
import { consulta, rota } from "./_lib/db.js";
import { comLogin, escopoEquipe, erro } from "./_lib/auth.js";

export const GET = rota(comLogin(async (_req, q, u) => {
  const id = parseInt(q.get("id") || "", 10); if (!id) return erro("Informe o id.", 400);
  const p = [id], onde = escopoEquipe(u, p);
  const [a] = await consulta(`
    select a.url, a.nome_arquivo
      from medidas_arquivos a join medidas m on m.id = a.medida_id left join equipes e on e.chapa = m.colaborador_chapa
     where a.id = $1 and ${onde}`, p);
  if (!a) return erro("Arquivo não encontrado.", 404);
  const m = /^data:([^;]+);base64,(.*)$/s.exec(a.url || "");
  if (!m) return erro("Arquivo indisponível.", 404);
  const nome = encodeURIComponent(a.nome_arquivo || "documento");
  return new Response(Buffer.from(m[2], "base64"), { headers: {
    "content-type": m[1], "cache-control": "private, no-store",
    "content-disposition": `attachment; filename*=UTF-8''${nome}`, "x-content-type-options": "nosniff" } });
}));
