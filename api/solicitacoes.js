// Solicitações criadas no sistema: o fluxo supervisor → coordenador → DP → aplicação → arquivamento.
//   GET   /api/solicitacoes        → lista leve das que o usuário pode ver (sem fotos/imagens), para a tela se atualizar sozinha
//   GET   /api/solicitacoes?id=N → uma solicitação completa (com fotos e imagens do documento)
//   POST  /api/solicitacoes { dados } → cria (supervisor vai para o coordenador; coordenador e DP vão direto ao DP)
//   PATCH /api/solicitacoes { id, acao, de, dados, descricao?, arquivo? } → avança uma etapa ou salva a edição do DP
// O servidor confere: login, se o colaborador está na equipe de quem pede, se o perfil pode fazer a ação
// e se a solicitação ainda está na etapa que a tela viu (de); se outra pessoa já mexeu, devolve 409.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, escopoEquipe, lerJSON, ok, erro } from "./_lib/auth.js";

const MAX_DADOS = 4_000_000;   // a Vercel aceita até 4,5 MB por requisição
const MAX_ARQUIVO = 4_000_000; // documento assinado em base64 (cerca de 3 MB de arquivo)

// Quem pode fazer cada ação, a partir de qual etapa, e para qual etapa vai
const ACOES = {
  aprovar:  { de: ["coord"], para: "dp", pode: u => u.perfil === "coordenador" },
  recusar:  { de: ["coord"], para: "recusada", pode: u => u.perfil === "coordenador" },
  gerar:    { de: ["dp"], para: "aplicacao", pode: u => u.perfil === "dp" },
  aplicar:  { de: ["aplicacao"], para: "conferencia", pode: (u, m) => u.perfil === "dp" || u.perfil === m.solicitante_perfil },
  concluir: { de: ["conferencia"], para: "concluida", pode: u => u.perfil === "dp" },
  devolver: { de: ["conferencia"], para: "aplicacao", pode: u => u.perfil === "dp" },
  cancelar: { de: ["coord", "dp", "aplicacao", "conferencia"], para: "cancelada",
              pode: (u, m) => u.perfil === "dp" || (u.perfil === "coordenador" && m.status !== "coord")
                           || (u.perfil === m.solicitante_perfil && ["coord", "dp"].includes(m.status)) },
  editar:   { de: ["dp", "aplicacao"], para: null, pode: u => u.perfil === "dp" }
};

const dataISO = s => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s : null);
const texto = s => (s === undefined || s === null || s === "" ? null : String(s));

// Colunas consultáveis, tiradas do registro completo
function colunas(d) {
  const desvios = (Array.isArray(d.desvios) ? d.desvios : []).map(Number).filter(n => Number.isInteger(n) && n > 0);
  const dias = Number.isInteger(+d.dias) && +d.dias >= 1 && +d.dias <= 30 ? +d.dias : null;
  return [
    String(d.chapa || ""), dataISO(d.data), desvios, Number.isInteger(+d.principal) && +d.principal > 0 ? +d.principal : null,
    texto(d.cidade), texto(d.local), texto(d.placa), texto(d.relato), texto(d.texto), texto(d.sugerida), String(d.medida || ""),
    texto(d.medidaAprovada), d.al ? String(d.al).slice(0, 1) : null, dias, dataISO(d.inicio), d.modeloDoc === "pm" ? "pm" : "padrao",
    /^[MF]$/.test(d.sx || "") ? d.sx : null, texto(d.motivoRecusa), texto(d.motivoCancel), !!d.recusa
  ];
}
// $2…$21 na mesma ordem de colunas()
const SET_COLUNAS = `colaborador_chapa = $2, data_ocorrido = $3, desvios = $4, desvio_principal = (select item from desvios where item = $5),
  cidade = $6, ponto_referencia = $7, placa = $8, relato = $9, texto_fato = $10, medida_sugerida = $11, medida = $12,
  medida_aprovada = $13, alinea = $14, dias = $15, inicio_suspensao = $16, modelo_doc = $17, tratamento_sexo = $18,
  motivo_recusa = $19, motivo_cancelamento = $20, recusa_assinatura = $21`;

function validar(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return "Dados da solicitação inválidos.";
  if (!d.chapa) return "Escolha o colaborador.";
  if (!dataISO(d.data)) return "Informe a data do ocorrido.";
  if (!d.medida) return "A solicitação está sem medida.";
  if (JSON.stringify(d).length > MAX_DADOS) return "A solicitação ficou grande demais (fotos). Use menos fotos ou fotos menores.";
  return null;
}

// O colaborador existe, está ativo e é da equipe de quem pede?
async function colaboradorNoEscopo(u, chapa) {
  const p = [chapa], onde = escopoEquipe(u, p);
  const [c] = await consulta(`select 1 from colaboradores c left join equipes e using (chapa) where c.chapa = $1 and c.ativo and ${onde}`, p);
  return !!c;
}

// A solicitação, se o usuário pode vê-la
async function buscar(u, id, completa) {
  const p = [id], onde = escopoEquipe(u, p);
  const [m] = await consulta(`
    select m.id::int as id, m.status, m.solicitante_perfil, m.colaborador_chapa as chapa, ${completa ? "m.dados" : "null as dados"}
      from medidas m left join equipes e on e.chapa = m.colaborador_chapa
     where m.id = $1 and m.origem = 'sistema' and m.dados is not null and not m.exemplo and ${onde}`, p);
  return m || null;
}

// Lista leve (mesmo formato do /api/carga): sem fotos e imagens, com a contagem delas
export async function listar(u) {
  const p = [], onde = escopoEquipe(u, p);
  return consulta(`select m.id::int as id, m.colaborador_chapa as chapa, m.dados - 'fotos' - 'imagens' as dados,
                          coalesce(jsonb_array_length(case when jsonb_typeof(m.dados -> 'fotos') = 'array' then m.dados -> 'fotos' end), 0) as nf,
                          coalesce(jsonb_array_length(case when jsonb_typeof(m.dados -> 'imagens') = 'array' then m.dados -> 'imagens' end), 0) as ni,
                          to_char(m.atualizado_em, 'YYYY-MM-DD"T"HH24:MI:SS.US') as versao
                     from medidas m left join equipes e on e.chapa = m.colaborador_chapa
                    where m.origem = 'sistema' and m.dados is not null and not m.exemplo and ${onde}
                    order by m.id`, p);
}

const registrar = (id, u, acao) => consulta(
  "insert into medidas_historico (medida_id, usuario_id, usuario_nome, perfil, acao) values ($1, $2, $3, $4, $5)",
  [id, u.id, u.nome, u.perfil, String(acao || "").slice(0, 500)]);

export const GET = rota(comLogin(async (_req, q, u) => {
  if (!q.get("id")) return ok({ solicitacoes: await listar(u) });
  const id = parseInt(q.get("id"), 10); if (!id) return erro("id inválido.", 400);
  const m = await buscar(u, id, true); if (!m) return erro("Solicitação não encontrada.", 404);
  return ok({ id: m.id, chapa: m.chapa, dados: m.dados });
}));

export const POST = rota(comLogin(async (request, _q, u) => {
  const c = await lerJSON(request); const d = c && c.dados;
  const problema = validar(d); if (problema) return erro(problema, 400);
  if (!(await colaboradorNoEscopo(u, String(d.chapa)))) return erro("Este colaborador não é da sua equipe.", 403);
  const status = u.perfil === "supervisor" ? "coord" : "dp";
  const dados = { ...d, status, solicitante: u.perfil };
  delete dados.chapa; delete dados.principal;
  const [m] = await consulta(`
    insert into medidas (colaborador_chapa, data_ocorrido, desvios, desvio_principal, cidade, ponto_referencia, placa, relato, texto_fato,
                         medida_sugerida, medida, medida_aprovada, alinea, dias, inicio_suspensao, modelo_doc, tratamento_sexo,
                         motivo_recusa, motivo_cancelamento, recusa_assinatura, status, solicitante_perfil, solicitante_id, origem, dados)
    values ($1, $2, $3, (select item from desvios where item = $4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, 'sistema', $24)
    returning id::int as id`,
    [...colunas(d), status, u.perfil, u.id, JSON.stringify(dados)]);
  await registrar(m.id, u, c.descricao || "Solicitou");
  return ok({ id: m.id, status }, 201);
}));

export const PATCH = rota(comLogin(async (request, _q, u) => {
  const c = await lerJSON(request); if (!c || !c.id) return erro("Dados inválidos.", 400);
  const regra = ACOES[c.acao]; if (!regra) return erro("Ação inválida.", 400);
  const d = c.dados, problema = validar(d); if (problema) return erro(problema, 400);
  const m = await buscar(u, +c.id, false); if (!m) return erro("Solicitação não encontrada.", 404);
  if (m.status !== c.de) return erro("Esta solicitação foi alterada por outra pessoa. Recarregue a página para ver como ela está agora.", 409);
  if (!regra.de.includes(m.status)) return erro("Esta ação não vale para a etapa atual da solicitação.", 409);
  if (!regra.pode(u, m)) return erro("Seu perfil não pode fazer isto nesta solicitação.", 403);
  if (String(d.chapa) !== m.chapa && !(await colaboradorNoEscopo(u, String(d.chapa)))) return erro("Este colaborador não é da sua equipe.", 403);

  const status = regra.para || m.status;
  const extra = { status, solicitante: m.solicitante_perfil };
  if (c.arquivo) {
    if (c.acao !== "aplicar") return erro("Arquivo só vai junto com a aplicação.", 400);
    const url = String(c.arquivo.dataUrl || "");
    if (!/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/.test(url)) return erro("Use JPG, PNG ou PDF.", 400);
    if (url.length > MAX_ARQUIVO) return erro("O arquivo passa de 3 MB. Tire uma foto com menos resolução ou reduza o PDF.", 413);
    const [a] = await consulta(`insert into medidas_arquivos (medida_id, tipo, url, nome_arquivo, enviado_por)
                                values ($1, 'assinado', $2, $3, $4) returning id::int as id`,
      [m.id, url, String(c.arquivo.nome || "documento").slice(0, 200), u.id]);
    extra.anexoId = a.id;
  } else if (c.acao === "aplicar") return erro("Anexe a foto ou o PDF do documento assinado.", 400);

  const novos = { ...d, ...extra }; delete novos.chapa; delete novos.principal;
  // Fotos de quem solicitou não mudam depois do envio; imagens do documento só mudam quando a tela as manda
  const [r] = await consulta(`
    update medidas set ${SET_COLUNAS}, status = $22,
           status_antes = case when $22 = 'cancelada' then status else status_antes end,
           cancelado_em = case when $22 = 'cancelada' then now() else cancelado_em end,
           cancelado_por = case when $22 = 'cancelada' then $23 else cancelado_por end,
           dados = (coalesce(dados, '{}'::jsonb) || $24::jsonb) || jsonb_build_object('fotos', coalesce(dados -> 'fotos', '[]'::jsonb))
     where id = $1 and status = $25
     returning id`,
    [m.id, ...colunas(d), status, u.perfil, JSON.stringify(novos), m.status]);
  if (!r) return erro("Esta solicitação foi alterada por outra pessoa. Recarregue a página para ver como ela está agora.", 409);
  if (c.acao !== "editar") await registrar(m.id, u, c.descricao || c.acao);
  return ok({ salvo: true, status, ...(extra.anexoId ? { anexoId: extra.anexoId } : {}) });
}));
