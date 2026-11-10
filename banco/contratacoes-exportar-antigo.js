// EXPORTAR TUDO DO SITE DE CONTRATAÇÕES ANTIGO (o que roda no Claude / Artifact)
// Cole este trecho inteiro no Console do navegador, com o site antigo aberto e carregado
// (veja o passo a passo em banco/LEIA-ME.md). Ele baixa um .zip com:
//   dados.json     todos os documentos (candidatos, vagas, rm, config, talentos, talentosEd)
//   arquivos.json  tipo e nome de cada arquivo
//   arquivos/      currículos, certificados, documentos e RPs assinadas
// Só lê: não altera nada no site antigo.
(async () => {
  const COLS = ["candidatos", "vagas", "rm", "config", "talentos", "talentosEd"];
  if (typeof db === "undefined" || !db || typeof JSZip === "undefined") { console.error("Abra o console DENTRO do site de Contratações (no seletor de contexto do console, escolha o quadro do site) e espere ele carregar."); return; }
  const tudo = {}, ids = new Set(), ehId = s => typeof s === "string" && /^[0-9a-f]{32}$/.test(s);
  const varre = v => { if (ehId(v)) ids.add(v); else if (Array.isArray(v)) v.forEach(varre); else if (v && typeof v === "object") Object.values(v).forEach(varre); };
  for (const c of COLS) {
    let desliga; const snap = await new Promise((ok, erro) => { desliga = db.collection(c).onSnapshot(ok, erro); });
    if (desliga) desliga();
    tudo[c] = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
    varre(tudo[c]);
    console.log(`${c}: ${snap.docs.length} documentos`);
  }
  const zip = new JSZip(), meta = {};
  zip.file("dados.json", JSON.stringify(tudo));
  let n = 0, falhou = 0;
  for (const id of ids) {
    try {
      const r = await fetch("/_blob/" + id); if (!r.ok) throw new Error(r.status);
      const b = await r.blob(); zip.file("arquivos/" + id, b);
      meta[id] = { tipo: (r.headers.get("content-type") || b.type || "").split(";")[0].trim() };
      if (++n % 25 === 0) console.log(`arquivos: ${n}/${ids.size}`);
    } catch (e) { falhou++; }
  }
  // o nome original de cada arquivo está nos próprios documentos (campo "nome" junto do id)
  const nomes = {}; const acha = v => { if (Array.isArray(v)) v.forEach(acha); else if (v && typeof v === "object") { if (ehId(v.id) && v.nome) nomes[v.id] = v.nome; Object.values(v).forEach(acha); } };
  acha(tudo); for (const id in meta) if (nomes[id]) meta[id].nome = nomes[id];
  zip.file("arquivos.json", JSON.stringify(meta));
  console.log(`Pronto: ${n} arquivos${falhou ? `, ${falhou} não puderam ser baixados` : ""}. Gerando o zip…`);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "contratacoes-exportacao.zip"; a.click();
})();
