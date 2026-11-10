// Adaptador do módulo Contratações.
// O site de Contratações foi feito para rodar dentro da plataforma do Artifact e usa quatro recursos dela:
//   db (coleções de documentos), assets (arquivos), downloads (salvar arquivo) e user (quem está usando).
// Este arquivo implementa esses mesmos nomes por cima da nossa API (/api/ct-docs, /api/ct-arquivos, /api/ct-nomes, /api/eu),
// para o código do módulo rodar sem mudanças grandes. Quem pode ler ou gravar o quê é decidido no servidor, não aqui.
(() => {
  const emb = window.parent !== window;           // dentro do site principal (iframe) ou aberto sozinho
  const pai = m => { try { if (emb) parent.postMessage(m, location.origin); } catch {} };
  const J = { "content-type": "application/json" };
  let visivel = true;

  if (emb) document.documentElement.classList.add("emb");
  const aplicarTema = t => document.documentElement.setAttribute("data-tema", t === "escuro" ? "escuro" : "claro");
  try { aplicarTema(localStorage.getItem("tema-medidas")); } catch { aplicarTema("claro"); }

  async function api(url, op) {
    const r = await fetch(url, { cache: "no-store", ...op });
    let d = {}; try { d = await r.json(); } catch {}
    if (r.status === 401) { pai({ tipo: "sessao" }); const e = new Error("Sua sessão terminou. Entre de novo."); e.code = "revoked"; throw e; }
    if (!r.ok) { const e = new Error(d.erro || `Erro ${r.status}`); e.code = r.status === 403 ? "negado" : r.status === 413 ? "grande" : "erro"; throw e; }
    return d;
  }

  // ---------- quem está usando (vem de /api/eu) ----------
  const PAPEL = { gestor: "rh", usuario: "sol", leitura: "ges" };   // Recrutamento, Solicitante, Gestão
  let acessoP = null;
  const acesso = () => acessoP || (acessoP = (async () => {
    const r = await fetch("/api/eu", { cache: "no-store" });
    if (r.status === 401) { pai({ tipo: "sessao" }); return null; }
    const eu = await r.json(), m = eu.modulos && eu.modulos.contratacoes;
    if (!m) return null;
    window.CT_ACESSO = { id: eu.id, nome: eu.nome, admin: !!eu.admin, nivel: m.nivel, papel: PAPEL[m.nivel], pessoa: m.nivel === "usuario" ? eu.nome : "" };
    return window.CT_ACESSO;
  })());

  // ---------- db: coleções de documentos ----------
  const cols = {};
  const C = nome => cols[nome] || (cols[nome] = { nome, mapa: new Map(), cursor: "0", ouvintes: new Set(), pronto: null });
  async function trazer(c) {                       // busca o que mudou desde o último cursor (em páginas)
    let mudou = false;
    for (let i = 0; i < 500; i++) {
      const d = await api(`/api/ct-docs?col=${c.nome}&desde=${c.cursor}`);
      for (const x of d.docs) { c.mapa.set(x.id, x.dados); mudou = true; }
      for (const id of d.removidos) if (c.mapa.delete(id)) mudou = true;
      c.cursor = d.proximo;
      if (!d.mais) break;
    }
    return mudou;
  }
  const iniciada = c => c.pronto || (c.pronto = trazer(c).catch(e => { c.pronto = null; throw e; }));
  const snap = lista => { const docs = lista.map(([id, d]) => ({ id, exists: true, data: () => ({ ...d }) })); return { docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) }; };
  const cmp = (a, b) => (a === b ? 0 : a == null ? -1 : b == null ? 1 : a < b ? -1 : 1);
  const teste = (v, op, x) => op === "==" ? v === x : op === "!=" ? v !== x : op === "in" ? x.includes(v) : op === "<" ? v < x : op === "<=" ? v <= x : op === ">" ? v > x : op === ">=" ? v >= x : op === "array-contains" ? Array.isArray(v) && v.includes(x) : false;
  const emitirUm = o => { try { o.cb(snap(o.q._lista())); } catch (e) { console.error(e); } };
  const emitir = c => c.ouvintes.forEach(emitirUm);

  class Consulta {
    constructor(c, f = [], ord = null, lim = 0) { this.c = c; this.f = f; this.ord = ord; this.lim = lim; }
    where(k, op, v) { return new Consulta(this.c, [...this.f, [k, op, v]], this.ord, this.lim); }
    orderBy(k, dir = "asc") { return new Consulta(this.c, this.f, [k, dir], this.lim); }
    limit(n) { return new Consulta(this.c, this.f, this.ord, n); }
    _lista() {
      let l = [...this.c.mapa].filter(([, d]) => this.f.every(([k, op, v]) => teste(d[k], op, v)));
      if (this.ord) { const [k, dir] = this.ord; l.sort((a, b) => cmp(a[1][k], b[1][k]) * (dir === "desc" ? -1 : 1)); }
      return this.lim ? l.slice(0, this.lim) : l;
    }
    async get() { await iniciada(this.c); return snap(this._lista()); }
    onSnapshot(cb, erro) {
      const o = { q: this, cb }; this.c.ouvintes.add(o);
      iniciada(this.c).then(() => { if (this.c.ouvintes.has(o)) emitirUm(o); }).catch(e => { if (erro) erro(e); });
      sondar();
      return () => this.c.ouvintes.delete(o);
    }
    doc(id) {
      const c = this.c;
      return {
        id,
        async get() { await iniciada(c); const d = c.mapa.get(id); return { id, exists: d !== undefined, data: () => (d ? { ...d } : undefined) }; },
        async set(obj) {                                   // a tela vê a mudança na hora; se o servidor recusar, volta como era
          const novo = JSON.parse(JSON.stringify(obj)), antes = c.mapa.get(id);
          c.mapa.set(id, novo); emitir(c);
          try { await api("/api/ct-docs", { method: "POST", headers: J, body: JSON.stringify({ col: c.nome, id, dados: novo }) }); }
          catch (e) { if (antes === undefined) c.mapa.delete(id); else c.mapa.set(id, antes); emitir(c); throw e; }
        },
        async delete() {
          const antes = c.mapa.get(id); c.mapa.delete(id); emitir(c);
          try { await api("/api/ct-docs", { method: "POST", headers: J, body: JSON.stringify({ col: c.nome, id, remover: true }) }); }
          catch (e) { if (antes !== undefined) c.mapa.set(id, antes); emitir(c); throw e; }
        }
      };
    }
  }
  const db = { collection: nome => new Consulta(C(nome)) };

  // Atualização: a cada 15 segundos (e ao voltar para a aba) busca só o que mudou nas coleções em uso
  let timer = null, sondando = false;
  async function sonda() {
    if (sondando || document.hidden || !visivel) return;
    sondando = true;
    try { for (const c of Object.values(cols)) if (c.ouvintes.size && c.pronto) { try { if (await trazer(c)) emitir(c); } catch {} } } finally { sondando = false; }
  }
  function sondar() { if (!timer) { timer = setInterval(sonda, 15000); document.addEventListener("visibilitychange", sonda); addEventListener("focus", sonda); } }

  // ---------- user, downloads, assets ----------
  const user = {
    id: async () => (await acesso()).id,
    can: async p => (p === "data.write" ? (await acesso()).nivel !== "leitura" : true),
    canEdit: async () => (await acesso()).nivel === "gestor",
    profiles: async ids => api("/api/ct-nomes?ids=" + ids.join(","))
  };
  const TIPOS = { pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", csv: "text/csv;charset=utf-8", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", jpg: "image/jpeg", png: "image/png" };
  const downloads = {
    async save({ filename, data }) {
      const ext = String(filename).split(".").pop().toLowerCase();
      const blob = data instanceof Blob ? data : new Blob([data], { type: TIPOS[ext] || "application/octet-stream" });
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = filename; a.style.display = "none"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000); return true;
    }
  };
  const assets = {
    async upload(blob, op = {}) {
      const tipo = op.type || blob.type || "application/octet-stream";
      const r = await fetch("/api/ct-arquivos", { method: "POST", headers: { "content-type": tipo, "x-nome": encodeURIComponent(blob.name || "arquivo") }, body: blob });
      let d = {}; try { d = await r.json(); } catch {}
      if (r.status === 401) pai({ tipo: "sessao" });
      if (!r.ok) throw new Error(d.erro || `Erro ${r.status}`);
      return d;                                           // { id, contentType, sizeBytes }
    }
  };

  window.claude = { use: async nome => { const a = await acesso(); if (!a) return null; return ({ db, user, downloads, assets, sample: null })[nome] || null; } };

  // ---------- conversa com o site principal ----------
  let ultima = "";
  window.__ctNotificar = () => { try { const v = state.view; if (v !== ultima) { ultima = v; pai({ tipo: "view", view: v }); } } catch {} };
  addEventListener("message", e => {
    if (e.origin !== location.origin) return;
    const m = e.data || {};
    if (m.tipo === "ir" && typeof ir === "function" && m.view && m.view !== state.view) ir(m.view);
    else if (m.tipo === "tema") aplicarTema(m.tema);
    else if (m.tipo === "visivel") { visivel = !!m.v; if (visivel) sonda(); }
  });
})();
