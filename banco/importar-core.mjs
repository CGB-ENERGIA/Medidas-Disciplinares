// Lógica da importação dos CSVs da pasta dados/ para o banco.
// Recebe qualquer conexão com .query(sql, params) (pg ou PGlite), para poder ser testada sem o Neon.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { parse } from "csv-parse/sync";

const AQUI = dirname(fileURLToPath(import.meta.url));
export const DADOS = join(AQUI, "..", "dados");
export const SCHEMA = join(AQUI, "schema.sql");

const BASES = { BCB: "Bacabal", STI: "Santa Inês", PDT: "Presidente Dutra", PDS: "Pedreiras", ITM: "Itapecuru Mirim", BDC: "Barra do Corda" };

export function lerCSV(nome) {
  return parse(readFileSync(join(DADOS, nome)), { delimiter: ";", columns: true, bom: true, skip_empty_lines: true, trim: true });
}
const vazio = v => (v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim());
const inteiro = v => (vazio(v) === null ? null : parseInt(v, 10));
const simNao = v => String(v || "").trim().toLowerCase().startsWith("s");

// Insere em lotes de até 500 linhas: insert into t (cols) values (...), (...) [sufixo]
async function inserir(db, tabela, colunas, linhas, sufixo = "") {
  for (let i = 0; i < linhas.length; i += 500) {
    const lote = linhas.slice(i, i + 500), params = [];
    const valores = lote.map(l => `(${l.map(v => { params.push(v); return `$${params.length}`; }).join(", ")})`).join(", ");
    await db.query(`insert into ${tabela} (${colunas.join(", ")}) values ${valores} ${sufixo}`, params);
  }
  return linhas.length;
}
const upsert = (chave, colunas) => `on conflict (${chave}) do update set ${colunas.filter(c => c !== chave).map(c => `${c} = excluded.${c}`).join(", ")}`;

export async function criarTabelas(db) {
  await db.query(readFileSync(SCHEMA, "utf8"));
}

// Importa tudo numa transação: se algo falhar, o banco fica como estava.
export async function importar(db, log = console.log) {
  const colab = lerCSV("colaboradores.csv"), hist = lerCSV("historico_medidas_importado.csv");
  await db.query("begin");
  try {
    const r = {};
    r.bases = await inserir(db, "bases", ["sigla", "nome"], Object.entries(BASES), upsert("sigla", ["sigla", "nome"]));

    r.gestores = await inserir(db, "gestores", ["chave", "nome"],
      lerCSV("gestores.csv").map(x => [x.chave, x.nome]), upsert("chave", ["chave", "nome"]));

    const cDes = ["item", "descricao", "nivel", "medida_padrao", "medida_reincidencia", "alinea_sugerida"];
    r.desvios = await inserir(db, "desvios", cDes,
      lerCSV("anexo_I_desvios.csv").map(x => [inteiro(x.item), x.descricao, x.nivel, x.medida_padrao, x.medida_reincidencia, x.alinea_sugerida]), upsert("item", cDes));

    const cMod = ["categoria", "rotulo", "item", "alinea", "texto_modelo", "documentos_base"];
    r.modelos_texto_fato = await inserir(db, "modelos_texto_fato", cMod,
      lerCSV("modelos_texto_fato.csv").map(x => [x.categoria, x.rotulo, inteiro(x.item), vazio(x.alinea), x.texto_modelo, inteiro(x.documentos_base)]), upsert("categoria", cMod));

    r.municipios = await inserir(db, "municipios", ["nome"], lerCSV("municipios_MA.csv").map(x => [x.municipio]), "on conflict (nome) do nothing");

    // Frota: placas que saíram da planilha ficam inativas (não somem).
    const cFro = ["placa", "modelo", "tipo", "base", "prefixo", "ativo"];
    const frota = lerCSV("frota_ativa.csv").map(x => [x.placa, vazio(x.modelo), vazio(x.tipo), vazio(x.base), vazio(x.prefixo), true]);
    await db.query("update frota set ativo = false");
    r.frota = await inserir(db, "frota", cFro, frota, upsert("placa", cFro) + ", atualizado_em = now()");

    // Colaboradores: quem não está mais no cadastro fica inativo (o histórico continua).
    const cCol = ["chapa", "nome", "funcao", "base", "centro_custo", "ativo"];
    await db.query("update colaboradores set ativo = false");
    r.colaboradores = await inserir(db, "colaboradores", cCol,
      colab.map(x => [x.chapa, x.nome, vazio(x.funcao), vazio(x.base), vazio(x.centro_custo), true]), upsert("chapa", cCol) + ", atualizado_em = now()");

    const cEq = ["chapa", "setor", "equipe", "tipo_equipe", "supervisor", "coordenador"];
    r.equipes = await inserir(db, "equipes", cEq,
      colab.map(x => [x.chapa, vazio(x.setor), vazio(x.equipe), vazio(x.tipo_equipe), vazio(x.supervisor), vazio(x.coordenador)]), upsert("chapa", cEq) + ", atualizado_em = now()");

    // Histórico antigo das planilhas: importado uma única vez (é um arquivo que não muda).
    // Se já estiver no banco, não importa de novo, para não duplicar nem gastar números MD-xxxx.
    const jaTem = Number((await db.query("select count(*)::int as n from medidas where origem in ('planilha', 'ponto')")).rows[0].n);
    if (jaTem) { r.historico_importado = `já estava (${jaTem})`; await db.query("commit"); for (const [t, n] of Object.entries(r)) log(`  ${t.padEnd(22)} ${String(n).padStart(5)} linhas`); return r; }
    const cMed = ["colaborador_chapa", "data_ocorrido", "desvios", "desvio_principal", "item_texto", "relato", "texto_fato",
      "medida_sugerida", "medida", "dias", "status", "origem", "doc_assinado_pendente", "conta_reincidencia"];
    r.historico_importado = await inserir(db, "medidas", cMed, hist.map(x => {
      const item = inteiro(x.item);
      return [x.chapa, x.data, item ? [item] : [], item, vazio(x.item_texto), vazio(x.motivo), vazio(x.motivo),
        x.medida, x.medida, inteiro(x.dias), "concluida", x.origem, simNao(x.doc_assinado_pendente), simNao(x.conta_reincidencia)];
    }));

    await db.query("commit");
    for (const [t, n] of Object.entries(r)) log(`  ${t.padEnd(22)} ${String(n).padStart(5)} linhas`);
    return r;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

// Conferência depois da importação
export async function contar(db) {
  const t = ["bases", "gestores", "desvios", "modelos_texto_fato", "municipios", "frota", "colaboradores", "equipes", "usuarios", "medidas", "medidas_historico", "medidas_arquivos"];
  const out = {};
  for (const x of t) out[x] = Number((await db.query(`select count(*)::int as n from ${x}`)).rows[0].n);
  return out;
}
