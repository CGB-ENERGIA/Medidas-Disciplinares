// GET /api/medidas → lista de medidas
// Filtros opcionais: ?chapa=12518  ?status=dp  ?origem=sistema|planilha|ponto  ?base=BCB
//                    ?supervisor=…  ?coordenador=…  ?desde=2026-01-01  ?limite=500
// Por enquanto só leitura. Criar e mudar status entram no próximo passo, junto com o login.
import { consulta, ok, erro, rota } from "./_lib/db.js";

const STATUS = ["coord", "dp", "aplicacao", "conferencia", "concluida", "recusada", "cancelada"];
const ORIGENS = ["sistema", "planilha", "ponto"];

export const GET = rota(async (_req, q) => {
  const onde = [], p = [];
  const add = (cond, valor) => { p.push(valor); onde.push(`${cond} $${p.length}`); };
  if (q.get("status") && !STATUS.includes(q.get("status"))) return erro("status inválido.");
  if (q.get("origem") && !ORIGENS.includes(q.get("origem"))) return erro("origem inválida.");
  if (q.get("desde") && !/^\d{4}-\d{2}-\d{2}$/.test(q.get("desde"))) return erro("desde deve ser AAAA-MM-DD.");

  if (q.get("chapa")) add("m.colaborador_chapa =", q.get("chapa"));
  if (q.get("status")) add("m.status =", q.get("status"));
  if (q.get("origem")) add("m.origem =", q.get("origem"));
  if (q.get("base")) add("c.base =", q.get("base"));
  if (q.get("supervisor")) add("e.supervisor =", q.get("supervisor"));
  if (q.get("coordenador")) add("e.coordenador =", q.get("coordenador"));
  if (q.get("desde")) add("m.data_ocorrido >=", q.get("desde"));
  const limite = Math.min(Math.max(parseInt(q.get("limite") || "500", 10) || 500, 1), 5000);
  p.push(limite);

  const linhas = await consulta(`
    select m.id::int as id, m.codigo, m.colaborador_chapa as chapa, c.nome, c.base, e.supervisor, e.coordenador,
           to_char(m.data_ocorrido, 'YYYY-MM-DD') as data, m.desvios, m.desvio_principal, m.item_texto,
           m.cidade, m.ponto_referencia, m.placa, m.relato, m.texto_fato, m.medida_sugerida, m.medida,
           m.medida_aprovada, m.alinea, m.dias, to_char(m.inicio_suspensao, 'YYYY-MM-DD') as inicio_suspensao,
           m.status, m.solicitante_perfil, m.origem, m.conta_reincidencia, m.doc_assinado_pendente,
           m.criado_em, m.atualizado_em
      from medidas m
      join colaboradores c on c.chapa = m.colaborador_chapa
      left join equipes e on e.chapa = m.colaborador_chapa
     ${onde.length ? "where " + onde.join(" and ") : ""}
     order by m.data_ocorrido desc, m.id desc
     limit $${p.length}`, p);
  return ok({ total: linhas.length, medidas: linhas });
});
