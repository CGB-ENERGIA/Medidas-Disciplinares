s=open('app.html',encoding='utf-8').read()
def rep(a,b,c=1):
    global s
    assert s.count(a)==c,(s.count(a),a[:90]); s=s.replace(a,b)
# pages
rep("const PAGINAS=[\n","const PAGINAS=[\n {id:'portal',nm:'Visão Administrativo',sub:'Situação de todos os indicadores',ic:'home',g:'Administrativo'},\n {id:'catalogo',nm:'Catálogo de indicadores',sub:'Fórmula, meta e fonte de cada um',ic:'lista',g:'Administrativo'},\n {id:'ficha',nm:'Ficha do indicador',sub:'',ic:'painel',g:'Administrativo',hide:1},\n")
rep("const GRUPO_ICO={","const GRUPO_ICO={'Administrativo':'painel',")
rep("GRUPO_SUB={","GRUPO_SUB={'Administrativo':'Indicadores da CGB',")
rep("const pag=()=>{const h=location.hash.slice(1);return PAGS().find(p=>p.id===h)","const pag=()=>{const h=location.hash.slice(1);if(/^ind-\\d+$/.test(h))return PAGINAS.find(p=>p.id==='ficha');return PAGS().find(p=>p.id===h)")
rep("for(const p of PAGS()){let g=grupos","for(const p of PAGS().filter(p=>!p.hide)){let g=grupos")
rep("for(const p of PAGS())if(has(","for(const p of PAGS().filter(p=>!p.hide))if(has(")
# render titles
rep("$('tituloTop').textContent=p.g==='Fale Conosco'","$('tituloTop').textContent=p.g==='Administrativo'?'Administrativo':p.g==='Fale Conosco'")
rep("$('topAte').textContent=p.g==='Fale Conosco'","$('topAte').textContent=p.g==='Administrativo'?dt(Math.floor(GER0/864e5)):p.g==='Fale Conosco'")
rep("  ligar();renderRail();popularFiltros();renderAlertas();","  ligar();ligarPortal();renderRail();popularFiltros();renderAlertas();renderNav(p);")
rep("const ehPat=p.g!=='Hospedagem / Alimentação';","const ehPat=p.g!=='Hospedagem / Alimentação';document.body.classList.toggle('portal',p.g==='Administrativo');")
# top nav markup
rep('<div class="alertas" id="alertas" aria-label="Alertas"></div>','<nav class="tnav" id="tnav" aria-label="Seções do portal"></nav>\n<div class="alertas" id="alertas" aria-label="Alertas"></div>')
# alerts for portal
rep("  const p=pag(),L=[];\n  if(p.g==='Patrimônio')","  const p=pag(),L=[];\n  if(p.g==='Administrativo'){for(const i of INDS().filter(i=>i.st!=='ok'&&i.st!=='nd').sort((a,b)=>(a.st==='nao'?0:1)-(b.st==='nao'?0:1)))L.push({h:'#'+i.id,b:i.cod+' '+esc(i.nome),t:i.fv(i.v),c:i.st==='nao'?'var(--nao)':'var(--par)'});return L}\n  if(p.g==='Patrimônio')")
# ck: indicators
rep("  for(const p of PAGS().filter(p=>!p.hide))if(has(","  for(const i of INDS())if(has(i.cod+' '+i.nome+' '+i.tema))out.push({g:'Indicadores',ic:TEMA_ICO[i.tema],t:i.cod+' · '+i.nome,s:i.fv(i.v),go:()=>{location.hash=i.id}});\n  for(const p of PAGS().filter(p=>!p.hide))if(has(")
JS=open('portal.js',encoding='utf-8').read()
rep("/* ===== CENTRO DE COMANDO: alertas","/* ===== PORTAL DE INDICADORES ===== */\n"+JS+"\n/* ===== CENTRO DE COMANDO: alertas")
CSS=open('portal.css',encoding='utf-8').read()
i=s.index('</style></head>');s=s[:i]+CSS+s[i:]
open('app.html','w',encoding='utf-8').write(s);print('ok')
