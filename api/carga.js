// GET /api/carga → tudo o que o site precisa ao abrir, numa chamada só e em formato compacto:
//   colaboradores: [chapa, nome, funcao, base, centro_custo, sexo, setor, equipe, tipo_equipe, supervisor, coordenador]
//   gestores:      { CHAVE: "Nome completo" }
//   historico:     [chapa, data, item, item_texto, medida, dias, origem, doc_assinado_pendente, conta_reincidencia, motivo]
// Os dados pessoais ficam só no banco: o site não traz mais nada disso embutido.
// Quando o login entrar, esta rota passa a devolver só o que o perfil do usuário pode ver.
import { consulta, ok, rota } from "./_lib/db.js";

export const GET = rota(async () => {
  const [colabs, gestores, hist] = await Promise.all([
    consulta(`select c.chapa, c.nome, c.funcao, c.base, c.centro_custo, c.sexo,
                     e.setor, e.equipe, e.tipo_equipe, e.supervisor, e.coordenador
                from colaboradores c left join equipes e using (chapa)
               where c.ativo
               order by c.nome`),
    consulta("select chave, nome from gestores"),
    consulta(`select colaborador_chapa as chapa, to_char(data_ocorrido, 'YYYY-MM-DD') as data, desvio_principal as item,
                     item_texto, medida, dias, origem, doc_assinado_pendente, conta_reincidencia, relato
                from medidas
               where origem in ('planilha', 'ponto')
               order by data_ocorrido, id`)
  ]);
  return ok({
    colaboradores: colabs.map(c => [c.chapa, c.nome, c.funcao, c.base, c.centro_custo, c.sexo, c.setor, c.equipe, c.tipo_equipe, c.supervisor, c.coordenador]),
    gestores: Object.fromEntries(gestores.map(g => [g.chave, g.nome])),
    historico: hist.map(h => [h.chapa, h.data, h.item, h.item_texto, h.medida, h.dias, h.origem, h.doc_assinado_pendente, h.conta_reincidencia, h.relato])
  });
});
