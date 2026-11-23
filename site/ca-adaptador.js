// Adaptador da Central Administrativa (central.html).
// A Central foi feita para rodar na plataforma do Artifact e usa recursos dela (db, user, assets, downloads).
// Este arquivo implementa esses nomes por cima da nossa API (/api/ca-carga, /api/ca-docs, /api/ca-arquivos),
// como o ct-adaptador.js faz para Contratações. Quem pode ler ou gravar o quê é decidido no servidor, não aqui.
//
// 1) Antes da página montar, busca (de forma síncrona) os dados da área aberta: central.html?area=financeiro|patrimonio|atendimento|ti
//    Os dados pessoais não ficam no arquivo do site; vêm do banco, só depois do login e só da área liberada.
(() => {
  const emb = window.parent !== window;
  const pai = m => { try { if (emb) parent.postMessage(m, location.origin); } catch {} };
  const J = { "content-type": "application/json" };
  const area = (new URLSearchParams(location.search).get("area") || "").toLowerCase();

  if (emb) {
    document.documentElement.classList.add("emb");
    // dentro do site principal: o logo e o nome já estão na barra de cima do site; aqui ficam só os botões
    // Mesmo padrão de Contratações: o menu e a barra de cima são os do site principal.
    // Aqui some o menu lateral vinho da Central, e a barra dela vira uma faixa clara só com as ferramentas.
    const st = document.createElement("style");
    st.textContent = [
      "html.emb{--rail-c:0px!important;--rail-x:0px!important}",
      "html.emb #rail,html.emb .rail-fundo,html.emb #hamb,html.emb header.top .marca,html.emb #b-tema,html.emb .topoCirc,html.emb header.top canvas{display:none!important}",
      "html.emb .wrap,html.emb body.rail-pin .wrap,html.emb body.rail-off .wrap{padding-left:24px!important;padding-right:24px!important}",
      "html.emb .tnav,html.emb .alertas,html.emb body.rail-pin .tnav,html.emb body.rail-pin .alertas{padding-left:24px!important}",
      "html.emb header.top,html.emb[data-tema=escuro] header.top{background:var(--surface)!important;background-image:none!important;border-bottom:1px solid var(--line)!important;box-shadow:none!important;color:var(--fg)!important}",
      "html.emb header.top::before,html.emb header.top::after{display:none!important}",
      "html.emb header.top .top-in{min-height:0!important;padding:10px 24px!important}",
      "html.emb header.top .top-dir{margin-left:auto}",
      "html.emb header.top .tbtn,html.emb header.top .cmd-btn{background:var(--surface)!important;border:1px solid var(--line)!important;color:var(--fg)!important;box-shadow:none!important;backdrop-filter:none!important}",
      "html.emb header.top .tbtn:hover,html.emb header.top .cmd-btn:hover{background:var(--sunken)!important}",
      "html.emb header.top .tbtn .ico,html.emb header.top .cmd-btn .ico,html.emb header.top .modo .ico{stroke:currentColor!important;color:inherit!important}",
      "html.emb header.top .tbtn.solid{background:var(--accent)!important;color:#fff!important;border-color:var(--accent)!important}",
      "html.emb header.top .cmd-btn kbd{background:var(--sunken)!important;color:var(--muted)!important;border-color:var(--line)!important}",
      "html.emb header.top .modo{background:var(--sunken)!important;border:1px solid var(--line)!important;box-shadow:none!important}",
      "html.emb header.top .modo button{color:var(--muted)!important;background:transparent!important}",
      "html.emb header.top .modo button[aria-pressed=true]{background:var(--surface)!important;color:var(--accent)!important;box-shadow:0 1px 3px rgba(0,0,0,.08)!important}",
      "html.emb header.top .atual span{color:var(--muted)!important}html.emb header.top .atual b{color:var(--fg)!important}",
      // mesmo layout das telas do site: sem caixa em volta, sem fundo próprio, encostado nas mesmas margens
      "html.emb,html.emb:not(#_) body{background:transparent!important;background-color:transparent!important;background-image:none!important}",
      "html.emb #fundoRede,html.emb body>canvas{display:none!important}",
      "html.emb header.top,html.emb[data-tema=escuro] header.top{background:transparent!important;border:0!important;position:static!important}",
      "html.emb header.top .top-in{padding:0 0 14px!important;max-width:none!important}",
      "html.emb .wrap,html.emb body.rail-pin .wrap,html.emb body.rail-off .wrap{padding:0 0 40px!important;max-width:none!important;margin:0!important}",
      "html.emb .tnav,html.emb .alertas,html.emb body.rail-pin .tnav,html.emb body.rail-pin .alertas{padding-left:0!important;padding-right:0!important}"
    ].join("\n");
    document.head.appendChild(st);
  }
  const aplicarTema = t => { if (t === "escuro") document.documentElement.setAttribute("data-tema", "escuro"); else document.documentElement.removeAttribute("data-tema"); };
  try { const t = localStorage.getItem("tema-medidas"); if (t) aplicarTema(t); } catch {}

  // ---------- carga da área (síncrona: a Central lê os dados logo ao abrir) ----------
  try {
    const x = new XMLHttpRequest();
    x.open("GET", "/api/ca-carga?area=" + encodeURIComponent(area), false);
    x.send();
    if (x.status === 200) {
      window.CA_CARGA = JSON.parse(x.responseText);
      try { window.CA_ACESSO = JSON.parse(decodeURIComponent(x.getResponseHeader("x-ca-acesso") || "")); } catch {}
    } else {
      if (x.status === 401) pai({ tipo: "sessao" });
      let m = "Não foi possível carregar os dados desta área."; try { m = JSON.parse(x.responseText).erro || m; } catch {}
      window.CA_ERRO = m;
    }
  } catch (e) { window.CA_ERRO = "Não foi possível carregar os dados desta área."; }
  if (window.CA_ERRO) {
    // sem dados a Central não monta: mostra o aviso no lugar dela
    window.CA_CARGA = null;
    document.addEventListener("DOMContentLoaded", () => {
      document.body.innerHTML = '<div style="font:15px system-ui,sans-serif;padding:48px 24px;text-align:center;color:#555"><b style="display:block;font-size:18px;color:#711424;margin-bottom:8px">Central Administrativa</b>' +
        String(window.CA_ERRO).replace(/</g, "&lt;") + "</div>";
    });
    return;
  }
  const A = window.CA_ACESSO || {};
  const podeEditar = !!(A.admin || A.nivel === "gestor");

  async function api(url, op) {
    const r = await fetch(url, { cache: "no-store", ...op });
    let d = {}; try { d = await r.json(); } catch {}
    if (r.status === 401) { pai({ tipo: "sessao" }); throw new Error("Sua sessão terminou. Entre de novo."); }
    if (!r.ok) throw new Error(d.erro || `Erro ${r.status}`);
    return d;
  }

  // ---------- db: documentos por caminho "colecao/id" ----------
  // Coleção → área dona (a mesma regra do servidor, api/_lib/ca.js). Fora da área aberta a tela nem pergunta ao servidor.
  const DONO = { hlan: "financeiro", loc_imv: "financeiro", loc_link: "financeiro", cfg: "financeiro", partes: "financeiro",
    fc_at: "atendimento", ti_notas: "ti", ti_cfg: "ti", ti_aquis: "ti", eqp: "admin", sug: "comum", faq: "comum" };
  const daArea = col => A.admin || DONO[col] === "comum" || DONO[col] === area;
  const parte = caminho => { const s = String(caminho), k = s.indexOf("/"); return [s.slice(0, k), s.slice(k + 1)]; };
  const snapDoc = (id, d) => ({ id, exists: d !== undefined && d !== null, data: () => (d ? { ...d } : undefined) });
  const q = (col, area) => `col=${encodeURIComponent(col)}&area=${encodeURIComponent(area)}`;
  const db = {
    doc(caminho) {
      const [col, id] = parte(caminho);
      return {
        id,
        async get() { if (!daArea(col)) return snapDoc(id, undefined); const d = await api(`/api/ca-docs?${q(col, area)}&id=${encodeURIComponent(id)}`); return snapDoc(id, d.existe ? d.dados : undefined); },
        async set(obj) { await api("/api/ca-docs", { method: "POST", headers: J, body: JSON.stringify({ area, col, id, dados: JSON.parse(JSON.stringify(obj)) }) }); },
        async delete() { await api("/api/ca-docs", { method: "POST", headers: J, body: JSON.stringify({ area, col, id, remover: true }) }); }
      };
    },
    collection(col) {
      return {
        async get() {
          if (!daArea(col)) return { docs: [], size: 0, empty: true, forEach() {} };
          const d = await api(`/api/ca-docs?${q(col, area)}`);
          const docs = d.docs.map(x => snapDoc(x.id, x.dados));
          return { docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) };
        },
        doc: id => db.doc(col + "/" + id)
      };
    }
  };

  // ---------- user, downloads, assets ----------
  const user = {
    id: async () => A.id,
    canEdit: async () => podeEditar,
    can: async () => true,      // todos com acesso à área podem mandar sugestões; o servidor confere o resto
    profiles: async ids => api("/api/ca-docs?nomes=" + ids.map(encodeURIComponent).join(","))
  };
  const TIPOS = { pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", csv: "text/csv;charset=utf-8", png: "image/png", jpg: "image/jpeg", json: "application/json", txt: "text/plain" };
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
      const r = await fetch("/api/ca-arquivos?area=" + encodeURIComponent(area), { method: "POST", headers: { "content-type": tipo, "x-nome": encodeURIComponent(blob.name || "arquivo") }, body: blob });
      let d = {}; try { d = await r.json(); } catch {}
      if (r.status === 401) pai({ tipo: "sessao" });
      if (!r.ok) throw new Error(d.erro || `Erro ${r.status}`);
      return d;                                            // { id, url, contentType, sizeBytes }
    }
  };

  window.claude = { use: async nome => ({ db, user, downloads, assets, sample: null })[nome] || null };

  // ---------- conversa com o site principal ----------
  // A Central manda a lista das telas da área (o site monta o menu dele com ela) e avisa a tela aberta.
  const menuDaArea = () => {
    try {
      return PAGS().filter(p => !p.hide && (p.g !== "Equipe" || (typeof caAdm === "function" && caAdm())))
        .map(p => [p.id, p.nm, p.sub || "", ico(p.ic), p.g === "Ajuda" ? "Ajuda" : p.g === "Equipe" ? "Equipe" : p.g]);
    } catch { return []; }
  };
  let ultMenu = "";
  const avisar = () => {
    const itens = menuDaArea(), k = JSON.stringify(itens.map(i => i[0]));
    if (k !== ultMenu && itens.length) { ultMenu = k; pai({ tipo: "ca-menu", area, itens }); }
    let v = ""; try { const p = pag(); v = p.pai || p.id; } catch {}
    pai({ tipo: "ca-view", area, view: v });
  };
  addEventListener("hashchange", () => setTimeout(avisar, 0));
  addEventListener("click", () => setTimeout(avisar, 400));   // ex.: trocar "Ver como" no TI muda as telas do menu
  addEventListener("load", () => { setTimeout(avisar, 300); setTimeout(avisar, 2500); setTimeout(avisar, 6000); });
  addEventListener("message", e => {
    if (e.origin !== location.origin) return;
    const m = e.data || {};
    if (m.tipo === "tema") aplicarTema(m.tema);
    else if (m.tipo === "ir" && m.view && location.hash.slice(1) !== m.view) location.hash = m.view;
  });
})();
