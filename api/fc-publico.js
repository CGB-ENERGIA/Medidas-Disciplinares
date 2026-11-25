// Fale Conosco público (sem login): o colaborador abre pelo celular, por link ou QR Code.
//   GET  /api/fc-publico                                        → { assuntos, faq } (só as dúvidas publicadas)
//   POST /api/fc-publico { acao:"chapa", chapa }                 → { nome (abreviado), base } para a pessoa confirmar que é ela
//   POST /api/fc-publico { acao:"abrir", chapa, assunto, mensagem, telefone? } → { protocolo }
//   POST /api/fc-publico { acao:"acompanhar", protocolo, chapa } → situação e resposta
// Os pedidos ficam em ca_docs, coleção fc_sol (área Atendimento): a Central lê, responde e muda a situação.
// Dados mínimos (LGPD): a página nunca recebe o nome completo, função ou telefone de ninguém.
import { createHash, randomInt } from "node:crypto";
import { consulta, rota, ok, erro } from "./_lib/db.js";
import { lerJSON, ipDe } from "./_lib/auth.js";
import { FC_ASSUNTOS, FC_FAQ_PADRAO } from "./_lib/fc.js";

const MAX_ABRIR_HORA = 5;      // pedidos por hora vindos do mesmo aparelho/rede
const MAX_ABERTOS_CHAPA = 5;   // pedidos ainda não resolvidos por chapa
const MAX_CHAPA_10MIN = 30;    // consultas de chapa por aparelho (memória da função)
const tentativas = new Map();

const hashIp = req => createHash("sha256").update("fc|" + (ipDe(req) || "?")).digest("hex").slice(0, 24);
const chapaOk = c => /^\d{1,10}$/.test(c);
const limpa = (s, n) => String(s || "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, n);
const PEQ = new Set(["de", "da", "do", "dos", "das", "e"]);
const cap = w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
function abreviado(nome) {
  const p = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "";
  return [cap(p[0]), ...p.slice(1).filter(w => !PEQ.has(w.toLowerCase())).map(w => w.charAt(0).toUpperCase() + ".")].join(" ");
}
const diaLocal = () => Math.floor((Date.now() - 3 * 3600e3) / 864e5); // dia no fuso de Brasília (mesmo formato da Central)
const ALF = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function novoProtocolo() {
  const d = new Date(Date.now() - 3 * 3600e3), aa = String(d.getUTCFullYear()).slice(2), mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  let s = ""; for (let i = 0; i < 5; i++) s += ALF[randomInt(ALF.length)];
  return "FC" + aa + mm + "-" + s;
}
function limiteChapa(req) {
  const k = hashIp(req), agora = Date.now(), l = (tentativas.get(k) || []).filter(t => agora - t < 600e3);
  l.push(agora); tentativas.set(k, l);
  if (tentativas.size > 5000) tentativas.clear();
  return l.length > MAX_CHAPA_10MIN;
}
async function colaborador(chapa) {
  const [c] = await consulta("select chapa, nome, base, funcao from colaboradores where chapa = $1 and ativo", [chapa]);
  return c || null;
}

export const GET = rota(async () => {
  const [d] = await consulta("select dados from ca_docs where colecao = 'fc_faq' and id = 'lista'");
  const f = d && d.dados ? d.dados : {};
  const assuntos = Array.isArray(f.assuntos) && f.assuntos.length ? f.assuntos : FC_ASSUNTOS;
  const faq = (Array.isArray(f.itens) ? f.itens : FC_FAQ_PADRAO).filter(x => x && x.pub !== false && x.p && x.r)
    .map(x => ({ id: x.id, as: x.as || "", p: x.p, r: x.r }));
  return Response.json({ assuntos, faq, aviso: f.aviso || "" }, { headers: { "cache-control": "public, max-age=60" } });
});

export const POST = rota(async request => {
  const c = await lerJSON(request); if (!c) return erro("Dados inválidos.", 400);
  const chapa = limpa(c.chapa, 10);

  if (c.acao === "chapa") {
    if (!chapaOk(chapa)) return erro("A chapa tem só números.", 400);
    if (limiteChapa(request)) return erro("Muitas consultas seguidas. Espere alguns minutos.", 429);
    const p = await colaborador(chapa);
    if (!p) return erro("Não encontramos essa chapa entre os colaboradores ativos. Confira o número no seu crachá ou contracheque.", 404);
    return ok({ nome: abreviado(p.nome), base: p.base || "" });
  }

  if (c.acao === "abrir") {
    if (!chapaOk(chapa)) return erro("Informe a sua chapa.", 400);
    const assunto = limpa(c.assunto, 60).toUpperCase(), mensagem = limpa(c.mensagem, 2000), tel = limpa(c.telefone, 20).replace(/[^\d()+\- ]/g, "");
    if (!assunto) return erro("Escolha o assunto.", 400);
    if (mensagem.length < 5) return erro("Escreva a sua dúvida ou pedido.", 400);
    if (tel && tel.replace(/\D/g, "").length < 10) return erro("O telefone precisa ter DDD e número (ou deixe em branco).", 400);
    const p = await colaborador(chapa);
    if (!p) return erro("Não encontramos essa chapa entre os colaboradores ativos.", 404);
    const iph = hashIp(request);
    const [{ n }] = await consulta("select count(*)::int as n from ca_docs where colecao = 'fc_sol' and dados->>'iph' = $1 and atualizado_em > now() - interval '1 hour'", [iph]);
    if (n >= MAX_ABRIR_HORA) return erro("Muitas solicitações enviadas daqui. Tente de novo daqui a uma hora.", 429);
    const [{ a }] = await consulta("select count(*)::int as a from ca_docs where colecao = 'fc_sol' and dados->>'chapa' = $1 and dados->>'st' <> 'RESOLVIDO'", [chapa]);
    if (a >= MAX_ABERTOS_CHAPA) return erro("Você já tem " + a + " solicitações em aberto. Acompanhe as que já enviou antes de abrir outra.", 429);
    const dados = { prot: "", chapa, nm: String(p.nome).toUpperCase(), b: p.base || "", fn: p.funcao || "", as: assunto, q: mensagem,
      tel, st: "NOVA", d: diaLocal(), criado: new Date().toISOString(), iph, org: "site" };
    for (let i = 0; i < 5; i++) {
      dados.prot = novoProtocolo();
      const r = await consulta("insert into ca_docs (colecao, id, dados) values ('fc_sol', $1, $2::jsonb) on conflict do nothing returning id", [dados.prot, JSON.stringify(dados)]);
      if (r.length) return ok({ protocolo: dados.prot }, 201);
    }
    return erro("Não foi possível gerar o protocolo. Tente de novo.", 500);
  }

  if (c.acao === "acompanhar") {
    const prot = limpa(c.protocolo, 20).toUpperCase().replace(/\s/g, "");
    if (!chapaOk(chapa) || !/^FC\d{4}-[A-Z0-9]{5}$/.test(prot)) return erro("Confira o protocolo (ex.: FC2611-AB3CD) e a chapa.", 400);
    if (limiteChapa(request)) return erro("Muitas consultas seguidas. Espere alguns minutos.", 429);
    const [d] = await consulta("select dados from ca_docs where colecao = 'fc_sol' and id = $1", [prot]);
    const s = d && d.dados;
    if (!s || s.chapa !== chapa) return erro("Não encontramos esse protocolo para essa chapa.", 404);
    return ok({ protocolo: s.prot, assunto: s.as, mensagem: s.q, situacao: s.st, aberto: s.criado, resposta: s.res || "", respondido: s.resp_em || "" });
  }

  return erro("Ação inválida.", 400);
});
