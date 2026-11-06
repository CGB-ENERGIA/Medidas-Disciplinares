// GET /api/carga → tudo o que o site precisa ao abrir, numa chamada só e em formato compacto:
//   colaboradores: [chapa, nome, funcao, base, centro_custo, sexo, setor, equipe, tipo_equipe, supervisor, coordenador, sexo_origem]
//   gestores:      { CHAVE: "Nome completo" }
//   historico:     [chapa, data, item, item_texto, medida, dias, origem, doc_assinado_pendente, conta_reincidencia, motivo]
//   solicitacoes:  [{ id, chapa, dados, nf, ni }]  (criadas no sistema; fotos e imagens vêm depois, em /api/solicitacoes?id=)
// Exige login e devolve só o que o perfil pode ver (supervisor: a equipe dele; coordenador: as equipes dele; DP: tudo).
import { consulta, rota } from "./_lib/db.js";
import { comLogin, escopoEquipe, ok } from "./_lib/auth.js";
import { listar } from "./solicitacoes.js";

export const GET = rota(comLogin(async (_req, _q, u) => {
  const pc = [], ph = [];
  const ondeC = escopoEquipe(u, pc), ondeH = escopoEquipe(u, ph);
  const [colabs, gestores, hist, sols] = await Promise.all([
    consulta(`select c.chapa, c.nome, c.funcao, c.base, c.centro_custo, c.sexo, c.sexo_origem,
                     e.setor, e.equipe, e.tipo_equipe, e.supervisor, e.coordenador
                from colaboradores c left join equipes e using (chapa)
               where c.ativo and ${ondeC}
               order by c.nome`, pc),
    consulta("select chave, nome from gestores"),
    consulta(`select m.colaborador_chapa as chapa, to_char(m.data_ocorrido, 'YYYY-MM-DD') as data, m.desvio_principal as item,
                     m.item_texto, m.medida, m.dias, m.origem, m.doc_assinado_pendente, m.conta_reincidencia, m.relato
                from medidas m left join equipes e on e.chapa = m.colaborador_chapa
               where m.origem in ('planilha', 'ponto') and ${ondeH}
               order by m.data_ocorrido, m.id`, ph),
    listar(u)
  ]);
  return ok({
    usuario: { nome: u.nome, perfil: u.perfil, chave: u.chave_pessoa },
    colaboradores: colabs.map(c => [c.chapa, c.nome, c.funcao, c.base, c.centro_custo, c.sexo, c.setor, c.equipe, c.tipo_equipe, c.supervisor, c.coordenador, c.sexo_origem]),
    gestores: Object.fromEntries(gestores.map(g => [g.chave, g.nome])),
    solicitacoes: sols,
    historico: hist.map(h => [h.chapa, h.data, h.item, h.item_texto, h.medida, h.dias, h.origem, h.doc_assinado_pendente, h.conta_reincidencia, h.relato])
  });
}));
