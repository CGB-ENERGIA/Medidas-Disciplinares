// GET /api/saude → confere se a API está no ar e falando com o banco
import { consulta, ok, rota } from "./_lib/db.js";

export const GET = rota(async () => {
  const [r] = await consulta(`select now() as agora,
    (select count(*)::int from colaboradores where ativo) as colaboradores_ativos,
    (select count(*)::int from medidas) as medidas`);
  return ok({ status: "ok", ...r });
});
