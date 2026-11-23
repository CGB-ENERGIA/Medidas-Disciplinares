// GET /api/ca-carga?area=financeiro|patrimonio|atendimento|ti → os dados da Central daquela área (JSON comprimido)
// Os dados ficam no banco (tabela ca_carga, gravada por "npm run central:banco"), nunca no arquivo do site.
// Cada pessoa recebe só a área a que tem acesso. Sem área: só o administrador (Central completa).
// O cabeçalho x-ca-acesso diz à tela quem é a pessoa e o nível dela na área.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, erro } from "./_lib/auth.js";
import { AREAS_CA, temCentral } from "./_lib/ca.js";

export const GET = rota(comLogin(async (_req, q, u) => {
  const pedida = (q.get("area") || "").toLowerCase();
  let area;
  if (AREAS_CA.includes(pedida)) {
    if (!u.modulos[pedida]) return erro("Seu acesso não inclui esta área da Central.", 403);
    area = pedida;
  } else if (!pedida && u.admin) area = "admin";
  else return erro(temCentral(u) ? "Área inválida." : "Seu acesso não inclui a Central Administrativa.", 403);

  const [c] = await consulta("select conteudo from ca_carga where area = $1", [area]);
  if (!c) return erro("Os dados da Central ainda não foram carregados no banco (npm run central:banco).", 404);
  const nivel = u.admin ? "gestor" : u.modulos[area].nivel;
  const acesso = encodeURIComponent(JSON.stringify({ id: u.id, nome: u.nome, admin: !!u.admin, area, nivel }));
  return new Response(c.conteudo, { headers: {
    "content-type": "application/json; charset=utf-8", "content-encoding": "gzip",
    "cache-control": "private, no-store", "x-ca-acesso": acesso } });
}, { modulo: null }));
