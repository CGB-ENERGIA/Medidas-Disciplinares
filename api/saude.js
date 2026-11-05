// GET /api/saude → confere se a API está no ar e falando com o banco.
// Público: não devolve nenhum dado (nem contagens).
import { consulta, ok, rota } from "./_lib/db.js";

export const GET = rota(async () => {
  await consulta("select 1");
  return ok({ status: "ok" });
});
