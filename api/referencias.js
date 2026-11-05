// GET /api/referencias → tabelas de apoio que o site carrega ao abrir
// (bases, gestores, Anexo I, modelos de texto, municípios e frota ativa)
import { consulta, ok, rota } from "./_lib/db.js";

export const GET = rota(async () => {
  const [bases, gestores, desvios, modelos, municipios, frota] = await Promise.all([
    consulta("select sigla, nome from bases order by sigla"),
    consulta("select chave, nome from gestores order by chave"),
    consulta("select item, descricao, nivel, medida_padrao, medida_reincidencia, alinea_sugerida from desvios order by item"),
    consulta("select categoria, rotulo, item, alinea, texto_modelo from modelos_texto_fato order by categoria"),
    consulta("select nome from municipios order by nome"),
    consulta("select placa, modelo, tipo, base, prefixo from frota where ativo order by placa")
  ]);
  return ok({ bases, gestores, desvios, modelos, municipios: municipios.map(m => m.nome), frota });
});
