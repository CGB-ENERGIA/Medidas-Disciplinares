/* ===================== SETOR DE TI · CONTROLE DE CUSTOS ===================== */
const TI_SEED=RAW.ti||{notas:[],forn:{},bases:[],contratos:[],gerenciais:[]};
let TI_DB={},TI_CFG=Object.assign({meta:null,grupos:[],forn:{}},JSON.parse(JSON.stringify(TI_SEED.cfg||{}))),TI_VER=1,TI_CACHE=null,TI_CK='';
let TIF={mes:'',ct:'',base:'',setor:'',forn:'',st:'',q:'',n:20};
let TIE=null,TIE_MSG='',TIE_LENDO=false,ASSETS=null,SAMPLE=null;
const TI_SETORES=['ADMINISTRATIVO','GOMAN','GSTC','GERE','SPOT STI','SPOT BDC'];
const TI_ST={nd:{t:'Não informado',c:'nd'},aguardando:{t:'Em andamento (sem nota)',c:'par'},comigo:{t:'Nota comigo',c:'info'},entregue:{t:'Entregue ao financeiro',c:'sup'}};
const TI_ST_ORD=['aguardando','comigo','entregue','nd'];
const tiFornNome=n=>(n.cnpj&&(TI_CFG.forn[n.cnpj]||TI_SEED.forn[n.cnpj]))||n.forn||n.razao||'Sem fornecedor';
const tiD=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'–';
const tiMesN=m=>m?MES3[+m.slice(5,7)-1]+'/'+m.slice(2,4):'–';
const tiNum=v=>{if(typeof v==='number')return v;let t=String(v||'').replace(/[^\d,.-]/g,'');if(t.includes(','))t=t.replace(/\./g,'').replace(',','.');const x=parseFloat(t);return isFinite(x)?x:0};
const tiId=()=>'N'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function tiNotas(){
  const k=TI_VER;if(TI_CACHE&&TI_CK===k)return TI_CACHE;
  const m=new Map(TI_SEED.notas.map(n=>[n.id,n]));for(const [id,n] of Object.entries(TI_DB)){if(n&&n.del)m.delete(id);else if(n)m.set(id,n)}
  const L=[...m.values()].map(n=>{const it=(n.itens||[]).map(i=>{const dq=(i.dest||[]).reduce((s,d)=>s+(+d.q||0),0);return Object.assign({},i,{semQ:Math.max(0,(+i.qtd||0)-dq)})});
    const semV=it.reduce((s,i)=>s+(i.qtd?i.vt*i.semQ/i.qtd:0),0);
    return Object.assign({},n,{itens:it,fornN:tiFornNome(n),semV,total:+n.total||it.reduce((s,i)=>s+(+i.vt||0),0),meses:(n.parc||[]).map(p=>p.mes)})});
  L.sort((a,b)=>(b.emissao||b.meses[0]||'').localeCompare(a.emissao||a.meses[0]||''));
  TI_CACHE=L;TI_CK=k;return L}
function tiFiltra(L,o={}){const q=TIF.q.trim().toUpperCase();
  return L.filter(n=>(!TIF.mes||n.meses.includes(TIF.mes)||(n.emissao||'').startsWith(TIF.mes))&&(!TIF.forn||n.fornN===TIF.forn)&&(o.semSt||!TIF.st||n.st===TIF.st)&&
    (!TIF.ct||n.itens.some(i=>(i.dest||[]).some(d=>d.ct===TIF.ct)))&&(!TIF.base||n.itens.some(i=>(i.dest||[]).some(d=>d.base===TIF.base)))&&(!TIF.setor||n.itens.some(i=>(i.dest||[]).some(d=>d.setor===TIF.setor)))&&
    (!q||(n.num+' '+n.fornN+' '+(n.razao||'')+' '+n.itens.map(i=>i.desc).join(' ')).toUpperCase().includes(q)))}
/* linhas de destino: cada parte de cada item, com valor proporcional */
function tiDestinos(L){const out=[];for(const n of L)for(const i of n.itens){const vu=i.qtd?i.vt/i.qtd:0;
  for(const d of (i.dest||[]))if(+d.q>0)out.push({n,i,q:+d.q,v:vu*d.q,ct:d.ct||'',base:d.base||'',setor:d.setor||''});
  if(i.semQ>0)out.push({n,i,q:i.semQ,v:vu*i.semQ,ct:'',base:'',setor:'',sem:1})}
  return out.filter(x=>(!TIF.ct||x.ct===TIF.ct)&&(!TIF.base||x.base===TIF.base)&&(!TIF.setor||x.setor===TIF.setor))}
function tiGastoMes(L){const m={};for(const n of L)for(const p of (n.parc||[]))m[p.mes]=(m[p.mes]||0)+(+p.v||0);return m}
function tiCtMes(T,mes){const r={};for(const n of T){const v=(n.parc||[]).filter(p=>p.mes===mes).reduce((s,p)=>s+(+p.v||0),0);if(!v)continue;
  const it=n.itens,tot=it.reduce((s,i)=>s+(+i.vt||0),0)||1;const por={};
  for(const i of it){const vu=i.qtd?i.vt/i.qtd:0;let dq=0;for(const d of (i.dest||[])){por[d.ct||'']=(por[d.ct||'']||0)+vu*(+d.q||0);dq+=+d.q||0}if((+i.qtd||0)>dq)por['']=(por['']||0)+vu*((+i.qtd||0)-dq)}
  for(const [c,x] of Object.entries(por))r[c]=(r[c]||0)+v*x/tot}return r}
const tiGrupoDe=c=>(TI_CFG.grupos||[]).find(g=>g.cts.includes(c));
const tiMetaMes=()=>TI_CFG.meta!=null&&TI_CFG.meta!==''?+TI_CFG.meta:null;
const tiMesAtual=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
function tiListas(){const L=tiNotas();const u=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const d=L.flatMap(n=>n.itens.flatMap(i=>i.dest||[]));
  return {forn:u(L.map(n=>n.fornN)),setor:TI_SETORES.slice(),base:u([...TI_SEED.bases,...d.map(x=>x.base)]),ct:u([...TI_SEED.contratos,...d.map(x=>x.ct)]),mes:u(L.flatMap(n=>n.meses)).reverse(),ger:u([...TI_SEED.gerenciais,...L.map(n=>n.ger)])}}
let TI_FOPEN=false;
const TI_FL={mes:'Mês',ct:'Contrato',base:'Base',setor:'Setor',forn:'Fornecedor',st:'Situação'};
const tiNF=()=>Object.keys(TI_FL).filter(k=>TIF[k]).length;
function tiFBtn(){const n=tiNF();return '<button type="button" class="tifbtn'+(TI_FOPEN?' on':'')+'" data-tifab aria-expanded="'+TI_FOPEN+'"><svg class="ico" viewBox="0 0 24 24"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/></svg>Filtros'+(n?'<span class="ufn">'+n+'</span>':'')+'</button>'}
function tiHead(tit,sub,icn,sec,filtro){const n=tiNF();return '<div class="ubar'+(filtro?' tif':'')+'"><div class="ubar-l"><span class="ubar-ic">'+ico(icn)+'</span><div class="ubar-t"><span class="ubar-tag">Setor de TI · '+(sec||'Controle de Custos')+'</span><h2>'+tit+'</h2><span>'+sub+'</span></div></div>'+
  (filtro?'<div class="ubar-r"><button type="button" class="tifbtn'+(TI_FOPEN?' on':'')+'" data-tifab aria-expanded="'+TI_FOPEN+'"><svg class="ico" viewBox="0 0 24 24"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/></svg>Filtros'+(n?'<span class="ufn">'+n+'</span>':'')+'</button></div>':'')+'</div>'+(filtro?tiFiltros():'')}
let TIF_D=null;
function tiFiltros(){const Ls=tiListas(),n=tiNF();
  const chips=n?'<div class="tichips">'+Object.keys(TI_FL).filter(k=>TIF[k]).map(k=>'<span class="chipf"><small>'+TI_FL[k]+'</small>'+esc(k==='mes'?tiMesN(TIF[k]):k==='st'?TI_ST[TIF[k]].t:TIF[k])+'<button type="button" data-tirmf="'+k+'" aria-label="Remover filtro">×</button></span>').join('')+'<button type="button" class="tilimpa" data-tilimpa>Limpar tudo</button></div>':'';
  if(!TI_FOPEN)return chips;
  const D=TIF_D||(TIF_D=Object.assign({},TIF));
  const nomeMes=m=>MESES[+m.slice(5)-1].toLowerCase()+'/'+m.slice(0,4);
  const sel=(k,vals,lab,todos)=>'<label><small>'+TI_FL[k]+'</small><select data-tifd="'+k+'"><option value="">'+(todos||'Todos')+'</option>'+vals.map(v=>'<option value="'+esc(v)+'"'+(D[k]===v?' selected':'')+'>'+esc(lab?lab(v):v)+'</option>').join('')+'</select></label>';
  return chips+'<div class="tigav-fundo" data-tifecha></div><aside class="tigav" role="dialog" aria-label="Filtros"><div class="tigav-h"><h3>Filtros</h3><button type="button" class="tigav-x" data-tifecha aria-label="Fechar">×</button></div><div class="tigav-b">'+
    '<p class="tigav-s">Período</p>'+sel('mes',Ls.mes,nomeMes,'Todos os meses')+
    '<p class="tigav-s">Contrato e local</p>'+sel('ct',Ls.ct)+sel('base',Ls.base,null,'Todas')+sel('setor',Ls.setor)+
    '<p class="tigav-s">Compras</p>'+sel('forn',Ls.forn)+sel('st',TI_ST_ORD,v=>TI_ST[v].t,'Todas')+
    '<p class="tigav-n">Com contrato, base ou setor, as listas e o gráfico mostram as compras que tiveram material para eles. O destaque do mês calcula só a parte do contrato escolhido.</p></div>'+
    '<div class="tigav-p"><button type="button" class="btn" data-tifl>Limpar</button><button type="button" class="btn primary" data-tifok>Ver resultado</button></div></aside>'}
function tiBar(o={}){const Ls=tiListas();const sel=(k,t,vals,lab)=>'<label><small>'+t+'</small><select data-tif="'+k+'"'+(TIF[k]?' class="on"':'')+'><option value="">Todos</option>'+vals.map(v=>'<option value="'+esc(v)+'"'+(TIF[k]===v?' selected':'')+'>'+esc(lab?lab(v):v)+'</option>').join('')+'</select></label>';
  return '<div class="pfbar tibar">'+sel('mes','Mês',Ls.mes,tiMesN)+sel('ct','Contrato',Ls.ct)+sel('base','Base',Ls.base)+sel('setor','Setor',Ls.setor)+sel('forn','Fornecedor',Ls.forn)+
    (o.st?sel('st','Situação da nota',TI_ST_ORD,v=>TI_ST[v].t):'')+'<label class="tibusca"><small>Buscar</small><input type="search" data-tif="q" value="'+esc(TIF.q)+'" placeholder="Nº da nota, produto, fornecedor…"></label>'+
    (Object.keys(TIF).some(k=>k!=='n'&&TIF[k])?'<button type="button" class="btn" data-tilimpa>Limpar</button>':'')+'</div>'}
const tiSt=st=>'<span class="tst '+(TI_ST[st]||TI_ST.nd).c+'"><i></i>'+(TI_ST[st]||TI_ST.nd).t+'</span>';
let TI_VER_COMO='';
const tiPodeTrocar=()=>!DBX||CAN_EDIT;
const tiPerfil=()=>(DBX&&!CAN_EDIT)?'financeiro':(TI_VER_COMO||'compras');
const tiPode=()=>tiPerfil()==='compras';const tiGrava=()=>!!(DBX&&CAN_EDIT&&tiPode());
function tiPerfilHTML(){const p=tiPerfil();
  if(!tiPodeTrocar())return '<span class="tiperf fin">'+ico('olho')+' Perfil Financeiro · somente consulta</span>';
  return '<div class="tiseg sm tiperfs" role="group" aria-label="Ver como"><span>Ver como:</span><button type="button" data-tiperf="compras" class="'+(p==='compras'?'on':'')+'">Compras</button><button type="button" data-tiperf="financeiro" class="'+(p==='financeiro'?'on':'')+'">Financeiro</button></div>'}
/* ---------- painel (enxuto) ---------- */
let TI_VISAO='base',TI_METAED=false;
PG['ti-custos']=()=>{
  const T=tiFiltra(tiNotas()),gm=tiGastoMes(T),ma=TIF.mes||tiMesAtual();let meta=tiMetaMes(),vMes=gm[ma]||0,metaLab='';
  if(TIF.ct){const g=tiGrupoDe(TIF.ct);vMes=tiCtMes(T,ma)[TIF.ct]||0;meta=g&&g.meta?g.meta:null;metaLab=g?' ('+g.nome+')':''}
  const pc=meta?vMes/meta:null;
  const meses=Object.keys(gm).filter(m=>m.startsWith('2026')).sort();
  const aEntregar=T.filter(n=>n.st==='comigo'||n.st==='aguardando'),semD=T.filter(n=>n.semV>0.01);
  const cor=pc==null?'nd':pc>1?'nao':pc>.9?'par':'ok';
  const cm=tiCtMes(T,ma),gs=(TI_CFG.grupos||[]).filter(g=>!TIF.ct||g.cts.includes(TIF.ct));const semCt=Object.entries(cm).filter(([c])=>!tiGrupoDe(c)).reduce((s,[,v])=>s+v,0);
  const gruposHTML=gs.length?'<div class="tigr">'+gs.map(g=>{const v=g.cts.reduce((s,c)=>s+(cm[c]||0),0),p=g.meta?v/g.meta:null,c=p==null?'nd':p>1?'nao':p>.9?'par':'ok';
    return '<div class="tigr-c '+c+'"><div class="tigr-h"><b>'+esc(g.nome)+'</b><span>'+Rk(v)+(g.meta?' de '+Rk(g.meta):'')+'</span></div><div class="tigr-bar"><i style="width:'+Math.min(100,100*(p||0))+'%"></i></div><small>'+(g.meta?P(p)+' da meta · '+(g.meta>=v?'sobram '+Rk(g.meta-v):'passou '+Rk(v-g.meta)):'sem meta')+'</small></div>'}).join('')+
    (semCt>0.5?'<div class="tigr-c nd"><div class="tigr-h"><b>Sem contrato</b><span>'+Rk(semCt)+'</span></div><small>itens deste mês sem contrato informado</small></div>':'')+'</div>':'';
  const hero='<div class="tihero '+cor+'"><div class="tihero-l"><span class="tihero-tag">'+ico('moeda')+' Setor de TI · Controle de Custos · Painel de custos</span><span class="tihero-k">Gasto de '+MESES[+ma.slice(5)-1].toLowerCase()+(TIF.ct?' · contrato '+esc(TIF.ct):'')+(tiNF()&&!TIF.ct?' · com filtro':'')+'</span><b>'+Rk(vMes)+'</b>'+
    (meta?'<div class="tihero-bar"><i style="width:'+Math.min(100,100*pc)+'%"></i></div><span class="tihero-s">'+P(pc)+' da meta de '+Rk(meta)+metaLab+' · '+(meta>=vMes?'sobram '+Rk(meta-vMes):'passou '+Rk(vMes-meta))+'</span>':'<span class="tihero-s">Meta mensal ainda não definida</span>')+'</div>'+
    '<div class="tihero-a">'+tiPerfilHTML()+tiFBtn()+(tiPode()?'<button type="button" class="tihbtn" data-timetaab>'+(meta?'Mudar meta':'Definir meta')+'</button>':'')+'</div></div>'+tiFiltros()+gruposHTML+
    (TI_METAED?'<div class="panel timeta"><label><small>Meta mensal total (R$)</small><input type="text" inputmode="decimal" data-timeta="geral" value="'+(meta!=null?nf2.format(meta):'')+'" placeholder="ex.: 8.000,00"></label>'+(TI_CFG.grupos||[]).map((g,k)=>'<label><small>'+esc(g.nome)+' (R$)</small><input type="text" inputmode="decimal" data-timetag="'+k+'" value="'+(g.meta?nf2.format(g.meta):'')+'"></label>').join('')+'<button type="button" class="btn primary" data-timetasalva>Salvar</button><button type="button" class="btn" data-timetaab>Cancelar</button></div>':'');
  const mini=(h,t,v,sub,c)=>'<a class="timini '+c+'" href="#'+h+'"><span>'+t+'</span><b>'+v+'</b><small>'+sub+'</small></a>';
  const cards='<div class="timinis">'+mini('ti-notas" data-tinvis="situacao','Notas a entregar ao financeiro',N(aEntregar.length),aEntregar.length?Rk(aEntregar.reduce((s,n)=>s+n.total,0))+' em notas':'tudo em dia',aEntregar.length?'par':'ok')+
    mini('ti-custos" data-tirola="1','Compras sem destino',N(semD.length),semD.length?Rk(semD.reduce((s,n)=>s+n.semV,0))+' sem destino':'tudo com destino',semD.length?'par':'ok')+
    mini('ti-notas" data-tinvis="lista','Gasto em 2026',Rk(meses.reduce((s,m)=>s+(gm[m]||0),0)),'média de '+Rk(meses.length?meses.reduce((s,m)=>s+(gm[m]||0),0)/meses.length:0)+' por mês','nd')+'</div>';
  const col=meses.map(m=>({k:m,l:MES3[+m.slice(5)-1],t:MESES[+m.slice(5)-1],v:gm[m]||0,meta:meta||undefined}));
  const D=tiDestinos(T),agr=f=>{const m=new Map();for(const x of D){const k=f(x)||'Sem destino';m.set(k,(m.get(k)||0)+x.v)}const a=[...m].map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
    if(a.length>5){const r=a.slice(4).reduce((s,x)=>s+x.v,0);return a.slice(0,4).concat([{k:'Outros ('+(a.length-4)+')',v:r}])}return a};
  const fo=()=>{const m=new Map();T.forEach(n=>m.set(n.fornN,(m.get(n.fornN)||0)+n.total));const a=[...m].map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);if(a.length>5){const r=a.slice(4).reduce((s,x)=>s+x.v,0);return a.slice(0,4).concat([{k:'Outros',v:r}])}return a};
  const vis={base:['Base',()=>agr(x=>x.base)],ct:['Contrato',()=>agr(x=>{const g=tiGrupoDe(x.ct);return g?g.nome:x.ct})],forn:['Fornecedor',fo]};
  const tot=T.reduce((s,n)=>s+n.total,0),lista=vis[TI_VISAO][1]();
  const onde='<div class="tiseg sm">'+Object.keys(vis).map(k=>'<button type="button" data-tivis="'+k+'" class="'+(TI_VISAO===k?'on':'')+'">'+vis[k][0]+'</button>').join('')+'</div>'+
    '<div class="tirank">'+lista.map(x=>'<div class="tirank-r"><span>'+esc(x.k)+'</span><i><em style="width:'+(100*x.v/(lista[0].v||1))+'%"></em></i><b>'+Rk(x.v)+'</b><small>'+P(tot?x.v/tot:0).replace(',0%','%')+'</small></div>').join('')+'</div>';
  return hero+cards+
   '<div class="xg2">'+panel('Gasto por mês',meta?'traço = meta':'',colChart(col,{leg:'Gasto',aria:'Gasto de TI por mês'}))+panel('Para onde foi o dinheiro','total de 2026',onde)+'</div>'+tiIndHTML()+tiDestHTML()}
function tiIndHTML(){const L=INDS().filter(i=>i.tema==='Setor de TI');
  return panel('Indicadores do Setor de TI','clique em um indicador para ver como é calculado','<div class="tiind">'+L.map(i=>'<a class="tiind-c '+i.st+'" href="#'+i.id+'"><div class="tiind-h"><code>'+i.cod+'</code>'+stDot(i.st)+'</div><b>'+esc(i.nome)+'</b><div class="tiind-v">'+i.fv(i.v)+'</div><small>'+(i.mv==null?'sem meta definida':(i.und==='R$'?'média ':'meta '+(i.pol.startsWith('Maior')?'≥ ':'≤ '))+i.fv(i.mv))+(i.prop?' · proposta':'')+'</small></a>').join('')+'</div>')}
/* ---------- notas e compras ---------- */
let TI_NVIS='lista';
PG['ti-notas']=()=>{
  const T=tiFiltra(tiNotas(),{semSt:1}),q=TIF.q.trim().toUpperCase(),L0=q?T.filter(n=>(n.num+' '+n.fornN+' '+n.itens.map(i=>i.desc).join(' ')).toUpperCase().includes(q)):T,L=TIF.st?L0.filter(n=>n.st===TIF.st):L0;
  const seg='<div class="tiseg">'+[['','Todas',L0.length],...TI_ST_ORD.map(s=>[s,TI_ST[s].t,L0.filter(n=>n.st===s).length])].filter(x=>x[0]===''||x[2]).map(([k,t,c])=>'<button type="button" data-tist="'+k+'" class="'+(TIF.st===k?'on':'')+'">'+t+' <b>'+N(c)+'</b></button>').join('')+'</div>';
  const cols=[{h:'Nota',f:n=>'<a href="#ti-nota-'+n.id+'" class="tinf">'+(n.num?'NF '+esc(n.num):'<em>sem nº</em>')+'</a>'},{h:'Fornecedor',w:1,f:n=>esc(n.fornN)},{h:'Data',f:n=>tiD(n.emissao)},{h:'Valor',n:1,f:n=>R(n.total)},
    {h:'Situação',f:n=>tiPode()?'<select class="tistsel '+(TI_ST[n.st]||TI_ST.nd).c+'" data-tistn="'+n.id+'">'+TI_ST_ORD.map(s=>'<option value="'+s+'"'+(n.st===s?' selected':'')+'>'+TI_ST[s].t+'</option>').join('')+'</select>':tiSt(n.st)},
    {h:'Documento',f:n=>n.pdf&&n.pdf.id?'<button type="button" class="btn sm tiverb" data-tiver="'+n.id+'">'+ico('cad')+' Visualizar</button>':'<span class="muted">sem anexo</span>'},
    {h:'',f:n=>'<a class="btn sm" href="#ti-nota-'+n.id+'">Abrir</a>'}];
  const n0=Math.min(TIF.n,L.length);
  const nAnd=tiNotas().filter(n=>n.st==='aguardando').length;
  const vis='<div class="tiseg tivis"><button type="button" data-tinvis="andamento" class="'+(TI_NVIS==='andamento'?'on':'')+'">'+ico('relogio')+' Em andamento <b>'+nAnd+'</b></button><button type="button" data-tinvis="lista" class="'+(TI_NVIS==='lista'?'on':'')+'">'+ico('lista')+' Lista de compras</button><button type="button" data-tinvis="situacao" class="'+(TI_NVIS==='situacao'?'on':'')+'">'+ico('cad')+' Prestação de contas</button></div>';
  const topo=tiHead('Notas e prestação de contas','Cadastre compras anexando a nota e acompanhe o que já foi entregue ao financeiro','cad','',1)+
   '<div class="tiacoes">'+(tiPode()?'<a class="btn primary" href="#ti-nota-nova" data-tinova="nota">'+ico('upload')+' Nova compra com nota</a><a class="btn" href="#ti-nota-nova" data-tinova="andamento">'+ico('relogio')+' Nova compra em andamento</a>':'')+vis+'<span class="tiacoes-fim">'+tiPerfilHTML()+'</span></div>';
  if(TI_NVIS==='andamento')return topo+tiAndHTML();
  if(TI_NVIS==='situacao')return topo+'<div class="tiacoes"><button type="button" class="btn" data-tixls="financeiro">Baixar relatório para o financeiro (Excel)</button></div>'+tiKanHTML();
  return topo+'<div class="tiacoes"><input type="search" class="tiq" data-tif="q" value="'+esc(TIF.q)+'" placeholder="Procurar nota, produto ou fornecedor"><button type="button" class="btn" data-tixls="notas">Baixar Excel</button></div>'+seg+
   panel('Compras','mostrando '+N(n0)+' de '+N(L.length),tabela(cols,L.slice(0,TIF.n),{})+(L.length>TIF.n?'<button type="button" class="btn" data-timais>Mostrar mais</button>':''))}
function tiAndHTML(){const L=tiFiltra(tiNotas()).filter(n=>n.st==='aguardando').sort((a,b)=>(a.emissao||'').localeCompare(b.emissao||''));const hj=Date.now();
  if(!L.length)return '<div class="panel tivazio">'+ico('relogio')+'<h3>Nenhuma compra em andamento</h3><p>Quando você começar a comprar com um fornecedor e a nota ainda não tiver chegado, clique em <b>"Nova compra em andamento"</b>. Vá anotando os itens, para quem é e o setor. Quando a nota chegar, é só anexar.</p></div>';
  return '<div class="note">Compras que você está fazendo e cuja nota ainda não chegou. Clique em <b>Continuar</b> para anotar mais itens, ou em <b>A nota chegou</b> para anexar o PDF/XML: a central liga os itens da nota aos que você já anotou.</div><div class="tiands">'+L.map(n=>{const ini=Date.parse(n.emissao||'');const d=isFinite(ini)?Math.max(0,Math.floor((hj-ini)/864e5)):null;const its=n.itens.filter(i=>i.desc);
    return '<div class="tiand"><div class="tiand-h"><div><small>'+esc(n.fornN)+'</small><b>'+N(its.length)+' item(ns) · '+R(n.total)+'</b></div><span class="tst par"><i></i>'+(d==null?'em andamento':d===0?'aberta hoje':'aberta há '+d+' dia(s)')+'</span></div>'+
      '<ul>'+its.slice(0,4).map(i=>'<li><span>'+N(i.qtd)+'× '+esc(i.desc)+'</span>'+(i.obs?'<small>'+esc(i.obs)+'</small>':'')+((i.dest||[]).length?'<em>'+i.dest.map(x=>[x.setor,x.base].filter(Boolean).join(' · ')).filter(Boolean).join(', ')+'</em>':'')+'</li>').join('')+(its.length>4?'<li class="mais">+ '+(its.length-4)+' item(ns)</li>':'')+'</ul>'+
      '<div class="tiand-a">'+(tiPode()?'<a class="btn" href="#ti-nota-'+n.id+'">Continuar</a><a class="btn primary" href="#ti-nota-'+n.id+'">'+ico('upload')+' A nota chegou</a>':'<a class="btn" href="#ti-nota-'+n.id+'">Ver detalhes</a>')+'</div></div>'}).join('')+'</div>'}
/* ---------- painel do financeiro ---------- */
PG['ti-fin']=()=>{
  const T=tiFiltra(tiNotas()),ma=TIF.mes||tiMesAtual();
  const comNota=T.filter(n=>n.st!=='aguardando'),and=T.filter(n=>n.st==='aguardando');
  const soma=a=>a.reduce((s,n)=>s+(+n.total||0),0),st=s=>comNota.filter(n=>n.st===s);
  const gm=tiGastoMes(T),prox=(()=>{const [y,m]=ma.split('-').map(Number);const d=new Date(y,m,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')})();
  const bc=(cls,k,v,sub)=>'<div class="bcard '+cls+'"><span>'+k+'</span><b>'+v+'</b><small>'+sub+'</small></div>';
  const cards='<div class="tifk">'+bc('','Compras registradas',N(comNota.length),Rk(soma(comNota))+' · '+N(comNota.filter(n=>n.num).length)+' com nº de nota')+
    bc('par','Ainda com o setor de compras',N(st('comigo').length),Rk(soma(st('comigo')))+' a receber')+
    bc('sup','Entregues ao financeiro',N(st('entregue').length),Rk(soma(st('entregue'))))+
    bc('','Compras em andamento',N(and.length),Rk(soma(and))+' · nota ainda não chegou')+
    bc('','Parcelas de '+MES3[+ma.slice(5)-1].toLowerCase(),Rk(gm[ma]||0),'próximo mês: '+Rk(gm[prox]||0))+'</div>';
  /* parcelas por mês */
  const ms=Object.keys(gm).filter(m=>m>='2026-01').sort();
  const col=ms.map(m=>({k:m,l:MES3[+m.slice(5)-1],t:MESES[+m.slice(5)-1]+'/'+m.slice(0,4),v:gm[m]||0,fut:m>tiMesAtual()}));
  /* rateio contrato × setor */
  const D=tiDestinos(T),grp=c=>{const g=tiGrupoDe(c);return g?g.nome:c?'Contrato '+c:'Sem contrato'};
  const linhas=[...new Set(D.map(x=>grp(x.ct)))].sort(),cols=[...TI_SETORES.filter(s=>D.some(x=>x.setor===s)),...(D.some(x=>!x.setor)?['']:[])];
  const val=(l,c)=>D.filter(x=>grp(x.ct)===l&&(x.setor||'')===c).reduce((s,x)=>s+x.v,0);
  const rateio='<div class="tw"><table class="utab tirat"><thead><tr><th>Contrato</th>'+cols.map(c=>'<th class="n">'+(c||'Sem setor')+'</th>').join('')+'<th class="n">Total</th></tr></thead><tbody>'+
    linhas.map(l=>{const vs=cols.map(c=>val(l,c)),t=vs.reduce((a,b)=>a+b,0);return '<tr><td><b>'+esc(l)+'</b></td>'+vs.map(v=>'<td class="n">'+(v?R(v):'<span class="muted">–</span>')+'</td>').join('')+'<td class="n"><b>'+R(t)+'</b></td></tr>'}).join('')+
    '<tr class="tot"><td>Total</td>'+cols.map(c=>'<td class="n">'+R(D.filter(x=>(x.setor||'')===c).reduce((s,x)=>s+x.v,0))+'</td>').join('')+'<td class="n">'+R(D.reduce((s,x)=>s+x.v,0))+'</td></tr></tbody></table></div>';
  /* por base */
  const pb=new Map();D.forEach(x=>{const k=x.base||'Base não informada';pb.set(k,(pb.get(k)||0)+x.v)});const pbl=[...pb].sort((a,b)=>b[1]-a[1]),pbt=pbl.reduce((s,x)=>s+x[1],0);
  const bases='<div class="tirank">'+pbl.map(([k,v])=>'<div class="tirank-r"><span>'+esc(k)+'</span><i><em style="width:'+(100*v/(pbl[0][1]||1))+'%"></em></i><b>'+Rk(v)+'</b><small>'+P(pbt?v/pbt:0).replace(',0%','%')+'</small></div>').join('')+'</div>';
  /* notas */
  const lst=comNota.slice().sort((a,b)=>(b.emissao||'').localeCompare(a.emissao||''));
  const chips=(n,f)=>[...new Set(n.itens.flatMap(i=>(i.dest||[]).map(f)).filter(Boolean))].map(v=>'<span class="tidtag">'+esc(v)+'</span>').join(' ')||'<span class="muted">–</span>';
  const tab=tabela([{h:'Nota',f:n=>'<a class="tinf" href="#ti-nota-'+n.id+'">'+(n.num?'NF '+esc(n.num):'sem nº')+'</a>'+(n.serie?'<br><small class="muted">série '+esc(n.serie)+'</small>':'')},
    {h:'Fornecedor',w:1,f:n=>'<b>'+esc(n.fornN)+'</b>'+(n.cnpj?'<br><small class="muted">'+esc(n.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'))+'</small>':'')},
    {h:'Emissão',f:n=>tiD(n.emissao)},{h:'Valor',n:1,f:n=>'<b>'+R(n.total)+'</b>'},
    {h:'Parcelas',f:n=>(n.parc||[]).map(p=>MES3[+p.mes.slice(5)-1]+'/'+p.mes.slice(2,4)+' · '+Rk(p.v)).join('<br>')},
    {h:'Setores',w:1,f:n=>chips(n,d=>d.setor)},{h:'Bases',w:1,f:n=>chips(n,d=>d.base)},{h:'Contratos',f:n=>chips(n,d=>d.ct?'CT '+d.ct:'')},
    {h:'Situação',f:n=>tiSt(n.st)+(n.stEm?'<br><small class="muted">desde '+tiD(n.stEm.slice(0,10))+'</small>':'')},
    {h:'Documento',f:n=>n.pdf&&n.pdf.id?'<button type="button" class="btn sm tiverb" data-tiver="'+n.id+'">'+ico('cad')+' Visualizar</button>':'<span class="muted">sem anexo</span>'}],lst,{});
  return '<div class="ubar tif"><div class="ubar-l"><div class="ubar-t"><span class="ubar-tag">Setor de TI · Financeiro</span><h2>Painel do financeiro</h2><span>Notas, parcelas e rateio por contrato, setor e base das compras de material de informática</span></div></div><div class="ubar-r tifinr">'+tiPerfilHTML()+tiFBtn()+'<button type="button" class="tifbtn" data-tixls="fin">'+ico('lista')+'Relatório (Excel)</button></div></div>'+tiFiltros()+
    cards+'<div class="xg2">'+panel('Parcelas por mês','valor que cai em cada mês · meses futuros mais claros',colChart(col,{leg:'Parcelas',aria:'Parcelas por mês'}))+panel('Por base','valor do material enviado',bases)+'</div>'+
    panel('Rateio por contrato e setor','quanto de cada nota foi para cada contrato e setor (pelo destino dos itens)',rateio)+
    panel('Compras e notas','clique no número para ver a compra detalhada · '+N(lst.length)+' registros',lst.length?tab:'<div class="empty">Nenhuma nota com número ainda.</div>')};

/* ---------- para onde foi ---------- */
function tiDestHTML(){
  const D=tiDestinos(tiFiltra(tiNotas())),com=D.filter(x=>!x.sem),sem=D.filter(x=>x.sem);
  const mat=new Map();for(const x of com){const k=x.base||'Base não informada';if(!mat.has(k))mat.set(k,new Map());const m=mat.get(k),st=x.setor||'Sem setor';m.set(st,(m.get(st)||0)+x.v)}
  const tb=b=>[...mat.get(b).values()].reduce((s,v)=>s+v,0);const bases=[...mat.keys()].sort((a,b)=>tb(b)-tb(a));
  const mapa='<div class="timapa">'+bases.map(b=>{const m=[...mat.get(b)].sort((x,y)=>y[1]-x[1]),t=tb(b),top=m.slice(0,3),r=m.slice(3).reduce((s,x)=>s+x[1],0);
    return '<div class="timb"><div class="timb-h"><b>'+esc(b)+'</b><span>'+Rk(t)+'</span></div>'+top.map(([s,v])=>'<div class="timb-r"><span>'+esc(s)+'</span><i style="width:'+(100*v/t)+'%"></i><b>'+Rk(v)+'</b></div>').join('')+(r?'<div class="timb-o">+ '+(m.length-3)+' outros setores · '+Rk(r)+'</div>':'')+'</div>'}).join('')+'</div>';
  const porNota=new Map();sem.forEach(x=>{const k=x.n.id;if(!porNota.has(k))porNota.set(k,{n:x.n,q:0,v:0});const o=porNota.get(k);o.q++;o.v+=x.v});
  return (porNota.size?'<div class="note tisemd">'+ico('alerta')+'<span><b>'+porNota.size+' compra(s)</b> com material sem destino ('+Rk(sem.reduce((s,x)=>s+x.v,0))+'): '+[...porNota.values()].slice(0,5).map(o=>'<a href="#ti-nota-'+o.n.id+'">'+(o.n.num?'NF '+esc(o.n.num):'compra de '+tiD(o.n.emissao))+'</a>').join(', ')+'</span></div>':'')+
   panel('Para onde foi o material','por base · os 3 setores que mais receberam em cada uma',bases.length?mapa:'<div class="empty">Nenhum destino informado ainda.</div>')}
PG['ti-destinos']=()=>{location.replace('#ti-custos');return ''};
/* ---------- novas aquisições (orçamento futuro) ---------- */
const AQ_ST={sol:{t:'Solicitado',c:'nd'},ana:{t:'Em cotação',c:'info'},apr:{t:'Aprovado',c:'par'},com:{t:'Comprado',c:'sup'},can:{t:'Cancelado',c:'nao'}},AQ_ORD=['sol','ana','apr','com','can'];
const AQ_PRI={alta:'Alta',media:'Média',baixa:'Baixa'};
let AQ_DB={},AQ_ED=null,AQ_FST='',AQ_VER=0;
const aqSt=s=>'<span class="tst '+(AQ_ST[s]||AQ_ST.sol).c+'"><i></i>'+(AQ_ST[s]||AQ_ST.sol).t+'</span>';
const aqLista=()=>Object.values(AQ_DB).filter(a=>a&&!a.del).map(a=>Object.assign({},a,{tot:(+a.qtd||0)*(+a.vu||0)}));
const aqAberta=a=>a.st!=='com'&&a.st!=='can';
function aqFiltra(L){const q=TIF.q.trim().toUpperCase();return L.filter(a=>(!TIF.setor||a.setor===TIF.setor)&&(!TIF.base||a.base===TIF.base)&&(!TIF.ct||a.ct===TIF.ct)&&(!q||[a.desc,a.sol,a.area,a.obs].join(' ').toUpperCase().includes(q)))}
async function aqCarregar(db){let m=false;try{const s=await db.collection('ti_aquis').get();const docs=s.docs||s;(docs||[]).forEach(d=>{const v=d.data?d.data():d;if(v&&v.j&&d.id){AQ_DB[d.id]=JSON.parse(v.j);m=true}})}catch(e){}if(m)AQ_VER++;return m}
async function aqGrava(a){AQ_DB[a.id]=a;AQ_VER++;if(tiGrava()){try{await DBX.doc('ti_aquis/'+a.id).set({j:JSON.stringify(a),em:new Date().toISOString()});return true}catch(x){toast('Não foi possível salvar para todos ('+(x.message||x.code)+'). Ficou só nesta tela.');return false}}return true}
const aqRank=(pares,vazio)=>{const t=pares.reduce((s,x)=>s+x[1],0);if(!pares.length)return '<div class="empty">'+vazio+'</div>';return '<div class="tirank">'+pares.map(([k,v])=>'<div class="tirank-r"><span>'+esc(k)+'</span><i><em style="width:'+(100*v/(pares[0][1]||1))+'%"></em></i><b>'+Rk(v)+'</b><small>'+(t?Math.round(100*v/t)+'%':'')+'</small></div>').join('')+'</div>'};
const aqSoma=(L,f)=>{const m=new Map();L.forEach(a=>{const k=f(a)||'Não informado';m.set(k,(m.get(k)||0)+a.tot)});return [...m].sort((a,b)=>b[1]-a[1])};
function aqForm(){const a=AQ_ED,Ls=tiListas();
  const op=(arr,v,ph)=>'<option value="">'+ph+'</option>'+arr.map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('');
  const inp=(k,lab,t,ph,ex)=>'<label><small>'+lab+'</small><input type="'+(t||'text')+'" data-aq="'+k+'" value="'+esc(a[k]==null?'':String(a[k]))+'" placeholder="'+(ph||'')+'"'+(ex||'')+'></label>';
  const sel=(k,lab,html)=>'<label><small>'+lab+'</small><select data-aq="'+k+'">'+html+'</select></label>';
  return '<div class="panel aqform"><div class="phd"><h3>'+(a.novo?'Nova aquisição':'Editar aquisição')+'</h3><small>preencha o que souber · dá para completar depois</small></div><div class="aqgrid">'+
    inp('desc','O que vai ser comprado *','text','ex.: Notebook i5 16GB',' class="aqw2"')+inp('qtd','Quantidade','number','1',' min="0" step="1"')+inp('vu','Valor unitário estimado (R$)','text','ex.: 3.500,00',' inputmode="decimal"')+
    sel('setor','Setor',op(TI_SETORES,a.setor,'Escolha'))+sel('base','Base / área',op(Ls.base,a.base,'Escolha'))+sel('ct','Contrato',op(Ls.ct,a.ct,'Escolha'))+
    inp('sol','Quem solicitou','text','nome de quem pediu')+inp('area','Área / equipe','text','ex.: Fiscalização, Almoxarifado')+inp('dsol','Data do pedido','date')+
    sel('pri','Prioridade',Object.entries(AQ_PRI).map(([k,t])=>'<option value="'+k+'"'+(a.pri===k?' selected':'')+'>'+t+'</option>').join(''))+
    sel('st','Status',AQ_ORD.map(k=>'<option value="'+k+'"'+(a.st===k?' selected':'')+'>'+AQ_ST[k].t+'</option>').join(''))+inp('prev','Previsão de compra (mês)','month')+
    '<label class="aqw3"><small>Observação</small><textarea data-aq="obs" rows="2" placeholder="justificativa, link de cotação, fornecedor sugerido…">'+esc(a.obs||'')+'</textarea></label></div>'+
    '<div class="aqbar"><span class="aqtot">Total estimado: <b data-aqtot>'+R((+a.qtd||0)*(+a.vu||0))+'</b></span><button type="button" class="btn" data-aqcancela>Cancelar</button><button type="button" class="btn primary" data-aqsalva>Salvar aquisição</button></div></div>'}
PG['ti-aquis']=()=>{
  if(tiPerfil()!=='compras')return '<div class="ubar"><div class="ubar-l"><span class="ubar-ic">'+ico('escudo')+'</span><div class="ubar-t"><span class="ubar-tag">Setor de TI · Controle de Custos</span><h2>Novas aquisições</h2><span>Área restrita ao setor de compras</span></div></div><div class="ubar-r tifinr">'+tiPerfilHTML()+'</div></div>'+panel('Acesso restrito','','<div class="empty">Esta área é usada só pelo setor de compras para planejar o próximo orçamento. Para acompanhar as compras, use o <a href="#ti-fin">Painel do financeiro</a>.</div>');
  const L0=aqFiltra(aqLista()),L=AQ_FST?L0.filter(a=>a.st===AQ_FST):L0,ab=L0.filter(aqAberta),pode=tiPode();
  const sm=f=>L0.filter(f).reduce((s,a)=>s+a.tot,0),ct=f=>L0.filter(f).length;
  const bc=(cls,k,v,sub)=>'<div class="bcard '+cls+'"><span>'+k+'</span><b>'+v+'</b><small>'+sub+'</small></div>';
  const cards='<div class="tifk">'+bc('','Orçamento previsto',Rk(sm(aqAberta)),N(ab.length)+' aquisições em aberto')+
    bc('','Solicitadas',N(ct(a=>a.st==='sol')),Rk(sm(a=>a.st==='sol')))+bc('','Em cotação',N(ct(a=>a.st==='ana')),Rk(sm(a=>a.st==='ana')))+
    bc('par','Aprovadas',N(ct(a=>a.st==='apr')),Rk(sm(a=>a.st==='apr'))+' · falta comprar')+bc('sup','Já compradas',N(ct(a=>a.st==='com')),Rk(sm(a=>a.st==='com')))+'</div>';
  const pm=new Map();ab.forEach(a=>{const k=a.prev||'sem';pm.set(k,(pm.get(k)||0)+a.tot)});
  const ms=[...pm.keys()].filter(k=>k!=='sem').sort();const col=ms.map(m=>({k:m,l:MES3[+m.slice(5)-1]+'/'+m.slice(2,4),t:MESES[+m.slice(5)-1]+'/'+m.slice(0,4),v:pm.get(m)}));
  const semPrev=pm.get('sem')||0;
  const grafico=col.length?colChart(col,{leg:'Previsto',aria:'Orçamento previsto por mês'})+(semPrev?'<p class="muted aqnota">+ '+R(semPrev)+' sem mês de previsão definido</p>':''):'<div class="empty">'+(ab.length?'Nenhuma aquisição com mês de previsão. Preencha a "Previsão de compra" para ver aqui.':'Nenhuma aquisição em aberto ainda.')+'</div>';
  const seg='<div class="tiseg">'+[['','Todas',L0.length],...AQ_ORD.map(s=>[s,AQ_ST[s].t,ct(a=>a.st===s)])].filter(x=>x[0]===''||x[2]).map(([k,t,c])=>'<button type="button" data-aqst="'+k+'" class="'+(AQ_FST===k?'on':'')+'">'+t+' <b>'+N(c)+'</b></button>').join('')+'</div>';
  const ordem={alta:0,media:1,baixa:2};const Ls=L.slice().sort((a,b)=>(aqAberta(b)-aqAberta(a))||(ordem[a.pri]??1)-(ordem[b.pri]??1)||(a.prev||'9').localeCompare(b.prev||'9'));
  const tab=tabela([{h:'Aquisição',w:1,f:a=>'<b>'+esc(a.desc||'(sem descrição)')+'</b>'+(a.obs?'<br><small class="muted">'+esc(a.obs)+'</small>':'')},
    {h:'Qtd',n:1,f:a=>N(+a.qtd||0)},{h:'Valor estimado',n:1,f:a=>'<b>'+R(a.tot)+'</b>'+(a.qtd>1?'<br><small class="muted">'+R(+a.vu||0)+' cada</small>':'')},
    {h:'Setor',f:a=>a.setor?'<span class="tidtag">'+esc(a.setor)+'</span>':'<span class="muted">–</span>'},{h:'Base / área',f:a=>esc(a.base||'–')+(a.area?'<br><small class="muted">'+esc(a.area)+'</small>':'')},
    {h:'Contrato',f:a=>a.ct?'CT '+esc(a.ct):'–'},{h:'Solicitante',f:a=>esc(a.sol||'–')+(a.dsol?'<br><small class="muted">'+tiD(a.dsol)+'</small>':'')},
    {h:'Prioridade',f:a=>'<span class="aqpri '+(a.pri||'media')+'">'+(AQ_PRI[a.pri]||'Média')+'</span>'},{h:'Previsão',f:a=>a.prev?MES3[+a.prev.slice(5)-1]+'/'+a.prev.slice(2,4):'<span class="muted">–</span>'},
    {h:'Status',f:a=>pode?'<select class="aqstsel" data-aqmuda="'+a.id+'">'+AQ_ORD.map(k=>'<option value="'+k+'"'+(a.st===k?' selected':'')+'>'+AQ_ST[k].t+'</option>').join('')+'</select>':aqSt(a.st)},
    ...(pode?[{h:'',f:a=>'<button type="button" class="btn sm" data-aqedita="'+a.id+'">Editar</button> <button type="button" class="btn sm" data-aqexclui="'+a.id+'" aria-label="Excluir">✕</button>'}]:[])],Ls,{});
  return '<div class="ubar tif"><div class="ubar-l"><span class="ubar-ic">'+ico('lista')+'</span><div class="ubar-t"><span class="ubar-tag">Setor de TI · Controle de Custos</span><h2>Novas aquisições</h2><span>O que ainda vai ser comprado, por setor, base e solicitante · base para o próximo orçamento</span></div></div><div class="ubar-r tifinr">'+tiPerfilHTML()+tiFBtn()+
    '<button type="button" class="tifbtn" data-aqxls>'+ico('lista')+'Excel</button>'+(pode&&!AQ_ED?'<button type="button" class="btn primary" data-aqnova>+ Nova aquisição</button>':'')+'</div></div>'+tiFiltros()+
    (AQ_ED?aqForm():'')+cards+
    '<div class="xg2">'+panel('Orçamento previsto por mês','aquisições em aberto, pelo mês previsto de compra',grafico)+panel('Por setor','valor previsto em aberto',aqRank(aqSoma(ab,a=>a.setor),'Nada em aberto ainda.'))+'</div>'+
    '<div class="xg2">'+panel('Por base / área','valor previsto em aberto',aqRank(aqSoma(ab,a=>a.base),'Nada em aberto ainda.'))+panel('Por contrato','valor previsto em aberto',aqRank(aqSoma(ab,a=>{const g=tiGrupoDe(a.ct);return g?g.nome:a.ct?'Contrato '+a.ct:''}),'Nada em aberto ainda.'))+'</div>'+
    panel('Lista de aquisições',N(L.length)+' registro(s) · em aberto primeiro, por prioridade',seg+(L.length?tab:'<div class="empty">'+(pode?'Nenhuma aquisição ainda. Clique em "+ Nova aquisição" para começar.':'Nenhuma aquisição cadastrada ainda.')+'</div>'))};
function ligarAQ(){const m=$('main');if(!m)return;
  m.querySelectorAll('[data-aqnova]').forEach(b=>b.onclick=()=>{AQ_ED={novo:1,id:'A'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),qtd:1,pri:'media',st:'sol',dsol:new Date().toISOString().slice(0,10)};render();scrollTo({top:0,behavior:'smooth'})});
  m.querySelectorAll('[data-aqedita]').forEach(b=>b.onclick=()=>{AQ_ED=Object.assign({},AQ_DB[b.dataset.aqedita]);render();scrollTo({top:0,behavior:'smooth'})});
  m.querySelectorAll('[data-aqcancela]').forEach(b=>b.onclick=()=>{AQ_ED=null;render()});
  m.querySelectorAll('[data-aq]').forEach(el=>{const f=()=>{const k=el.dataset.aq;let v=el.value;if(k==='vu')v=parseFloat(String(v).replace(/\./g,'').replace(',','.'))||0;if(k==='qtd')v=+v||0;AQ_ED[k]=v;const t=m.querySelector('[data-aqtot]');if(t)t.textContent=R((+AQ_ED.qtd||0)*(+AQ_ED.vu||0))};el.addEventListener('input',f);el.addEventListener('change',f)});
  m.querySelectorAll('[data-aqsalva]').forEach(b=>b.onclick=async()=>{const a=AQ_ED;if(!a)return;if(!(a.desc||'').trim()){toast('Informe o que vai ser comprado.');const d=m.querySelector('[data-aq="desc"]');d&&d.focus();return}
    delete a.novo;a.em=new Date().toISOString();a.hist=a.hist||[{st:a.st,em:a.em}];const ok=await aqGrava(a);AQ_ED=null;render();if(ok)toast(tiGrava()?'Aquisição salva.':'Aquisição registrada nesta tela (modo de teste: não fica salva).')});
  m.querySelectorAll('[data-aqmuda]').forEach(s=>s.onchange=async()=>{const a=AQ_DB[s.dataset.aqmuda];if(!a)return;a.st=s.value;a.hist=(a.hist||[]).concat({st:a.st,em:new Date().toISOString()});await aqGrava(a);setTimeout(render,0);toast('Status: '+AQ_ST[a.st].t+'.')});
  m.querySelectorAll('[data-aqexclui]').forEach(b=>b.onclick=async()=>{const a=AQ_DB[b.dataset.aqexclui];if(!a||!confirm('Excluir "'+(a.desc||'aquisição')+'"?'))return;await aqGrava({id:a.id,del:true});render();toast('Aquisição excluída.')});
  m.querySelectorAll('[data-aqst]').forEach(b=>b.onclick=()=>{AQ_FST=b.dataset.aqst;render()});
  m.querySelectorAll('[data-aqxls]').forEach(b=>b.onclick=async()=>{const rows=aqFiltra(aqLista()).map(a=>({'Aquisição':a.desc,'Quantidade':+a.qtd||0,'Valor unitário estimado':+a.vu||0,'Total estimado':a.tot,'Setor':a.setor||'','Base / área':a.base||'','Área / equipe':a.area||'','Contrato':a.ct||'','Solicitante':a.sol||'','Data do pedido':a.dsol?tiD(a.dsol):'','Prioridade':AQ_PRI[a.pri]||'','Previsão':a.prev?tiMesN(a.prev):'','Status':AQ_ST[a.st].t,'Observação':a.obs||''}));
    try{await lib(XLSX_URL);const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Novas aquisições');await salvarArquivo('ti_novas_aquisicoes.xlsx',new Blob([XLSX.write(wb,{type:'array',bookType:'xlsx'})]))}catch(e){toast('Não consegui gerar o Excel.')}})}

/* ---------- histórico de preços ---------- */
PG['ti-precos']=()=>{
  const T=tiFiltra(tiNotas()),q=TIF.q.trim().toUpperCase(),m=new Map();
  for(const n of T)for(const i of n.itens){if(!i.qtd||!i.vt)continue;const k=i.desc.replace(/\s+/g,' ').trim();if(!m.has(k))m.set(k,[]);m.get(k).push({vu:i.vt/i.qtd,d:n.emissao||n.meses[0]||'',f:n.fornN})}
  let P_=[...m].map(([k,a])=>{a.sort((x,y)=>x.d.localeCompare(y.d));const v=a.map(x=>x.vu),u=a[a.length-1],mn=Math.min(...v);return {k,n:a.length,min:mn,u,var:mn?u.vu/mn-1:0}});
  P_=q?P_.filter(x=>x.k.toUpperCase().includes(q)):P_.filter(x=>x.n>1);P_.sort((a,b)=>b.var-a.var||b.n-a.n);
  const cols=[{h:'Produto',w:1,f:x=>'<b>'+esc(x.k)+'</b><br><small>'+x.n+' compra(s) · última em '+tiD(x.u.d)+' ('+esc(x.u.f)+')</small>'},{h:'Último preço',n:1,f:x=>R(x.u.vu)},{h:'Menor preço',n:1,f:x=>R(x.min)},{h:'Diferença',n:1,f:x=>x.var>0.005?'<span class="tiup">+'+P(x.var)+'</span>':'<span class="muted">igual</span>'}];
  return tiHead('Preços dos produtos','Produtos comprados mais de uma vez: o último preço comparado com o menor','moeda','',1)+
   '<div class="tiacoes"><input type="search" class="tiq" data-tif="q" value="'+esc(TIF.q)+'" placeholder="Procurar um produto (ex.: toner, mouse)"></div>'+
   panel(q?'Resultado da busca':'Produtos repetidos',N(P_.length)+' produto(s) · os que mais subiram primeiro',tabela(cols,P_.slice(0,TIF.n),{})+(P_.length>TIF.n?'<button type="button" class="btn" data-timais>Mostrar mais</button>':''))}
/* ---------- prestação de contas ---------- */
function tiKanHTML(){
  const L=tiFiltra(tiNotas());const hj=Date.now();
  const card=n=>{const di=n.stEm?Math.floor((hj-Date.parse(n.stEm))/864e5):null;
    const prox={aguardando:'comigo',comigo:'entregue'}[n.st];
    return '<div class="tik"><div class="tik-h"><a href="#ti-nota-'+n.id+'">'+(n.num?'NF '+esc(n.num):'Compra sem nº')+'</a><b>'+R(n.total)+'</b></div><div class="tik-f">'+esc(n.fornN)+' · '+tiD(n.emissao)+(n.pdf&&n.pdf.id?' · <button type="button" class="tilink" data-tiver="'+n.id+'">ver nota</button>':'')+'</div>'+
      (di!=null&&n.st!=='entregue'?'<div class="tik-d'+(di>7?' late':'')+'">há '+di+' dia(s) nesta situação</div>':n.stEm?'<div class="tik-d">desde '+tiD(n.stEm.slice(0,10))+'</div>':'')+
      (tiPode()&&prox?'<button type="button" class="btn sm" data-timove="'+n.id+'|'+prox+'">'+(prox==='comigo'?'Recebi a nota →':'Entreguei ao financeiro →')+'</button>':'')+'</div>'};
  const colunas=TI_ST_ORD.map(s=>{const a=L.filter(n=>n.st===s);return '<div class="tikc '+TI_ST[s].c+'"><div class="tikc-h">'+tiSt(s)+'<span>'+N(a.length)+' · '+R(a.reduce((x,n)=>x+n.total,0))+'</span></div>'+(s==='nd'?'<p class="tik-n">Compras da planilha antiga: abra e informe o nº da nota e a situação.</p>':'')+a.slice(0,s==='nd'?4:30).map(card).join('')+(s==='nd'&&a.length>4?'<a class="tik-mais" href="#ti-notas" data-tinvis="lista" data-tist2="nd">Ver as '+N(a.length)+' compras →</a>':'')+'</div>'}).join('');
  return '<div class="tikan">'+colunas+'</div>'}
PG['ti-prestacao']=()=>{TI_NVIS='situacao';location.replace('#ti-notas');return ''};
/* ---------- controle de segurança ---------- */
PG['ti-seg']=()=>tiHead('Controle de Segurança','Próxima etapa do Setor de TI','escudo','Controle de Segurança')+
  '<div class="panel tivazio">'+ico('escudo')+'<h3>Esta área ainda vai ser montada</h3><p>Aqui vai ficar o Controle de Segurança do Setor de TI. Assim que você me mandar as planilhas ou contar o que precisa acompanhar, eu monto as telas no mesmo padrão do Controle de Custos.</p></div>';
/* ---------- cadastro / edição de compra ---------- */
function tiNovaVazia(){return {id:tiId(),origem:'nota',num:'',serie:'',chave:'',forn:'',cnpj:'',razao:'',emissao:new Date().toISOString().slice(0,10),ger:'INFORMÁTICA',itens:[],total:0,parc:[],st:'comigo',obs:''}}
let TI_NOVA_TIPO='';
function tiAbrir(id){if(id==='nova'){TIE=tiNovaVazia();TIE._nova=1;if(TI_NOVA_TIPO==='andamento'){TIE.st='aguardando';TIE.itens=[{desc:'',qtd:1,vu:0,vt:0,dest:[],obs:''}]}TI_NOVA_TIPO=''}else{const n=tiNotas().find(x=>x.id===id);TIE=n?JSON.parse(JSON.stringify(Object.assign({},TI_DB[id]||TI_SEED.notas.find(x=>x.id===id)||n))):null}TIE_MSG=''}
function tiAvisos(e){const a=[],soma=e.itens.reduce((s,i)=>s+(+i.vt||0),0),sp=(e.parc||[]).reduce((s,p)=>s+(+p.v||0),0);
  if(!e.num&&e.st!=='aguardando')a.push(['w','Número da nota não informado.']);if(!e.forn&&!e.razao)a.push(['w','Fornecedor não informado.']);if(!e.itens.length)a.push(['w','Nenhum item na compra.']);
  if(e.itens.length&&Math.abs(soma-(+e.total||0))>.05)a.push(['x','A soma dos itens ('+R(soma)+') é diferente do valor total da nota ('+R(+e.total||0)+').']);
  if((e.parc||[]).length&&Math.abs(sp-(+e.total||0))>.05)a.push(['x','A soma das parcelas ('+R(sp)+') é diferente do valor total ('+R(+e.total||0)+').']);
  if(!(e.parc||[]).length)a.push(['w','Sem parcelas: o gasto não entra em nenhum mês.']);
  const fn=e.itens.filter(i=>i.foraNota).length;if(fn)a.push(['w',fn+' item(ns) anotado(s) na compra não aparecem na nota. Confira e remova os que não vieram.']);
  if(e.st==='aguardando')a.push(['i','Compra em andamento: vá anotando os itens. Quando a nota chegar, anexe o PDF ou o XML aqui em cima.']);
  const sd=e.itens.filter(i=>(i.dest||[]).reduce((s,d)=>s+(+d.q||0),0)<(+i.qtd||0)).length;if(sd)a.push(['i',sd+' item(ns) sem destino completo (opcional).']);
  const ex=e.itens.filter(i=>(i.dest||[]).reduce((s,d)=>s+(+d.q||0),0)>(+i.qtd||0)+1e-9).length;if(ex)a.push(['x',ex+' item(ns) com destino maior que a quantidade comprada.']);
  const dup=tiNotas().find(n=>n.id!==e.id&&((e.chave&&n.chave===e.chave)||(e.num&&n.num===e.num&&e.cnpj&&n.cnpj===e.cnpj)));if(dup)a.push(['x','Esta nota já está cadastrada (NF '+esc(dup.num)+' de '+esc(dup.fornN)+').']);
  return a}
function tiAvHTML(e){const av=tiAvisos(e);return av.length?'<div class="tiav">'+av.map(([t,h])=>'<div class="tiav-i '+t+'">'+(t==='x'?'✕':t==='w'?'!':'i')+' '+h+'</div>').join('')+'</div>':'<div class="tiav"><div class="tiav-i ok">✓ Tudo certo com esta compra.</div></div>'}
PG['ti-nota']=()=>{if(!tiPode()&&/^#ti-nota-nova/.test(location.hash)){location.replace('#ti-notas');return ''}
  const id=location.hash.slice(9);if(!TIE||(TIE.id!==id&&!(id==='nova'&&TIE._nova)))tiAbrir(id);const e=TIE;
  if(!e)return '<div class="note err">Compra não encontrada. <a href="#ti-notas">Voltar para Notas e compras</a></div>';
  const Ls=tiListas(),ed=tiPode(),dis=ed?'':' disabled';
  if(!ed)return '<nav class="bread"><a href="#ti-notas">Notas e prestação de contas</a><span>›</span><b>'+(e.num?'NF '+esc(e.num):'Compra sem nº')+'</b></nav>'+
    '<div class="fhd"><div><span class="ubar-tag">'+ico('cad')+' Setor de TI · Consulta do financeiro</span><h2>'+(e.st==='aguardando'?'Compra em andamento':e.num?'Nota fiscal '+esc(e.num):'Compra sem nº de nota')+'</h2><p>'+esc(tiFornNome(e))+' · '+tiD(e.emissao)+' · '+R(+e.total||0)+'</p></div><div class="fnav">'+(e.pdf&&e.pdf.id?'<button type="button" class="btn primary" data-tiver="'+e.id+'">'+ico('cad')+' Visualizar nota</button>':'<span class="muted">sem documento anexado</span>')+tiSt(e.st)+'</div></div>'+tiNotaLeitura(e);
  const inp=(k,t,o={})=>'<label class="'+(o.cls||'')+'"><small>'+t+'</small><input type="'+(o.type||'text')+'" data-tie="'+k+'" value="'+esc(e[k]==null?'':o.fmt?o.fmt(e[k]):e[k])+'"'+(o.list?' list="'+o.list+'"':'')+(o.ph?' placeholder="'+o.ph+'"':'')+dis+'></label>';
  const dl=(id,vals)=>'<datalist id="'+id+'">'+vals.map(v=>'<option value="'+esc(v)+'">').join('')+'</datalist>';
  const opt=(vals,v,vazio)=>'<option value="">'+vazio+'</option>'+vals.map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('');
  const pdfLink=e.pdf&&e.pdf.id?'<button type="button" class="btn sm" data-tiver="'+e.id+'">'+ico('cad')+' Visualizar nota</button>':e._file?'<span class="muted">'+esc(e._file.name)+' · será guardado ao salvar</span>':'';
  const itens=e.itens.map((i,ix)=>{const dq=(i.dest||[]).reduce((s,d)=>s+(+d.q||0),0);
    return '<tr class="tiit"><td class="n">'+(ix+1)+'</td><td class="wr"><input data-tii="'+ix+'|desc" value="'+esc(i.desc)+'" placeholder="Produto"'+dis+'><input class="tiobs" data-tii="'+ix+'|obs" value="'+esc(i.obs||'')+'" placeholder="Observação: para quem é, motivo, chamado…"'+dis+'>'+(i.foraNota?'<span class="tifora">não está na nota · confira ou remova (×)</span>':'')+'</td><td class="n"><input class="nm" data-tii="'+ix+'|qtd" value="'+nf2.format(+i.qtd||0).replace(',00','')+'"'+dis+'></td><td class="n"><input class="nm" data-tii="'+ix+'|vu" value="'+nf2.format(+i.vu||0)+'"'+dis+'></td><td class="n"><b data-tivt="'+ix+'">'+R(+i.vt||0)+'</b></td><td>'+
      '<div class="tidest">'+(i.dest||[]).map((d,j)=>'<div class="tidr"><input class="nm q" data-tid="'+ix+'|'+j+'|q" value="'+(+d.q||0)+'" title="Quantidade"'+dis+'><select data-tid="'+ix+'|'+j+'|ct"'+dis+'>'+opt(Ls.ct,d.ct,'Contrato')+'</select><select data-tid="'+ix+'|'+j+'|base"'+dis+'>'+opt(Ls.base,d.base,'Base')+'</select><select data-tid="'+ix+'|'+j+'|setor" title="Setor (TOTVS)"'+dis+'>'+opt(TI_SETORES,d.setor,'Setor')+'</select>'+(ed?'<button type="button" class="tix" data-tidrm="'+ix+'|'+j+'" aria-label="Remover destino">×</button>':'')+(d.obs?'<small class="tidobs">anotação antiga: '+esc(d.obs)+'</small>':'')+'</div>').join('')+
      (ed?'<button type="button" class="tiadd" data-tidadd="'+ix+'">+ destino'+(dq<(+i.qtd||0)?' ('+N((+i.qtd||0)-dq)+' sem destino)':'')+'</button>':'')+'</div></td><td>'+(ed?'<button type="button" class="tix" data-tiirm="'+ix+'" aria-label="Remover item">×</button>':'')+'</td></tr>'}).join('');
  const parc=(e.parc||[]).map((p,j)=>'<div class="tipr"><span>'+(j+1)+'ª</span><input type="month" data-tip="'+j+'|mes" value="'+p.mes+'"'+dis+'><input class="nm" data-tip="'+j+'|v" value="'+nf2.format(+p.v||0)+'"'+dis+'>'+(ed?'<button type="button" class="tix" data-tiprm="'+j+'">×</button>':'')+'</div>').join('');
  return '<nav class="bread"><a href="#ti-custos">Setor de TI</a><span>›</span><a href="#ti-notas">Notas e prestação de contas</a><span>›</span><b>'+(e._nova?'Nova compra':e.num?'NF '+esc(e.num):'Compra sem nº')+'</b></nav>'+
   '<div class="fhd"><div><span class="ubar-tag">'+ico('cad')+' Setor de TI · Controle de Custos</span><h2>'+(e.st==='aguardando'?(e._nova?'Nova compra em andamento':'Compra em andamento'):e._nova?'Nova compra':e.num?'Nota fiscal '+esc(e.num):'Compra sem nº de nota')+'</h2><p>'+(e._nova?'Anexe o PDF da nota para preencher tudo automaticamente, ou preencha à mão.':esc(tiFornNome(e))+' · '+tiD(e.emissao)+' · '+R(+e.total||0))+'</p></div><div class="fnav">'+(e.pdf&&e.pdf.id?'<button type="button" class="btn" data-tiver="'+e.id+'">'+ico('cad')+' Visualizar nota</button>':'')+tiSt(e.st)+'</div></div>'+
   (ed?'<div class="panel tidrop'+(TIE_LENDO?' lendo':'')+'" id="tiDrop"><div class="tidrop-i">'+ico('upload')+'</div><div><b>'+(TIE_LENDO?'Lendo a nota…':e.st==='aguardando'&&!e._nova?'A nota chegou? Anexe aqui (PDF ou XML)':'Anexar nota fiscal: PDF ou XML (opcional)')+'</b><p>'+(TIE_LENDO?esc(TIE_LENDO):'Tem o PDF da nota (DANFE) ou o XML? Arraste aqui ou clique em "Escolher arquivo" e a central preenche tudo, sem precisar de IA. Não tem? Preencha os campos abaixo à mão: o anexo não é obrigatório.')+'</p>'+(TIE_MSG?'<div class="note '+(TIE_MSG.startsWith('!')?'err':'ok')+'">'+TIE_MSG.replace(/^!/,'')+(TIE_MSG.startsWith('!')&&SAMPLE&&e._file?' <button type="button" class="btn sm" data-tiia>Tentar ler com a IA do Claude</button>':'')+'</div>':'')+'</div><div class="tidrop-a"><input type="file" id="tiFile" accept="application/pdf,.xml,text/xml,application/xml,image/*" hidden><button type="button" class="btn primary" data-tifile'+(TIE_LENDO?' disabled':'')+'>Escolher arquivo</button>'+(e._nova&&!e.itens.length?'<button type="button" class="btn" data-timanual>Preencher à mão (sem anexo)</button>':'')+pdfLink+'</div></div>':'')+
   (tiGrava()||!tiPode()?'':'<div class="note warn">Modo de teste: você pode anexar a nota e ver o preenchimento automático, mas a compra não fica salva para os outros. Só quem edita a central salva de verdade.</div>')+tiAvHTML(e)+
   panel('Dados da nota','',
    '<div class="tiform">'+inp('num','Nº da nota',{ph:'ex.: 961'})+inp('serie','Série')+inp('emissao','Data de emissão',{type:'date'})+inp('chave','Chave de acesso (44 dígitos)',{cls:'w2'})+
     inp('forn','Fornecedor (como você chama)',{list:'ti-dl-forn',ph:'ex.: SUPREMA'})+inp('razao','Razão social na nota')+inp('cnpj','CNPJ do fornecedor')+
     '<label><small>Gerencial</small><select data-tie="ger"'+dis+'>'+opt(Ls.ger,e.ger,'–')+'</select></label>'+
     '<label><small>Valor total da nota (R$)</small><input class="nm" data-tie="total" value="'+nf2.format(+e.total||0)+'"'+dis+'></label>'+
     '<label><small>Situação da nota</small><select data-tie="st"'+dis+'>'+TI_ST_ORD.map(s=>'<option value="'+s+'"'+(e.st===s?' selected':'')+'>'+TI_ST[s].t+'</option>').join('')+'</select></label>'+
     '<label class="w2"><small>Observação</small><input data-tie="obs" value="'+esc(e.obs||'')+'"'+dis+'></label></div>'+dl('ti-dl-forn',Ls.forn)+dl('ti-dl-setor',Ls.setor))+
   panel('Itens e destino',e.itens.length+' itens · destino opcional: contrato, base e setor',
    '<div class="tw"><table class="utab tiitens"><thead><tr><th class="n">#</th><th>Produto</th><th class="n">Qtd</th><th class="n">V. unit.</th><th class="n">V. total</th><th>Destino (opcional)</th><th></th></tr></thead><tbody>'+(itens||'<tr><td colspan="7"><div class="empty">Nenhum item. Anexe a nota ou adicione à mão.</div></td></tr>')+'</tbody></table></div>'+
    (ed?'<div class="tiacoes"><button type="button" class="btn" data-tiiadd>+ Adicionar item</button>'+(e.itens.length?'<button type="button" class="btn" data-tidtodos>Mesmo destino para todos os itens…</button>':'')+'</div>':''))+
   panel('Parcelas','em que mês cada valor conta para a meta',
    (ed?'<div class="tiparcgen"><label><small>Nº de parcelas</small><input type="number" min="1" max="24" id="tiNp" value="'+Math.max(1,(e.parc||[]).length)+'"></label><label><small>1º mês</small><input type="month" id="tiP1" value="'+((e.parc&&e.parc[0]&&e.parc[0].mes)||(e.emissao||'').slice(0,7))+'"></label><button type="button" class="btn" data-tipgen>Dividir o total igualmente</button></div>':'')+
    '<div class="tiparc">'+(parc||'<p class="muted">Nenhuma parcela.</p>')+'</div>'+(ed?'<button type="button" class="tiadd" data-tipadd>+ parcela</button>':''))+
   (ed?'<div class="tisalva"><button type="button" class="btn primary" data-tisalva>Salvar compra</button><a class="btn" href="#ti-notas" data-ticancel>Cancelar</a>'+(!e._nova?'<button type="button" class="btn perigo" data-tiexclui>Excluir compra</button>':'')+'</div>':'')}
function tiNotaLeitura(e){
  const kv=(a,b)=>'<div><dt>'+a+'</dt><dd>'+(b||'<span class="muted">–</span>')+'</dd></div>';
  const fmtCnpj=c=>c&&c.length===14?c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'):esc(c||'');
  const hist=(e.hist||[]).map(h=>'<li>'+tiSt(h.st)+'<span>'+tiD(h.em.slice(0,10))+' às '+h.em.slice(11,16)+'</span></li>').join('');
  const itens=(e.itens||[]).map((i,ix)=>'<tr><td class="n">'+(ix+1)+'</td><td class="wr"><b>'+esc(i.desc||'')+'</b>'+(i.obs?'<br><small class="muted">'+esc(i.obs)+'</small>':'')+'</td><td class="n">'+N(+i.qtd||0)+'</td><td class="n">'+R(+i.vu||0)+'</td><td class="n"><b>'+R(+i.vt||0)+'</b></td><td class="wr">'+((i.dest||[]).length?i.dest.map(d=>'<span class="tidtag">'+N(+d.q||0)+'× '+[d.setor,d.base,d.ct?'CT '+d.ct:''].filter(Boolean).map(esc).join(' · ')+'</span>').join(' '):'<span class="muted">sem destino</span>')+'</td></tr>').join('');
  return '<div class="xg2">'+panel('Dados da nota','',
     '<dl class="tikv">'+kv('Nº da nota',e.num?esc(e.num)+(e.serie?' · série '+esc(e.serie):''):'')+kv('Data de emissão',e.emissao?tiD(e.emissao):'')+kv('Fornecedor',esc(tiFornNome(e)))+kv('Razão social',esc(e.razao||''))+kv('CNPJ',fmtCnpj(e.cnpj))+kv('Chave de acesso',e.chave?'<code class="tichave">'+esc(e.chave.replace(/(\d{4})/g,'$1 ').trim())+'</code>':'')+kv('Gerencial',esc(e.ger||''))+kv('Valor total','<b>'+R(+e.total||0)+'</b>')+kv('Observação',esc(e.obs||''))+'</dl>')+
   panel('Parcelas e situação','',
     '<table class="utab"><thead><tr><th>Parcela</th><th>Mês</th><th class="n">Valor</th></tr></thead><tbody>'+((e.parc||[]).map((p,j)=>'<tr><td>'+(j+1)+'ª</td><td>'+MESES[+p.mes.slice(5)-1]+'/'+p.mes.slice(0,4)+'</td><td class="n">'+R(+p.v||0)+'</td></tr>').join('')||'<tr><td colspan="3" class="muted">Sem parcelas</td></tr>')+'</tbody></table>'+
     '<div class="tihist"><small>Histórico da nota</small>'+(hist?'<ul>'+hist+'</ul>':'<p class="muted">'+tiSt(e.st)+' (sem registro de datas)</p>')+'</div>')+'</div>'+
   panel('Itens da nota',(e.itens||[]).length+' itens · com observação e destino informados pelo setor de compras','<div class="tw"><table class="utab"><thead><tr><th class="n">#</th><th>Produto</th><th class="n">Qtd</th><th class="n">V. unit.</th><th class="n">V. total</th><th>Destino</th></tr></thead><tbody>'+(itens||'<tr><td colspan="6" class="muted">Nenhum item</td></tr>')+'</tbody></table></div>')}
/* leitura do PDF */
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',PDFW='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let PDFJS_P=null;
function tiPdfLib(){if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);if(PDFJS_P)return PDFJS_P;
  PDFJS_P=new Promise((ok,er)=>{const add=id=>{const t=document.getElementById(id);if(!t){er(new Error('leitor de PDF ausente'));return}const sc=document.createElement('script');sc.type='module';sc.textContent=t.textContent;document.head.appendChild(sc)};
    window.__pdfOk=()=>ok(window.pdfjsLib);add('pdfjs-w');setTimeout(()=>add('pdfjs-m'),0);setTimeout(()=>{if(!window.pdfjsLib)er(new Error('leitor de PDF não iniciou'))},20000)});return PDFJS_P}
async function tiPdfTexto(buf){const pj=await tiPdfLib();
  const doc=await pj.getDocument({data:buf}).promise;let out=[];const imgs=[];
  for(let p=1;p<=doc.numPages;p++){const pg=await doc.getPage(p),tc=await pg.getTextContent();const ls=new Map();
    for(const it of tc.items){if(!it.str)continue;const y=Math.round(it.transform[5]/2.5);if(!ls.has(y))ls.set(y,[]);ls.get(y).push({x:it.transform[4],w:it.width,s:it.str})}
    const ys=[...ls.keys()].sort((a,b)=>b-a);for(const y of ys){const a=ls.get(y).sort((u,v)=>u.x-v.x);let l='',fx=null;for(const c of a){if(fx!=null){const gap=c.x-fx;l+=gap>6?'   ':gap>1?' ':''}l+=c.s;fx=c.x+c.w}out.push(l)}
    out.push('');doc._pg=doc._pg||[];doc._pg.push(pg)}
  return {texto:out.join('\n'),doc}}
async function tiPdfImagens(doc){const bl=[];for(const pg of (doc._pg||[]).slice(0,4)){const vp=pg.getViewport({scale:2});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;bl.push(await new Promise(r=>cv.toBlob(r,'image/png')))}return bl}
function tiParseDanfe(t){
  const nb=s=>tiNum(s),r={itens:[],parc:[]};let m;
  if(m=t.match(/N[º°o]\.?\s*([\d.]{3,})/))r.num=String(parseInt(m[1].replace(/\./g,''),10));
  if(m=t.match(/S[ÉE]RIE[:\s]*(\d{1,3})/i))r.serie=m[1].padStart(3,'0');
  if(m=t.match(/((?:\d{4}\s?){10}\d{4})/))r.chave=m[1].replace(/\s/g,'');
  if(m=t.match(/RECEBEMOS DE\s+(.+?)\s+OS PRODUTOS/i))r.razao=m[1].trim();
  if(m=t.match(/EMISS[ÃA]O:?\s*(\d{2})\/(\d{2})\/(\d{4})/i))r.emissao=m[3]+'-'+m[2]+'-'+m[1];
  if(m=t.match(/VALOR TOTAL:?\s*R\$\s*([\d.]+,\d{2})/i))r.total=nb(m[1]);
  else if(m=t.match(/VALOR TOTAL DA NOTA[\s\S]{0,400}?\n([^\n]*)/i)){const ns=m[1].match(/[\d.]+,\d{2}/g);if(ns)r.total=nb(ns[ns.length-1])}
  const cn=[...t.matchAll(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g)].map(x=>x[1]).filter(c=>!c.startsWith('19.859.525'));if(cn[0])r.cnpj=cn[0].replace(/\D/g,'');
  let last=null,prod=false,pend='';
  const cab=/VALOR|C[ÓO]DIGO|PROD\.|DESCRI|UNID|AL[ÍI]QUOTA|ICMS|IPI|NCM|CFOP|CSOSN|QUANT|DADOS DO PRODUTO/i;
  for(const l of t.split('\n')){
    if(/DADOS DO PRODUTO|CONTINUA[ÇC][ÃA]O DOS DADOS DO PRODUTO/i.test(l)){prod=true;pend='';continue}
    if(/DADOS ADICIONAIS|IDENTIFICA[ÇC]A?O DO EMITENTE|C[ÁA]LCULO DO ISSQN|INFORMA[ÇC][ÕO]ES COMPLEMENTARES/i.test(l)){if(pend&&last)last.desc+=' '+pend;prod=false;last=null;pend='';continue}
    if(!prod)continue;
    const x=l.match(/^\s*(\S+)\s+(?:(.+?)\s+)?(\d{8})\s+.*?\b([A-Za-z]{1,6})\s+([\d.]*\d,\d{2,4})\s+([\d.]*\d,\d{2,10})\s+([\d.]*\d,\d{2})/);
    if(x&&!/^\d{8}$/.test(x[1])){let d=(x[2]||'').trim();
      if(!d){d=pend;pend=''}else if(pend&&last){last.desc+=' '+pend;pend=''}
      last={cod:x[1],desc:d,ncm:x[3],un:x[4],qtd:nb(x[5]),vu:nb(x[6]),vt:nb(x[7]),dest:[]};r.itens.push(last);continue}
    const s2=l.trim();if(!s2||cab.test(s2)||/^[\d.,\s]+$/.test(s2))continue;
    if(pend&&last){last.desc+=' '+pend}pend=s2}
  if(pend&&last)last.desc+=' '+pend;
  r.itens.forEach(i=>i.desc=i.desc.replace(/\s+/g,' ').trim());
  const fat=t.split(/FATURA|DUPLICATA/i).slice(1).join(' ');
  for(const d of fat.matchAll(/(\d{2})\/(\d{2})\/(\d{4})\s+(?:R\$\s*)?([\d.]+,\d{2})/g))r.parc.push({mes:d[3]+'-'+d[2],v:nb(d[4])});
  const soma=r.itens.reduce((s,i)=>s+i.vt,0);r.ok=!!(r.itens.length&&r.total&&Math.abs(soma-r.total)<.05);return r}
const TI_PROMPT='Você recebe uma nota fiscal eletrônica brasileira (DANFE). Extraia os dados e responda SOMENTE com um objeto JSON neste formato: {"num":"961","serie":"002","chave":"44 dígitos sem espaços","emissao":"AAAA-MM-DD","razao":"razão social do EMITENTE","cnpj":"CNPJ do EMITENTE só dígitos","total":8726.00,"itens":[{"cod":"997","desc":"HD SSD 240GB","qtd":3,"vu":390.00,"vt":1170.00}],"parc":[{"venc":"AAAA-MM-DD","v":0.00}]}. O destinatário é a CGB ENERGIA (não use o CNPJ dela como emitente). Números com ponto decimal. "parc" vem da seção FATURA/DUPLICATAS; se não houver, use []. Não invente dados: campo ausente fica "" ou 0.';
function tiParseXml(txt){const d=new DOMParser().parseFromString(txt,'application/xml');const q=(el,t)=>{const x=el&&el.getElementsByTagName(t)[0];return x?x.textContent.trim():''};
  const inf=d.getElementsByTagName('infNFe')[0];if(!inf)return null;const ide=inf.getElementsByTagName('ide')[0],emit=inf.getElementsByTagName('emit')[0],tot=inf.getElementsByTagName('ICMSTot')[0];
  const r={num:String(parseInt(q(ide,'nNF')||'0',10)||''),serie:(q(ide,'serie')||'').padStart(3,'0'),chave:(inf.getAttribute('Id')||'').replace(/\D/g,''),emissao:(q(ide,'dhEmi')||q(ide,'dEmi')).slice(0,10),
    razao:q(emit,'xNome'),cnpj:q(emit,'CNPJ')||q(emit,'CPF'),total:+q(tot,'vNF')||0,itens:[],parc:[]};
  for(const det of inf.getElementsByTagName('det')){const p=det.getElementsByTagName('prod')[0];r.itens.push({cod:q(p,'cProd'),desc:q(p,'xProd'),ncm:q(p,'NCM'),un:q(p,'uCom'),qtd:+q(p,'qCom')||0,vu:+q(p,'vUnCom')||0,vt:+q(p,'vProd')||0,dest:[]})}
  for(const dp of inf.getElementsByTagName('dup')){const v=q(dp,'dVenc');if(v)r.parc.push({mes:v.slice(0,7),v:+q(dp,'vDup')||0})}
  r.ok=!!(r.itens.length&&r.total);return r}
function tiMesclar(e,r){const tok=s=>new Set(String(s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').split(/[^A-Z0-9]+/).filter(w=>w.length>1));
  const sim=(a,b)=>{const A=tok(a),B=tok(b);let k=0;A.forEach(w=>{if(B.has(w))k++});return k/Math.max(1,Math.min(A.size,B.size))};
  const pend=e.itens.filter(i=>i.desc&&String(i.desc).trim()),usados=new Set();let casou=0;
  const novos=r.itens.map(ni=>{let best=-1,bs=0;pend.forEach((p,ix)=>{if(usados.has(ix))return;const v=sim(ni.desc,p.desc);if(v>bs){bs=v;best=ix}});
    if(best>=0&&bs>=.5){usados.add(best);casou++;const p=pend[best];let rest=+ni.qtd||0;return Object.assign(ni,{obs:p.obs||'',dest:(p.dest||[]).map(d=>{const q=Math.min(+d.q||0,rest);rest-=q;return Object.assign({},d,{q})}).filter(d=>d.q>0)})}
    return Object.assign(ni,{dest:[],obs:''})});
  const sobra=pend.filter((p,ix)=>!usados.has(ix)).map(p=>Object.assign({},p,{foraNota:1}));
  e.itens=novos.concat(sobra);e._mescla={casou,sobra:sobra.length,total:r.itens.length}}
async function tiLerArquivo(f){
  TIE._file=f;TIE.pdfNome=f.name;TIE_MSG='';const ehPdf=/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name);
  const passo=s=>{TIE_LENDO=s;render()};
  const ehXml=/xml$/i.test(f.type)||/\.xml$/i.test(f.name);
  try{let r=null,texto='',doc=null,abriu=true;let via='leitura direta do PDF (sem IA)';
    if(ehXml){passo('Lendo o XML da nota…');r=tiParseXml(await f.text());via='leitura do XML (sem IA)';if(!r)throw {m:'Este XML não é de uma nota fiscal eletrônica (NF-e). Confira o arquivo ou preencha à mão.'}}
    else if(ehPdf){passo('Abrindo o PDF…');try{const o=await tiPdfTexto(await f.arrayBuffer());texto=o.texto;doc=o.doc}catch(e){texto='';abriu=false}
      if(texto.trim().length>200){r=tiParseDanfe(texto)}}
    const pareceDanfe=/DANFE|DOCUMENTO AUXILIAR DA NOTA FISCAL|CHAVE DE ACESSO/i.test(texto);
    const comIA=TIE._usarIA;TIE._usarIA=0;
    if((!r||!r.ok)&&!comIA){
      if(r&&r.itens&&r.itens.length){/* leitura parcial: aproveita o que achou */}
      else throw {m:!abriu?'Não consegui abrir este PDF. Ele pode estar protegido por senha ou corrompido. Tente o XML da nota ou preencha à mão.':ehPdf&&texto.trim().length<=200?'Este PDF parece ser uma imagem escaneada, sem texto. Sem a IA não dá para ler: anexe o XML da nota ou preencha à mão.':ehPdf&&!pareceDanfe?'Este arquivo não parece ser uma nota fiscal (DANFE). A leitura sem IA funciona com o PDF da DANFE ou com o XML da nota. Preencha à mão: o PDF fica anexado à compra mesmo assim.':!ehPdf&&!ehXml?(/^image\//.test(f.type)?'Para ler foto da nota é preciso a IA do Claude. Sem ela, anexe o PDF da DANFE ou o XML da nota.':'Este tipo de arquivo não é aceito. Anexe o PDF da DANFE ou o XML da nota.'):'Não consegui ler este modelo de nota sem IA. Preencha à mão: o PDF fica anexado à compra para consulta. Se puder, anexe também o XML da nota.'}}
    if((!r||!r.ok)&&comIA&&SAMPLE){
      via='inteligência artificial';let imgs=[];
      if(!ehPdf)imgs=[f];else if(texto.trim().length<=200&&doc){passo('A nota parece escaneada. Preparando as páginas…');imgs=await tiPdfImagens(doc)}
      passo('O Claude está lendo a nota… (pode levar até 1 minuto)');
      const j=await SAMPLE.json(imgs.length?TI_PROMPT+'\n\nA nota está nas imagens anexadas.':TI_PROMPT+'\n\nTexto extraído do PDF:\n'+texto.slice(0,60000),imgs.length?{images:imgs}:{});
      r={num:String(j.num||'').replace(/^0+/,''),serie:j.serie||'',chave:String(j.chave||'').replace(/\D/g,''),emissao:j.emissao||'',razao:j.razao||'',cnpj:String(j.cnpj||'').replace(/\D/g,''),total:tiNum(j.total),
        itens:(j.itens||[]).map(i=>({cod:String(i.cod||''),desc:String(i.desc||'').trim(),qtd:tiNum(i.qtd),vu:tiNum(i.vu),vt:tiNum(i.vt)||tiNum(i.qtd)*tiNum(i.vu),dest:[]})),parc:(j.parc||[]).filter(p=>p.venc).map(p=>({mes:String(p.venc).slice(0,7),v:tiNum(p.v)}))}}
    const e=TIE;['num','serie','chave','emissao','razao','cnpj'].forEach(k=>{if(r[k])e[k]=r[k]});if(r.total)e.total=r.total;
    if(r.itens.length){if(e.itens.some(i=>i.desc&&String(i.desc).trim()))tiMesclar(e,r);else e.itens=r.itens.map(i=>Object.assign(i,{dest:[],obs:''}))}if(e.st==='aguardando'||e.st==='nd'){e.st='comigo';e._chegou=1}
    e.parc=r.parc.length?r.parc:[{mes:(e.emissao||tiMesAtual()).slice(0,7),v:+e.total||0}];
    const conhecido=e.cnpj&&(TI_CFG.forn[e.cnpj]||TI_SEED.forn[e.cnpj]);if(conhecido)e.forn=conhecido;else if(!e.forn)e.forn=e.razao;
    const soma=e.itens.filter(i=>!i.foraNota).reduce((s,i)=>s+i.vt,0);
    TIE_MSG=(e._mescla?'A nota chegou! '+e._mescla.casou+' de '+e._mescla.total+' itens foram ligados aos que você já tinha anotado (mantive observação e destino).'+(e._mescla.sobra?' '+e._mescla.sobra+' item(ns) anotado(s) não aparecem na nota: estão marcados abaixo para você conferir. ':' '):'')+'Nota lida por '+via+': '+e.itens.filter(i=>!i.foraNota).length+' itens, total '+R(+e.total||0)+(Math.abs(soma-(+e.total||0))<.05?' (a soma dos itens confere).':' — confira: a soma dos itens dá '+R(soma)+'.')+(conhecido?'':' Fornecedor novo: confira o nome em "Fornecedor".')+(r.parc.length?'':' A nota não traz parcelas: deixei 1 parcela no mês da emissão.')}
  catch(err){const c=err&&err.code;TIE_MSG='!'+(err&&err.m?err.m:c==='not_granted'?'Você não autorizou o Claude a ler a nota. Preencha à mão ou tente de novo e autorize.':c==='rate_limited'?'Muitas leituras seguidas. Espere um pouco e tente de novo.':c==='invalid_json'?'O Claude não conseguiu organizar os dados desta nota. Tente de novo ou preencha à mão.':'Não consegui ler esta nota ('+(err&&(err.message||err.code)||'erro')+'). Preencha à mão.')}
  TIE_LENDO=false;render()}
/* visualizar a nota anexada */
async function tiVerNota(id){const n=tiNotas().find(x=>x.id===id)||(TIE&&TIE.id===id?TIE:null);if(!n||!n.pdf)return;
  document.querySelectorAll('.tiver-fundo').forEach(x=>x.remove());const url=n.pdf.url||('/_blob/'+n.pdf.id);
  const w=document.createElement('div');w.className='tiver-fundo';w.innerHTML='<div class="tiver" role="dialog" aria-label="Nota fiscal"><div class="tiver-h"><div><small>Nota anexada</small><b>'+(n.num?'NF '+esc(n.num):'Compra')+' · '+esc(tiFornNome(n))+'</b><span>'+tiD(n.emissao)+' · '+R(+n.total||0)+'</span></div><div class="tiver-a"><a class="btn" href="'+esc(url)+'" download="'+esc(n.pdf.nome||'nota.pdf')+'" target="_blank" rel="noopener">Baixar PDF</a><button type="button" class="tigav-x" data-fecha aria-label="Fechar">×</button></div></div><div class="tiver-b"><div class="pm-load"><i></i>Abrindo a nota…</div></div></div>';
  document.body.appendChild(w);const esc_=ev=>{if(ev.key==='Escape')fecha()};const fecha=()=>{w.remove();document.removeEventListener('keydown',esc_)};document.addEventListener('keydown',esc_);
  w.onclick=ev=>{if(ev.target===w||ev.target.closest('[data-fecha]'))fecha()};
  const corpo=w.querySelector('.tiver-b');
  try{const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);const buf=await r.arrayBuffer();const pj=await tiPdfLib();const doc=await pj.getDocument({data:buf}).promise;corpo.innerHTML='';
    const larg=Math.min(900,corpo.clientWidth-24);
    for(let p=1;p<=doc.numPages;p++){const pg=await doc.getPage(p),v0=pg.getViewport({scale:1}),sc=larg/v0.width,vp=pg.getViewport({scale:sc*Math.min(2,devicePixelRatio||1)});const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;c.style.width=larg+'px';corpo.appendChild(c);await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise}}
  catch(err){corpo.innerHTML='<div class="note err">Não consegui mostrar a nota aqui ('+esc(err.message||'erro')+'). Use o botão "Baixar PDF".</div>'}}
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('[data-tiver]');if(b){ev.preventDefault();tiVerNota(b.dataset.tiver)}});

/* salvar */
async function tiSalvarCfg(){if(!tiGrava())return;delete TI_CFG.semAntigos;await DBX.doc('ti_cfg/geral').set({j:JSON.stringify(TI_CFG),em:new Date().toISOString()})}
async function tiSalvar(){const e=TIE;document.activeElement&&document.activeElement.blur&&document.activeElement.blur();if(!(e.parc||[]).length&&(+e.total||0)>0)e.parc=[{mes:(e.emissao||tiMesAtual()).slice(0,7),v:+e.total}];const av=tiAvisos(e).filter(a=>a[0]==='x'&&/já está cadastrada/.test(a[1]));if(av.length&&!confirm('Esta nota parece já estar cadastrada. Salvar mesmo assim?'))return;
  const b=document.querySelector('[data-tisalva]');if(b){b.disabled=true;b.textContent='Salvando…'}
  try{if(e._file&&ASSETS&&tiGrava()){const up=await ASSETS.upload(e._file);e.pdf={id:up.id,url:up.url,nome:e._file.name}}}catch(x){toast('Não consegui guardar o PDF ('+(x.message||x.code||'erro')+'). A compra será salva sem o arquivo.')}
  const n=JSON.parse(JSON.stringify(e,(k,v)=>k.startsWith('_')?undefined:v));n.itens.forEach(i=>{delete i.semQ;i.dest=(i.dest||[]).filter(d=>+d.q>0)});
  const old=tiNotas().find(x=>x.id===n.id);if(!old||old.st!==n.st){n.stEm=new Date().toISOString();n.hist=((old&&old.hist)||[]).concat([{st:n.st,em:n.stEm}])}
  if(n.cnpj&&n.forn&&!(TI_SEED.forn[n.cnpj]===n.forn)&&TI_CFG.forn[n.cnpj]!==n.forn){TI_CFG.forn[n.cnpj]=n.forn;try{await tiSalvarCfg()}catch(x){}}
  TI_DB[n.id]=n;TI_VER++;let ok=true;
  if(tiGrava()){try{await DBX.doc('ti_notas/'+n.id).set({j:JSON.stringify(n),em:new Date().toISOString()})}catch(x){ok=false;toast('Não foi possível salvar para todos ('+(x.message||x.code)+'). Ficou só nesta tela.')}}
  if(ok)toast(tiGrava()?'Compra salva.':'Modo de teste: a compra aparece só nesta tela e some ao recarregar a página.');TIE=null;location.hash='ti-notas'}
async function tiMudaSt(id,st){const base=TI_DB[id]||TI_SEED.notas.find(x=>x.id===id);if(!base)return;const n=JSON.parse(JSON.stringify(base));n.st=st;n.stEm=new Date().toISOString();n.hist=(n.hist||[]).concat([{st,em:n.stEm}]);TI_DB[id]=n;TI_VER++;render();
  if(tiGrava()){try{await DBX.doc('ti_notas/'+id).set({j:JSON.stringify(n),em:n.stEm});toast('Situação atualizada: '+TI_ST[st].t+'.')}catch(x){toast('Não foi possível salvar ('+(x.message||x.code)+').')}}}
async function tiExcluir(){const e=TIE;if(!confirm('Excluir esta compra? Esta ação não pode ser desfeita.'))return;TI_DB[e.id]={del:true};TI_VER++;
  if(tiGrava()){try{await DBX.doc('ti_notas/'+e.id).set({j:JSON.stringify({del:true}),em:new Date().toISOString()})}catch(x){toast('Não foi possível excluir para todos.')}}TIE=null;location.hash='ti-notas'}
async function tiCarregar(db){let mud=false;
  try{const c=(await db.doc('ti_cfg/geral').get()).data();if(c&&c.j){Object.assign(TI_CFG,JSON.parse(c.j));mud=true}}catch(e){}
  try{const s=await db.collection('ti_notas').get();const docs=s.docs||s;(docs||[]).forEach(d=>{const v=d.data?d.data():d;const id=d.id;if(v&&v.j&&id){TI_DB[id]=JSON.parse(v.j);mud=true}})}catch(e){}
  if(await aqCarregar(db))mud=true;
  if(mud)TI_VER++;return mud}
async function tiXls(tipo){if(tipo==='fin'){const L=tiFiltra(tiNotas()).filter(n=>n.st!=='aguardando');const rows=L.flatMap(n=>n.itens.flatMap(i=>{const vu=i.qtd?i.vt/i.qtd:0;const ds=(i.dest||[]).length?i.dest:[{q:i.qtd}];return ds.map(d=>({'Nº da nota':n.num,'Série':n.serie||'','Fornecedor':n.fornN,'CNPJ':n.cnpj||'','Emissão':tiD(n.emissao),'Situação':TI_ST[n.st].t,'Produto':i.desc,'Observação':i.obs||'','Qtd':+d.q||0,'Valor unitário':vu,'Valor':vu*(+d.q||0),'Contrato':d.ct||'','Setor':d.setor||'','Base':d.base||'','Parcelas':(n.parc||[]).map(p=>tiMesN(p.mes)+' '+nf2.format(p.v)).join(' | '),'Chave de acesso':n.chave||''}))}));
  try{await lib(XLSX_URL);const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Rateio');await salvarArquivo('ti_relatorio_financeiro.xlsx',new Blob([XLSX.write(wb,{type:'array',bookType:'xlsx'})]))}catch(e){toast('Não consegui gerar o Excel.')}return}const L=tiFiltra(tiNotas(),{semSt:tipo==='financeiro'});let rows;
  if(tipo==='financeiro')rows=L.filter(n=>n.st!=='nd').map(n=>({'Nº da nota':n.num,'Série':n.serie||'','Fornecedor':n.fornN,'CNPJ':n.cnpj||'','Emissão':tiD(n.emissao),'Valor total':n.total,'Parcelas':(n.parc||[]).map(p=>tiMesN(p.mes)+' '+nf2.format(p.v)).join(' | '),'Situação':TI_ST[n.st].t,'Desde':n.stEm?tiD(n.stEm.slice(0,10)):'','Chave de acesso':n.chave||''}));
  else rows=L.flatMap(n=>n.itens.flatMap(i=>{const ds=(i.dest||[]).length?i.dest:[{q:i.qtd}];return ds.map(d=>({'Nº da nota':n.num,'Fornecedor':n.fornN,'Emissão':tiD(n.emissao),'Situação':TI_ST[n.st].t,'Produto':i.desc,'Qtd do item':i.qtd,'Valor unitário':i.qtd?i.vt/i.qtd:0,'Qtd no destino':+d.q||0,'Valor no destino':(i.qtd?i.vt/i.qtd:0)*(+d.q||0),'Contrato':d.ct||'','Base':d.base||'','Setor':d.setor||'','Parcelas':(n.parc||[]).map(p=>tiMesN(p.mes)).join(', ')}))}));
  try{await lib(XLSX_URL);const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,tipo==='financeiro'?'Notas':'Compras');await salvarArquivo(tipo==='financeiro'?'ti_prestacao_de_contas.xlsx':'ti_compras.xlsx',new Blob([XLSX.write(wb,{type:'array',bookType:'xlsx'})]))}catch(e){toast('Não consegui gerar o Excel.')}}
function ligarTI(){const m=$('main');if(!m)return;ligarAQ();document.querySelectorAll('body > .tigav, body > .tigav-fundo').forEach(x=>x.remove());
  m.querySelectorAll('[data-tif]').forEach(el=>{const ev=el.tagName==='INPUT'?'input':'change';let t;el.addEventListener(ev,()=>{clearTimeout(t);t=setTimeout(()=>{TIF[el.dataset.tif]=el.value;TIF.n=20;const p=el.selectionStart;render();if(el.tagName==='INPUT'){const n=document.querySelector('[data-tif="q"]');if(n){n.focus();try{n.setSelectionRange(p,p)}catch(e){}}}},el.tagName==='INPUT'?250:0)})});
  m.querySelectorAll('[data-tilimpa]').forEach(b=>b.onclick=()=>{TIF={mes:'',ct:'',base:'',setor:'',forn:'',st:'',q:'',n:20};render()});
  m.querySelectorAll('[data-tifab]').forEach(b=>b.onclick=()=>{TI_FOPEN=!TI_FOPEN;TIF_D=null;render()});
  m.querySelectorAll('[data-tifecha]').forEach(b=>b.onclick=()=>{TI_FOPEN=false;TIF_D=null;render()});
  m.querySelectorAll('[data-tifd]').forEach(el=>el.onchange=()=>{TIF_D[el.dataset.tifd]=el.value});
  const tok=m.querySelector('[data-tifok]');if(tok)tok.onclick=()=>{Object.keys(TI_FL).forEach(k=>TIF[k]=TIF_D[k]||'');TIF.n=20;TI_FOPEN=false;TIF_D=null;render()};
  const tfl=m.querySelector('[data-tifl]');if(tfl)tfl.onclick=()=>{Object.keys(TI_FL).forEach(k=>{TIF[k]='';TIF_D[k]=''});m.querySelectorAll('[data-tifd]').forEach(x=>x.value='')};
  m.querySelectorAll('.tigav-fundo,.tigav').forEach(x=>document.body.appendChild(x));
  if(TI_FOPEN&&!ligarTI._esc){ligarTI._esc=1;document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&TI_FOPEN){TI_FOPEN=false;TIF_D=null;render()}})}
  m.querySelectorAll('[data-tirmf]').forEach(b=>b.onclick=()=>{TIF[b.dataset.tirmf]='';render()});
  m.querySelectorAll('[data-tiset]').forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.tiset.split('|');TIF[k]=TIF[k]===v?'':v;render()});
  m.querySelectorAll('[data-tist]').forEach(b=>b.onclick=()=>{TIF.st=b.dataset.tist;TIF.n=20;render()});
  m.querySelectorAll('[data-tivis]').forEach(b=>b.onclick=()=>{TI_VISAO=b.dataset.tivis;render()});
  m.querySelectorAll('[data-timetaab]').forEach(b=>b.onclick=()=>{TI_METAED=!TI_METAED;render()});
  m.querySelectorAll('[data-tist2]').forEach(b=>b.addEventListener('click',()=>{TIF.st=b.dataset.tist2}));
  m.querySelectorAll('[data-tiperf]').forEach(b=>b.onclick=()=>{TI_VER_COMO=b.dataset.tiperf;TIE=null;if(!tiPode()&&/^#ti-nota-nova/.test(location.hash))location.hash='ti-notas';else render()});
  m.querySelectorAll('[data-tinova]').forEach(b=>b.addEventListener('click',()=>{TI_NOVA_TIPO=b.dataset.tinova;TIE=null}));
  m.querySelectorAll('[data-tinvis]').forEach(b=>b.addEventListener('click',()=>{TI_NVIS=b.dataset.tinvis;if(b.tagName==='BUTTON'||location.hash==='#ti-notas')render()}));
  m.querySelectorAll('[data-tirola]').forEach(b=>b.onclick=ev=>{ev.preventDefault();const p=m.querySelector('.timapa');if(p)p.closest('.panel').scrollIntoView({behavior:'smooth',block:'start'})});
  m.querySelectorAll('[data-timais]').forEach(b=>b.onclick=()=>{TIF.n+=20;render()});
  m.querySelectorAll('[data-tistn]').forEach(s=>s.onchange=()=>tiMudaSt(s.dataset.tistn,s.value));
  m.querySelectorAll('[data-timove]').forEach(b=>b.onclick=()=>{const [id,st]=b.dataset.timove.split('|');tiMudaSt(id,st)});
  m.querySelectorAll('[data-tixls]').forEach(b=>b.onclick=()=>tiXls(b.dataset.tixls));
  const ms=m.querySelector('[data-timetasalva]');if(ms)ms.onclick=async()=>{const g=m.querySelector('[data-timeta="geral"]').value.trim();TI_CFG.meta=g?tiNum(g):null;m.querySelectorAll('[data-timetag]').forEach(i=>{const gr=TI_CFG.grupos[+i.dataset.timetag];if(gr)gr.meta=i.value.trim()?tiNum(i.value):null});TI_VER++;TI_METAED=false;
    try{await tiSalvarCfg();toast(DBX?'Metas salvas para todos.':'Metas aplicadas só nesta tela.')}catch(x){toast('Não foi possível salvar as metas ('+(x.message||x.code)+').')}render()};
  if(!TIE||!m.querySelector('.tiform'))return;const e=TIE;
  const sc=()=>{const y=window.scrollY;render();window.scrollTo(0,y)};
  const man=m.querySelector('[data-timanual]');if(man)man.onclick=()=>{if(!e.itens.length)e.itens.push({desc:'',qtd:1,vu:0,vt:0,dest:[]});render();const f=document.querySelector('[data-tie="num"]');if(f){f.scrollIntoView({block:'center'});f.focus()}};
  const atu=()=>{const b=m.querySelector('.tiav');if(b)b.outerHTML=tiAvHTML(e)};
  const autoParc=()=>{if(e._parcAuto||!(e.parc||[]).length){e._parcAuto=1;e.parc=[{mes:(e.emissao||tiMesAtual()).slice(0,7),v:+e.total||0}];setTimeout(()=>{const y=window.scrollY;render();window.scrollTo(0,y)},0);return true}return false};
  m.querySelectorAll('[data-tie]').forEach(el=>el.onchange=()=>{const k=el.dataset.tie;e[k]=k==='total'?tiNum(el.value):k==='cnpj'?el.value.replace(/\D/g,''):k==='chave'?el.value.replace(/\s/g,''):el.value;
    if(k==='total'){e._totalManual=1;el.value=nf2.format(e.total);if(autoParc())return}if(k==='emissao'&&e._parcAuto&&autoParc())return;if(k==='st'){setTimeout(sc,0);return}atu()});
  m.querySelectorAll('[data-tii]').forEach(el=>el.onchange=()=>{const [i,k]=el.dataset.tii.split('|');const it=e.itens[+i];it[k]=(k==='desc'||k==='obs')?el.value:tiNum(el.value);
    if(k!=='desc'&&k!=='obs'){it.vt=Math.round((+it.qtd||0)*(+it.vu||0)*100)/100;const c=m.querySelector('[data-tivt="'+i+'"]');if(c)c.textContent=R(it.vt);
      if(!e._totalManual){e.total=Math.round(e.itens.reduce((s,x)=>s+(+x.vt||0),0)*100)/100;const t=m.querySelector('[data-tie="total"]');if(t)t.value=nf2.format(e.total);if(autoParc())return}}atu()});
  m.querySelectorAll('[data-tid]').forEach(el=>el.onchange=()=>{const [i,j,k]=el.dataset.tid.split('|');const d=e.itens[+i].dest[+j];d[k]=k==='q'?tiNum(el.value):el.value;atu()});
  m.querySelectorAll('[data-tidadd]').forEach(b=>b.onclick=()=>{const it=e.itens[+b.dataset.tidadd];it.dest=it.dest||[];const dq=it.dest.reduce((s,d)=>s+(+d.q||0),0);const ant=it.dest[it.dest.length-1]||{};it.dest.push({q:Math.max(0,(+it.qtd||0)-dq)||1,ct:ant.ct||'',base:ant.base||'',setor:''});sc()});
  m.querySelectorAll('[data-tidrm]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.tidrm.split('|');e.itens[+i].dest.splice(+j,1);sc()});
  m.querySelectorAll('[data-tiirm]').forEach(b=>b.onclick=()=>{e.itens.splice(+b.dataset.tiirm,1);sc()});
  const ia=m.querySelector('[data-tiiadd]');if(ia)ia.onclick=()=>{e.itens.push({desc:'',qtd:1,vu:0,vt:0,dest:[],obs:''});sc()};
  const dt_=m.querySelector('[data-tidtodos]');if(dt_)dt_.onclick=()=>{const b=prompt('Base para todos os itens (ex.: Bacabal) — deixe vazio para não mudar:','');if(b===null)return;let s=prompt('Setor para todos: ADMINISTRATIVO, GOMAN, GSTC, GERE, SPOT STI ou SPOT BDC — vazio para não mudar:','');if(s===null)return;s=s.trim().toUpperCase();if(s&&!TI_SETORES.includes(s)){alert('Use um destes setores: '+TI_SETORES.join(', '));return}if(s===null)return;const c=prompt('Contrato para todos (127, 169 ou 170) — vazio para não mudar:','');if(c===null)return;
    e.itens.forEach(i=>{i.dest=[{q:+i.qtd||0,ct:c.trim()||(i.dest&&i.dest[0]&&i.dest[0].ct)||'',base:b.trim()||(i.dest&&i.dest[0]&&i.dest[0].base)||'',setor:s.trim().toUpperCase()||(i.dest&&i.dest[0]&&i.dest[0].setor)||''}]});sc()};
  m.querySelectorAll('[data-tip]').forEach(el=>el.onchange=()=>{const [j,k]=el.dataset.tip.split('|');e.parc[+j][k]=k==='v'?tiNum(el.value):el.value;e._parcAuto=0;if(k==='v')el.value=nf2.format(e.parc[+j].v);atu()});
  m.querySelectorAll('[data-tiprm]').forEach(b=>b.onclick=()=>{e.parc.splice(+b.dataset.tiprm,1);e._parcAuto=0;sc()});
  const pa=m.querySelector('[data-tipadd]');if(pa)pa.onclick=()=>{e.parc=e.parc||[];const l=e.parc[e.parc.length-1];let mm=l?l.mes:(e.emissao||tiMesAtual()).slice(0,7);if(l){const [y,mo]=mm.split('-').map(Number);const d=new Date(y,mo,1);mm=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}e.parc.push({mes:mm,v:0});e._parcAuto=0;sc()};
  const pg=m.querySelector('[data-tipgen]');if(pg)pg.onclick=()=>{const n=Math.max(1,Math.min(24,+$('tiNp').value||1)),p1=$('tiP1').value||(e.emissao||tiMesAtual()).slice(0,7);const tot=+e.total||0,v=Math.floor(tot/n*100)/100;let [y,mo]=p1.split('-').map(Number);e.parc=[];
    for(let k=0;k<n;k++){const d=new Date(y,mo-1+k,1);e.parc.push({mes:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),v:k===n-1?Math.round((tot-v*(n-1))*100)/100:v})}e._parcAuto=0;sc()};
  const fi=$('tiFile'),drop=$('tiDrop');if(fi){m.querySelector('[data-tifile]').onclick=()=>fi.click();fi.onchange=()=>{if(fi.files[0])tiLerArquivo(fi.files[0])};
    drop.addEventListener('dragover',ev=>{ev.preventDefault();drop.classList.add('sobre')});drop.addEventListener('dragleave',()=>drop.classList.remove('sobre'));drop.addEventListener('drop',ev=>{ev.preventDefault();drop.classList.remove('sobre');const f=ev.dataTransfer.files[0];if(f&&!TIE_LENDO)tiLerArquivo(f)})}
  const btIA=m.querySelector('[data-tiia]');if(btIA)btIA.onclick=()=>{e._usarIA=1;tiLerArquivo(e._file)};
  const sv=m.querySelector('[data-tisalva]');if(sv)sv.onclick=tiSalvar;const ex=m.querySelector('[data-tiexclui]');if(ex)ex.onclick=tiExcluir;
  const ca=m.querySelector('[data-ticancel]');if(ca)ca.onclick=()=>{TIE=null}}
