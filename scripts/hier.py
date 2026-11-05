D="artifact-files/20f25978-b702-4f16-b33e-c77d794c995b/index.html"
h=open(D,encoding="utf8").read()
def rep(a,b,n=1):
    global h
    c=h.count(a); assert c==n,(c,n,a[:80]); h=h.replace(a,b)
hier=open("hier.js",encoding="utf8").read()
rep('const colab = id => COLABS.find(c => c.id === id);','''// Estrutura de equipes (base-resumo do Gerenciador de Equipes · CGB): chapa → [setor, equipe, tipo de equipe, supervisor, coordenador/gestor]
'''+hier+'''const EXEMPLO_EQUIPE = { 1: ["GERE", "GERE", "GERE", "LUIS FILIPE", "ANTONIO MARCOS"], 2: ["GSTC", "Emerg 16h", "EMERG 16H", "DEILTON", "AFONSO"], 3: ["GERE", "GERE", "GERE", "LUIS FILIPE", "ANTONIO MARCOS"],
  4: ["GSTC", "Emerg 8h", "EMERG 8H", "JORDEN", "AFONSO"], 5: ["GOMAN", "Construção", "CONSTRUÇÃO", "GABRIEL", "RAFAELA"], 6: ["GSTC", "Emerg 8h", "EMERG 8H", "LEONARDO", "AFONSO"],
  7: ["GSTC", "Emerg 16h", "EMERG 16H", "HERMESSON", "PAULO"], 8: ["GERE", "GERE", "GERE", "LUIS FILIPE", "ANTONIO MARCOS"] };
COLABS.forEach(c => { const e = c.real ? HIER[c.mat] : EXEMPLO_EQUIPE[c.id]; if (e) [c.setor, c.equipe, c.tipoEquipe, c.sup, c.coord] = e; });
const nomeP = s => s ? s.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ") : "";
const nomeCoord = k => k ? (GESTORES[k] || nomeP(k)) : "";
function pessoasDoPerfil(role) {
  const campo = role === "supervisor" ? "sup" : role === "coordenador" ? "coord" : null; if (!campo) return [];
  const m = {}; COLABS.forEach(c => { const k = c[campo]; if (!k) return; const x = m[k] || (m[k] = { setores: new Set(), bases: new Set(), n: 0 }); x.setores.add(c.setor); x.bases.add(c.base); if (c.real) x.n++; });
  return Object.keys(m).sort().map(k => ({ k, nome: role === "coordenador" ? nomeCoord(k) : nomeP(k), desc: `${[...m[k].setores].join("/")} · ${[...m[k].bases].map(b => BASES[b] || b).join(", ")} · ${m[k].n} colaboradores` }));
}
function linhaEquipe(c) { return c && c.setor ? `${c.setor} · ${esc(c.equipe)}${c.sup ? ` · Supervisor: ${nomeP(c.sup)}` : ""}${c.coord ? ` · ${c.tipoEquipe === "Indireto" && !["AFONSO","PAULO","LUIS","CESAR","JACKSON","THIAGO","RAFAELA","MARCOS","ANTONIO MARCOS"].includes(c.coord) ? "Gestor" : "Coordenador"}: ${nomeCoord(c.coord)}` : ""}` : "Sem equipe na base de alocação"; }
const colab = id => COLABS.find(c => c.id === id);''')
rep('function veColab(c) { return !!c && veBase(c.base); }','''function veColab(c) {
  if (!c) return false;
  const p = state.pessoa;
  if (p && p.role === state.role) return p.role === "supervisor" ? c.sup === p.k : c.coord === p.k;
  return veBase(c.base);
}''')
rep('''        <button data-role="dp">DP</button>
      </div>
    </div>''','''        <button data-role="dp">DP</button>
      </div>
      <label class="pessoa" for="pessoa" hidden><span>Pessoa</span><select id="pessoa"></select></label>
    </div>''')
rep('  document.querySelectorAll("#roles button").forEach(b => b.setAttribute("aria-pressed", b.dataset.role === state.role));\n',
'''  document.querySelectorAll("#roles button").forEach(b => b.setAttribute("aria-pressed", b.dataset.role === state.role));
  { const ps = pessoasDoPerfil(state.role), sel = document.getElementById("pessoa");
    sel.closest("label").hidden = !ps.length || LOGIN_ATIVO;
    sel.innerHTML = `<option value="">Todos (demonstração)</option>` + ps.map(p => `<option value="${p.k}" ${state.pessoa && state.pessoa.k === p.k ? "selected" : ""}>${esc(p.nome)} · ${esc(p.desc)}</option>`).join(""); }
''')

# filtros por pessoa
rep('function minhasSup() { return REG.filter(r => !r.imp && (','function minhasSup() { return REG.filter(r => !r.imp && veReg(r) && (')
rep('function naoLidas() { const L = lidas(); return mensagens().filter(m => m.para === state.role && !L.has(m.id)).length; }','function naoLidas() { const L = lidas(); return mensagens().filter(m => m.para === state.role && veReg(m.r) && !L.has(m.id)).length; }')
rep('  const todas = mensagens().filter(m => qual === "entrada" ? m.para === state.role : m.de === state.role);','  const todas = mensagens().filter(m => (qual === "entrada" ? m.para === state.role : m.de === state.role) && veReg(m.r));')
# exibir equipe
rep('      <dt>Base · C. custo</dt><dd>${c.base} (${BASES[c.base]}) · ${c.cc}</dd>','      <dt>Base · C. custo</dt><dd>${c.base} (${BASES[c.base]}) · ${c.cc}</dd>\n      <dt>Equipe</dt><dd>${linhaEquipe(c)}</dd>')
rep('${esc(c.funcao)} · ${c.base} (${BASES[c.base]}) · ${esc(c.cc)}</p>','${esc(c.funcao)} · ${c.base} (${BASES[c.base]}) · ${esc(c.cc)}<br>${linhaEquipe(c)}</p>')
rep('"Centro de custo": c.cc || "", "Dados de exemplo"','"Centro de custo": c.cc || "", "Setor": c.setor || "", "Equipe": c.equipe || "", "Supervisor": nomeP(c.sup), "Coordenador / gestor": nomeCoord(c.coord), "Dados de exemplo"')
rep('"Cidade da base": BASES[c.base] || "", "Centro de custo": c.cc,','"Cidade da base": BASES[c.base] || "", "Centro de custo": c.cc, "Setor": c.setor || "", "Equipe": c.equipe || "", "Tipo de equipe": c.tipoEquipe || "", "Supervisor": nomeP(c.sup), "Coordenador / gestor": nomeCoord(c.coord),')
rep('  ["Colaboradores", "Chapa", "Matrícula. Cadastro sem documentos pessoais (sem CPF, RG, endereço ou telefone)."],','  ["Colaboradores", "Chapa", "Matrícula. Cadastro sem documentos pessoais (sem CPF, RG, endereço ou telefone)."],\n  ["Medidas e Colaboradores", "Setor / Equipe / Supervisor / Coordenador", "Estrutura de equipes da base do Gerenciador de Equipes. É ela que define o que cada pessoa vê quando o login estiver ativo."],')
# eventos
rep('if (b.dataset.role && !LOGIN_ATIVO) { state.msg = null;','if (b.dataset.role && !LOGIN_ATIVO) { state.pessoa = null; setTimeout(montarListaColab); state.msg = null;')
rep('  if (t.id === "per-ano") {','  if (t.id === "pessoa") { state.pessoa = t.value ? { role: state.role, k: t.value } : null; state.sel = null; state.msg = null; state.cartaoSup = null; montarListaColab(); render(); return; }\n  if (t.id === "per-ano") {')
css='''
/* Seletor de pessoa no cabeçalho */
.top .pessoa { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.top .pessoa span { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.8); }
.top .pessoa select { flex: 1; min-width: 0; max-width: 340px; background: rgba(255,255,255,0.14); color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 6px 8px; font-size: 13px; }
.top .pessoa select option { color: #2b2a2a; background: #ffffff; }
'''
rep('/* Tela de login e sessão */', css+'\n/* Tela de login e sessão */')
open(D,"w",encoding="utf8").write(h)
print("ok")
