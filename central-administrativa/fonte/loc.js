/* ===== CONTROLE DE LOCAÇÃO ===== */
const LOC=RAW.loc||{imv:[],ren:[],grp:{},tot:{}};
const LBASE={BCB:'Bacabal',PDT:'Presidente Dutra',STI:'Santa Inês',BDC:'Barra do Corda',ITM:'Itapecuru',PDS:'Pedreiras'};
const lbn=b=>LBASE[b]||b||'–';
let LF={b:'',ct:'',mes:''},LSEC='grade',LST='',LLINK={},LVER=0,LCK='',LCACHE=null;
const L_MESES=(()=>{const s=new Set();Object.values(LOC.grp).forEach(g=>Object.keys(g.m).forEach(m=>s.add(m)));return [...s].filter(m=>m<='2026-12').sort()})();
const lHoje=()=>new Date(CUT||Date.now());
const lMesRef=()=>{if(LF.mes)return LF.mes;let best=L_MESES[0];for(const m of L_MESES){let t=0,b=0;Object.values(LOC.grp).forEach(g=>(g.m[m]||[]).forEach(p=>{t++;b+=p[1]}));if(t&&b/t>=.5)best=m}return best};
const lCtG=c=>c==='127'?'127':c==='169'||c==='170'?'169/170':c||'–';
const lAtivoEm=(i,m)=>{const a=m+'-01',z=m+'-31';return (!i.ini||i.ini<=z)&&(!i.fim||i.fim>=a)};
const lDias=d=>d?Math.round((Date.parse(d)-lHoje())/864e5):null;
function lCalc(){const k=LVER+'|';if(LCACHE&&LCK===k)return LCACHE;
  const I=LOC.imv.map(i=>Object.assign({},i,{gg:LLINK[i.id]||(LOC.grp[i.g]?i.g:null),pm:{}}));
  const porG={};I.forEach(i=>{if(i.gg)(porG[i.gg]=porG[i.gg]||[]).push(i)});
  for(const [g,lst] of Object.entries(porG)){const G=LOC.grp[g];if(!G)continue;
    for(const [m,ps] of Object.entries(G.m)){let A=lst.filter(i=>i.st==='ATIVO'&&lAtivoEm(i,m));if(!A.length)A=lst.filter(i=>lAtivoEm(i,m));if(!A.length)A=lst;
      const ac=new Map(A.map(i=>[i,[0,0]]));
      ps.slice().sort((a,b)=>b[0]-a[0]).forEach(p=>{let best=A[0],bd=1e18;for(const i of A){const s=ac.get(i),need=i.v-s[0]-s[1],d=Math.abs(need-p[0]);if(d<bd){bd=d;best=i}}const s=ac.get(best);s[p[1]?0:1]+=p[0]});
      ac.forEach((s,i)=>{i.pm[m]=s})}}
  const st=(i,m)=>{const at=lAtivoEm(i,m)&&(i.st==='ATIVO'||i.pm[m]);if(!at)return 'fora';if(!i.gg)return 'nid';const s=i.pm[m]||[0,0];if(i.v&&s[0]>=i.v*.95)return 'pago';if(s[0]>0)return 'parc';if(s[1]>0)return 'aber';return 'sem'};
  I.forEach(i=>{i.sm={};L_MESES.forEach(m=>i.sm[m]=st(i,m))});
  const usados=new Set(I.map(i=>i.gg).filter(Boolean));
  LCACHE={I,soltos:Object.entries(LOC.grp).filter(([g])=>!usados.has(g)).map(([g,G])=>Object.assign({g},G))};LCK=k;return LCACHE}
const L_ST={pago:['Pago','#3C9E18'],parc:['Pago em parte','#d98a00'],aber:['Lançado, sem baixa','#2f6fb3'],sem:['Sem pagamento','#C00000'],nid:['Pagamento não identificado','#8a7f82'],fora:['Fora do contrato','transparent']};
const lFiltra=L=>L.filter(i=>(!LF.b||i.b===LF.b)&&(!LF.ct||lCtG(i.ct)===LF.ct));
function lPillSt(s){const x=L_ST[s];return '<span class="lst" style="--c:'+x[1]+'"><i></i>'+x[0]+'</span>'}
function lSel(k,lab,ops){return '<label class="lsel"><small>'+lab+'</small><select data-lf="'+k+'">'+ops.map(([v,t])=>'<option value="'+esc(v)+'"'+(LF[k]===v?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label>'}
function lRank(pares){const t=pares.reduce((s,x)=>s+x[1],0);return '<div class="tirank">'+pares.map(([k,v,sub])=>'<div class="tirank-r"><span>'+esc(k)+(sub?'<br><small class="muted">'+sub+'</small>':'')+'</span><i><em style="width:'+(100*v/(pares[0][1]||1))+'%"></em></i><b>'+Rk(v)+'</b><small>'+(t?Math.round(100*v/t)+'%':'')+'</small></div>').join('')+'</div>'}
PG.locacao=()=>{if(LTIPO!=='loc')return lUtil();const C=lCalc(),I=lFiltra(C.I),at=I.filter(i=>i.st==='ATIVO'),ref=lMesRef(),mr=MES3[+ref.slice(5)-1].toLowerCase()+'/'+ref.slice(2,4);
  const alug=at.reduce((s,i)=>s+i.v,0),prev=m=>I.filter(i=>i.sm[m]!=='fora').reduce((s,i)=>s+i.v,0);
  const soltosF=C.soltos.filter(g=>!LF.b&&(!LF.ct||lCtG(g.ct)===LF.ct));
  const pago=m=>I.reduce((s,i)=>s+((i.pm[m]||[0])[0]),0)+soltosF.reduce((s,g)=>s+(g.m[m]||[]).filter(p=>p[1]).reduce((a,p)=>a+p[0],0),0);
  const stRef=I.filter(i=>i.sm[ref]!=='fora'),cnt=s=>stRef.filter(i=>i.sm[ref]===s),pend=stRef.filter(i=>['sem','aber','parc','nid'].includes(i.sm[ref]));
  const venc=at.filter(i=>i.fim).map(i=>Object.assign(i,{dr:lDias(i.fim)})).sort((a,b)=>a.dr-b.dr),v90=venc.filter(i=>i.dr<=90);
  const enS=k=>at.filter(i=>i.en[2]===k).length,agS=k=>at.filter(i=>i.ag[2]===k).length;
  const bc=(cls,k,v,sub)=>'<div class="bcard '+cls+'"><span>'+k+'</span><b>'+v+'</b><small>'+sub+'</small></div>';
  const pr=prev(ref),pg=pago(ref);
  const cards='<div class="lk">'+bc('','Imóveis ativos',N(at.length),N(I.length-at.length)+' distratados · '+N(at.filter(i=>!i.pj).length)+' pessoa física · '+N(at.filter(i=>i.pj).length)+' empresa')+
    bc('','Aluguel mensal',Rk(alug),'127: '+Rk(at.filter(i=>i.ct==='127').reduce((s,i)=>s+i.v,0))+' · 169/170: '+Rk(at.filter(i=>i.ct!=='127').reduce((s,i)=>s+i.v,0)))+
    bc(pg>=pr*.95?'sup':'par','Pago em '+mr,Rk(pg),P(pr?pg/pr:null)+' do previsto ('+Rk(pr)+')')+
    bc(pend.length?'nao':'sup','Pendentes em '+mr,N(pend.length),N(cnt('sem').length)+' sem pagamento · '+N(cnt('aber').length)+' sem baixa · '+N(cnt('parc').length)+' em parte · '+N(cnt('nid').length)+' a identificar')+
    bc(v90.length?'par':'','Contratos a vencer',N(v90.length),'em até 90 dias · '+N(venc.filter(i=>i.dr<=30).length)+' em 30 dias'+(venc.filter(i=>i.dr<0).length?' · '+N(venc.filter(i=>i.dr<0).length)+' vencido(s)':''))+
    bc('','Caução paga no ano',Rk(LOC.cau||0),'não entra como aluguel')+'</div>';
  const ms=L_MESES.filter(m=>m<='2026-11');
  const ch=colChart(ms.map(m=>({k:'',l:MES3[+m.slice(5)-1],t:mesNome(m),v:pago(m),meta:prev(m),fut:m>ref})),{leg:'Pago (Contas a Pagar)',aria:'Previsto e pago por mês'}).replace('Meta do período','Aluguel previsto nos contratos');
  const stp=['pago','parc','aber','sem','nid'].map(s=>[L_ST[s][0],cnt(s).reduce((a,i)=>a+i.v,0),N(cnt(s).length)+' imóveis']).filter(x=>x[1]);
  const sitRef='<div class="lsit">'+['pago','parc','aber','sem','nid'].map(s=>{const l=cnt(s);return '<button type="button" data-lst="'+s+'" class="'+(LST===s?'on':'')+'" style="--c:'+L_ST[s][1]+'"><i></i><span>'+L_ST[s][0]+'</span><b>'+N(l.length)+'</b><small>'+R(l.reduce((a,i)=>a+i.v,0))+'</small></button>'}).join('')+'</div><p class="tnota">Clique numa situação para ver só esses imóveis na grade abaixo.</p>';
  const porB=Object.keys(LBASE).map(b=>[lbn(b),at.filter(i=>i.b===b).reduce((s,i)=>s+i.v,0),N(at.filter(i=>i.b===b).length)+' imóveis']).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
  const vlist='<div class="lvenc">'+(venc.filter(i=>i.dr<=120).slice(0,12).map(i=>'<div><span class="ldr '+(i.dr<0?'v':i.dr<=30?'a':i.dr<=60?'m':'b')+'">'+(i.dr<0?'vencido':i.dr+' dias')+'</span><b>'+esc(i.im)+'</b><small>'+lbn(i.b)+' · '+esc(i.loc)+' · CT '+i.ct+'</small><em>'+tiD(i.fim)+'</em><strong>'+R(i.v)+'</strong></div>').join('')||'<div class="empty">Nenhum contrato vence nos próximos 120 dias.</div>')+'</div>';
  const cm=k=>ms.map(m=>({l:MES3[+m.slice(5)-1],t:mesNome(m),v:at.reduce((s,i)=>s+((i.cons[m]||[0,0])[k]),0)}));
  const filtros='<div class="lfil">'+lSel('b','Base',[['','Todas']].concat(Object.keys(LBASE).map(b=>[b,lbn(b)])))+lSel('ct','Contrato',[['','Todos'],['127','127'],['169/170','169/170']])+lSel('mes','Mês de referência',[['','Último fechado ('+MES3[+lMesRef0().slice(5)-1].toLowerCase()+')']].concat(ms.map(m=>[m,mesNome(m)])))+'</div>';
  /* detalhe */
  let corpo='';
  if(LSEC==='grade'){const L=(LST?I.filter(i=>i.sm[ref]===LST):I).filter(i=>i.st==='ATIVO'||ms.some(m=>i.pm[m]));
    corpo=panel('Pagamentos por imóvel',N(L.length)+' imóveis'+(LST?' · '+L_ST[LST][0].toLowerCase()+' em '+mr:'')+' · passe o mouse num mês para ver o valor',
     (LST?'<button type="button" class="btn sm" data-lst="'+LST+'">Mostrar todos</button>':'')+'<div class="tw"><table class="utab lgrade"><thead><tr><th>Imóvel</th><th>Base</th><th>CT</th><th class="n">Aluguel</th>'+ms.map(m=>'<th class="c">'+MES3[+m.slice(5)-1]+'</th>').join('')+'</tr></thead><tbody>'+
     L.sort((a,b)=>(a.b+a.loc+a.im).localeCompare(b.b+b.loc+b.im)).map(i=>'<tr><td><a href="#loc-busca" class="lnk" data-lsel="'+i.id+'"><b>'+esc(i.im)+'</b></a><br><small>'+esc(i.lo)+'</small><br><small class="muted">'+esc(i.end||i.loc)+(i.st!=='ATIVO'?' · distratado':'')+'</small></td><td>'+i.b+'</td><td>'+i.ct+'</td><td class="n">'+R(i.v)+'</td>'+ms.map(m=>{const s=i.sm[m],p=i.pm[m]||[0,0];return '<td class="c">'+(s==='fora'?'':'<span class="ldot" style="--c:'+L_ST[s][1]+'" data-tip="'+esc('<b>'+esc(i.im)+' · '+mesNome(m)+'</b><br>'+L_ST[s][0]+'<br>Aluguel: '+R(i.v)+'<br>Pago (com baixa): '+R(p[0])+(p[1]?'<br>Lançado sem baixa: '+R(p[1]):''))+'"></span>')+'</td>'}).join('')+'</tr>').join('')+'</tbody></table></div>'+
     '<div class="dleg">'+['pago','parc','aber','sem','nid'].map(s=>'<span><i style="background:'+L_ST[s][1]+';border-radius:50%"></i>'+L_ST[s][0]+'</span>').join('')+'</div>')}
  else if(LSEC==='conferir'){const nid=I.filter(i=>i.st==='ATIVO'&&!i.gg),pode=DBX&&CAN_EDIT;
    const desc=g=>{const vs=Object.values(g.m).flat().map(p=>p[0]).sort((a,b)=>a-b);return 'Pagamentos em '+g.cid+' · CT '+g.ct+' · valor típico '+R(vs[Math.floor(vs.length/2)]||0)+' · '+Object.keys(g.m).length+' meses'};
    corpo='<div class="note">Estes imóveis ativos não tiveram pagamento ligado automaticamente, porque o nome do locador está diferente na Contas a Pagar (ou o pagamento sai por imobiliária). '+(pode?'Escolha ao lado o grupo de pagamentos certo: a ligação fica salva.':'Quem pode editar o site consegue ligar cada um ao grupo de pagamentos certo.')+'</div>'+
     panel('Imóveis sem pagamento identificado',N(nid.length)+' imóveis',tabela([{h:'Imóvel',w:1,f:i=>'<b data-lid="'+i.id+'">'+esc(i.im)+'</b><br><small class="muted">'+esc(i.loc)+'</small>'},{h:'Base',f:i=>i.b},{h:'CT',f:i=>i.ct},{h:'Aluguel',n:1,f:i=>R(i.v)},{h:'Ligar ao pagamento',w:1,f:i=>pode?'<select class="lligar" data-llink="'+i.id+'"><option value="">Escolha…</option>'+C.soltos.filter(g=>g.ct===i.ct||1).sort((a,b)=>(b.cid===i.loc)-(a.cid===i.loc)||(b.ct===i.ct)-(a.ct===i.ct)).map(g=>'<option value="'+g.g+'">'+esc(desc(g))+'</option>').join('')+'</select>':'<span class="muted">–</span>'}],nid,{}))+
     panel('Pagamentos de aluguel sem imóvel',N(C.soltos.length)+' grupos de pagamento (cada grupo é um mesmo fornecedor)',tabela([{h:'Cidade',f:g=>esc(g.cid)},{h:'CT',f:g=>g.ct},{h:'Meses com pagamento',f:g=>Object.keys(g.m).sort().map(m=>MES3[+m.slice(5)-1]).join(', ')},{h:'Total pago',n:1,f:g=>R(Object.values(g.m).flat().filter(p=>p[1]).reduce((a,p)=>a+p[0],0))}],C.soltos,{}))+
     (Object.keys(LLINK).length&&pode?'<button type="button" class="btn sm" data-llimpa>Desfazer ligações feitas à mão</button>':'')}
  else if(LSEC==='contratos'){corpo=panel('Contratos ativos','do que vence primeiro para o último',tabela([{h:'Imóvel',w:1,f:i=>'<a href="#loc-busca" class="lnk" data-lsel="'+i.id+'"><b>'+esc(i.im)+'</b></a><br><small class="muted">'+esc(i.end||i.loc)+'</small>'},{h:'Locador',w:1,f:i=>esc(i.lo)+'<br><small class="muted">'+(i.pj?'empresa':'pessoa física')+'</small>'},{h:'Base',f:i=>i.b},{h:'CT',f:i=>i.ct},{h:'Início',f:i=>tiD(i.ini)},{h:'Término',f:i=>tiD(i.fim)},{h:'Prazo',f:i=>i.dr==null?'–':'<span class="ldr '+(i.dr<0?'v':i.dr<=30?'a':i.dr<=60?'m':'b')+'">'+(i.dr<0?'vencido':i.dr+' dias')+'</span>'},{h:'Aluguel',n:1,f:i=>'<b>'+R(i.v)+'</b>'},{h:'IPTU',f:i=>esc(i.iptu||'–')}],venc,{}))+
     panel('Renovações em andamento','aba RENOVAÇÕES - BCB',tabela([{h:'Imóvel',w:1,f:r=>'<b>'+esc(r.im)+'</b>'},{h:'Base',f:r=>r.b},{h:'CT',f:r=>r.ct},{h:'Término',f:r=>tiD(r.fim)},{h:'Aluguel',n:1,f:r=>R(r.v)},{h:'Situação',w:1,f:r=>'<span class="tidtag">'+esc(r.st)+'</span>'}],LOC.ren.filter(r=>!LF.b||r.b===LF.b),{}))}
  else{const sts=[...new Set(lStsOrd(at,'en').concat(lStsOrd(at,'ag')))];const nm=s=>s||'Em branco';
    const tabS=(k)=>'<div class="tw"><table class="utab"><thead><tr><th>Situação</th>'+lM3Lab().map(x=>'<th class="n">'+x+'</th>').join('')+'</tr></thead><tbody>'+sts.filter(s=>at.some(i=>i[k].includes(s))).map(s=>'<tr><td><b>'+nm(s)+'</b></td>'+[0,1,2].map(j=>'<td class="n">'+N(at.filter(i=>i[k][j]===s).length)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    const pend=at.filter(i=>['NÃO SAIU','LANÇAR'].includes(i.en[2])||['NÃO SAIU','LANÇAR'].includes(i.ag[2]));
    corpo='<div class="xg2">'+panel('Energia · situação das contas','imóveis ativos',tabS('en'))+panel('Água · situação das contas','imóveis ativos',tabS('ag'))+'</div>'+
     panel('Contas de '+lM3Nome(2)+' a resolver',N(pend.length)+' imóveis com energia ou água "não saiu" ou "lançar"',tabela([{h:'Imóvel',w:1,f:i=>'<b data-lid="'+i.id+'">'+esc(i.im)+'</b><br><small class="muted">'+esc(i.loc)+'</small>'},{h:'Base',f:i=>i.b},{h:'CT',f:i=>i.ct},{h:'Energia · '+lM3Lab()[2].toLowerCase(),f:i=>'<span class="tidtag">'+esc(i.en[2]||'–')+'</span>'},{h:'Água · '+lM3Lab()[2].toLowerCase(),f:i=>'<span class="tidtag">'+esc(i.ag[2]||'–')+'</span>'},{h:'Titular da conta',f:i=>esc(i.tit||'–')}],pend,{}))}
  return '<div class="ubar"><div class="ubar-l"><span class="ubar-ic">'+ico('cad')+'</span><div class="ubar-t"><span class="ubar-tag">Controle de Locação</span><h2>Controle de locação · Aluguel</h2><span>Contratos e aluguel previsto × pago · referência: '+mesNome(ref)+'</span></div></div></div>'+filtros+cards+
   '<div class="xg2">'+panel('Previsto × pago por mês','barra = pago com baixa na Contas a Pagar · traço = aluguel dos contratos',ch)+panel('Situação dos pagamentos em '+mr,'imóveis com contrato no mês',sitRef)+'</div>'+
   '<div class="xg2">'+panel('Aluguel por base','contratos ativos',lRank(porB))+panel('Contratos a vencer','próximos 120 dias',vlist)+'</div>'+
   hSecao('Detalhamento','')+hSeg('data-lsec',LSEC,[['grade','Pagamentos por imóvel'],['conferir','A conferir'],['contratos','Contratos e renovações']])+corpo+
   '<p class="tnota">Fontes: '+esc(LOC.fonte.loc)+' e '+esc(LOC.fonte.cp)+'. CPF/CNPJ e telefone dos locadores não aparecem aqui. Cauções pagas no ano ('+R(LOC.cau||0)+') não entram como aluguel.</p>'};
function lMesRef0(){const s=LF.mes;LF.mes='';const r=lMesRef();LF.mes=s;return r}
async function locCarregar(db){let m=false;try{const s=await db.collection('loc_link').get();const docs=s.docs||s;(docs||[]).forEach(d=>{const v=d.data?d.data():d;if(v&&v.g&&d.id){LLINK[d.id]=v.g;m=true}})}catch(e){}if(m)LVER++;return m}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-lsec],[data-lst],[data-llimpa]');if(!b)return;
  if(b.dataset.lsec){LSEC=b.dataset.lsec;render()}else if(b.dataset.lst!=null){LST=LST===b.dataset.lst?'':b.dataset.lst;LSEC='grade';render()}
  else if(b.hasAttribute('data-llimpa')){if(!confirm('Desfazer todas as ligações feitas à mão?'))return;for(const id of Object.keys(LLINK)){try{await DBX.doc('loc_link/'+id).delete()}catch(x){}}LLINK={};LVER++;render()}});
document.addEventListener('change',async e=>{const s=e.target;if(s.dataset.lf!=null){LF[s.dataset.lf]=s.value;setTimeout(render,0)}
  else if(s.dataset.llink){const id=s.dataset.llink,g=s.value;if(!g)return;LLINK[id]=g;LVER++;try{if(DBX&&CAN_EDIT)await DBX.doc('loc_link/'+id).set({g,em:new Date().toISOString()});toast('Imóvel ligado aos pagamentos.')}catch(x){toast('Não foi possível salvar a ligação para todos.')}setTimeout(render,0)}});

/* ---- visões Água e Energia ---- */
let LTIPO='loc';
const lStsOrd=(at,k)=>{const base=['LANÇADO','LANÇAR','NÃO SAIU','PRYSCILLA','CON. PROPRIO','PG MORADOR','PAGA PELO MORADOR','POÇO ARTESIANO','NÃO SE APLICA','DISTRATADO'];const tem=new Set(at.flatMap(i=>i[k]));return base.filter(x=>tem.has(x)).concat([...tem].filter(x=>x&&!base.includes(x)).sort(),tem.has('')?['']:[])};
const lTipoSeg=()=>'<div class="tiseg ltipo">'+[['loc','Locação (aluguel)'],['agua','Água'],['ener','Energia']].map(([k,t])=>'<button type="button" data-ltipo="'+k+'" class="'+(LTIPO===k?'on':'')+'">'+t+'</button>').join('')+'</div>';
function lUtil(){const ag=LTIPO==='agua',ki=ag?0:1,kt=ag?2:1,nome=ag?'Água':'Energia',st=ag?'ag':'en';
  const C=lCalc(),I=lFiltra(C.I),at=I.filter(i=>i.st==='ATIVO'),ref=lMesRef(),mr=MES3[+ref.slice(5)-1].toLowerCase()+'/'+ref.slice(2,4);
  const ms=L_MESES.filter(m=>m<='2026-11');
  const cts=LF.ct==='127'?['127']:LF.ct==='169/170'?['169','170']:['127','169','170'];
  const pago=m=>cts.reduce((s,c)=>s+(((LOC.tot[c]||{})[m]||[0,0,0])[kt]),0);
  const plan=m=>I.reduce((s,i)=>s+((i.cons[m]||[0,0])[ki]),0);
  const anoP=ms.reduce((s,m)=>s+pago(m),0),anoL=ms.reduce((s,m)=>s+plan(m),0),mfech=ms.filter(m=>m<=ref);
  const com=at.filter(i=>ms.some(m=>(i.cons[m]||[0,0])[ki]>0));
  const sN=k=>at.filter(i=>i[st][2]===k).length;
  const bc=(cls,k,v,sub)=>'<div class="bcard '+cls+'"><span>'+k+'</span><b>'+v+'</b><small>'+sub+'</small></div>';
  const cards='<div class="lk">'+bc('',nome+' paga no ano',Rk(anoP),LF.b?'Contas a Pagar não separa por base':'Contas a Pagar · jan a '+MES3[+ms[ms.length-1].slice(5)-1].toLowerCase())+
    bc('','Paga em '+mr,Rk(pago(ref)),'planilha de locação: '+Rk(plan(ref)))+
    bc('','Média por mês',Rk(mfech.length?mfech.reduce((s,m)=>s+pago(m),0)/mfech.length:0),'meses fechados até '+mr)+
    bc('','Imóveis com conta',N(com.length),'de '+N(at.length)+' ativos · média '+R(com.length&&mfech.length?mfech.reduce((s,m)=>s+plan(m),0)/mfech.length/com.length:0)+' por imóvel')+
    bc(sN('NÃO SAIU')+sN('LANÇAR')?'par':'sup','Contas de '+lM3Nome(2)+' pendentes',N(sN('NÃO SAIU')+sN('LANÇAR')),N(sN('NÃO SAIU'))+' não saíram · '+N(sN('LANÇAR'))+' a lançar')+
    bc('','Lançadas em '+lM3Nome(2),N(sN('LANÇADO')),ag?N(sN('PAGA PELO MORADOR'))+' pagas pelo morador · '+N(sN('POÇO ARTESIANO'))+' com poço artesiano':N(sN('CON. PROPRIO'))+' consumo próprio · '+N(sN('PG MORADOR'))+' pagas pelo morador')+'</div>';
  const ch=colChart(ms.map(m=>({l:MES3[+m.slice(5)-1],t:mesNome(m),v:LF.b?plan(m):pago(m),meta:LF.b?null:plan(m),fut:m>ref})),{leg:LF.b?'Soma na planilha de locação':'Pago (Contas a Pagar)',aria:nome+' por mês'}).replace('Meta do período','Soma das contas na planilha de locação');
  const porB=Object.keys(LBASE).map(b=>[lbn(b),mfech.reduce((s,m)=>s+I.filter(i=>i.b===b).reduce((a,i)=>a+((i.cons[m]||[0,0])[ki]),0),0),(n=>N(n)+(n===1?' imóvel':' imóveis')+' com conta')(I.filter(i=>i.b===b&&mfech.some(m=>((i.cons[m]||[0,0])[ki])>0)).length)]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
  const porC=cts.map(c=>['Contrato '+c,ms.reduce((s,m)=>s+(((LOC.tot[c]||{})[m]||[0,0,0])[kt]),0),'pago no ano']).filter(x=>x[1]);
  const top=com.map(i=>Object.assign({},i,{ano:mfech.reduce((s,m)=>s+((i.cons[m]||[0,0])[ki]),0),ult:(i.cons[ref]||[0,0])[ki]})).sort((a,b)=>b.ano-a.ano);
  const nm=s=>s||'Em branco',sts=lStsOrd(at,st);
  const tabS='<div class="tw"><table class="utab"><thead><tr><th>Situação da conta</th>'+lM3Lab().map(x=>'<th class="n">'+x+'</th>').join('')+'</tr></thead><tbody>'+sts.filter(s=>at.some(i=>i[st].includes(s))).map(s=>'<tr><td><b>'+nm(s)+'</b></td>'+[0,1,2].map(j=>'<td class="n">'+N(at.filter(i=>i[st][j]===s).length)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const grade='<div class="tw"><table class="utab lgrade"><thead><tr><th>Imóvel</th><th>Base</th><th>CT</th>'+ms.map(m=>'<th class="n">'+MES3[+m.slice(5)-1]+'</th>').join('')+'<th class="n">Total</th><th>Nov</th></tr></thead><tbody>'+
    top.map(i=>'<tr><td><b>'+esc(i.im)+'</b><br><small class="muted">'+esc(i.loc)+'</small></td><td>'+i.b+'</td><td>'+i.ct+'</td>'+ms.map(m=>{const v=(i.cons[m]||[0,0])[ki];return '<td class="n">'+(v?nf2.format(v):'<span class="muted">–</span>')+'</td>'}).join('')+'<td class="n"><b>'+R(i.ano)+'</b></td><td><span class="tidtag">'+esc(i[st][2]||'–')+'</span></td></tr>').join('')+
    '<tr class="tot"><td>Total</td><td></td><td></td>'+ms.map(m=>'<td class="n">'+nf2.format(plan(m))+'</td>').join('')+'<td class="n">'+R(top.reduce((s,i)=>s+i.ano,0))+'</td><td></td></tr></tbody></table></div>';
  const pend=at.filter(i=>['NÃO SAIU','LANÇAR'].includes(i[st][2]));
  return '<div class="ubar"><div class="ubar-l"><span class="ubar-ic">'+ico('cad')+'</span><div class="ubar-t"><span class="ubar-tag">Controle de Locação</span><h2>Controle de locação · '+nome+'</h2><span>Contas de '+nome.toLowerCase()+' dos imóveis alugados · referência: '+mesNome(ref)+'</span></div></div></div>'+
   '<div class="lfil">'+lSel('b','Base',[['','Todas']].concat(Object.keys(LBASE).map(b=>[b,lbn(b)])))+lSel('ct','Contrato',[['','Todos'],['127','127'],['169/170','169/170']])+lSel('mes','Mês de referência',[['','Último fechado ('+MES3[+lMesRef0().slice(5)-1].toLowerCase()+')']].concat(ms.map(m=>[m,mesNome(m)])))+'</div>'+cards+
   '<div class="xg2">'+panel(nome+' por mês',LF.b?'soma das contas na planilha de locação (a Contas a Pagar não separa por base)':'barra = pago na Contas a Pagar · traço = soma das contas na planilha de locação',ch)+panel('Situação das contas','imóveis ativos · set, out e nov',tabS)+'</div>'+
   '<div class="xg2">'+panel('Por base','soma na planilha de locação, meses fechados',porB.length?lRank(porB):'<div class="empty">Sem contas na planilha.</div>')+panel('Por contrato','pago no ano na Contas a Pagar',porC.length?lRank(porC):'<div class="empty">Sem pagamentos.</div>')+'</div>'+
   panel('Contas de '+lM3Nome(2)+' a resolver',N(pend.length)+' imóveis com a conta "não saiu" ou "lançar"',tabela([{h:'Imóvel',w:1,f:i=>'<b data-lid="'+i.id+'">'+esc(i.im)+'</b><br><small class="muted">'+esc(i.loc)+'</small>'},{h:'Base',f:i=>i.b},{h:'CT',f:i=>i.ct},{h:'Situação · '+lM3Lab()[2].toLowerCase(),f:i=>'<span class="tidtag">'+esc(i[st][2])+'</span>'},{h:'Último valor na planilha',n:1,f:i=>{const m=ms.slice().reverse().find(m=>(i.cons[m]||[0,0])[ki]>0);return m?R(i.cons[m][ki])+' <small class="muted">('+MES3[+m.slice(5)-1].toLowerCase()+')</small>':'–'}},{h:'Titular',f:i=>esc(i.tit||'–')}],pend,{}))+
   panel(nome+' por imóvel','valores mês a mês da planilha de locação · do maior gasto para o menor',grade)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ltipo]');if(!b)return;LTIPO=b.dataset.ltipo;render();scrollTo({top:0})});

PG['loc-aluguel']=()=>{LTIPO='loc';return PG.locacao()};PG['loc-agua']=()=>{LTIPO='agua';return PG.locacao()};PG['loc-energia']=()=>{LTIPO='ener';return PG.locacao()};

/* ---- Consultar imóvel (por UC, locador, endereço ou imóvel) ---- */
let LQ='',LSEL=null;
const lNorm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
function lBusca(q){q=lNorm(q).trim();if(q.length<2)return [];const qd=q.replace(/\D/g,'');const C=lCalc();
  return C.I.map(i=>{const ucs=[i.uca,i.ucn,i.ucag].filter(x=>x&&/\d/.test(x));let sc=0,por='';
    if(qd.length>=3&&ucs.some(u=>u.replace(/\D/g,'').includes(qd))){sc=3;por='UC'}
    else if(lNorm(i.lo).includes(q)){sc=2;por='Locador'}else if(lNorm(i.end).includes(q)){sc=2;por='Endereço'}else if(lNorm(i.im+' '+i.loc).includes(q)){sc=1;por='Imóvel'}
    return sc?{i,sc,por}:null}).filter(Boolean).sort((a,b)=>b.sc-a.sc||(a.i.st==='ATIVO'?-1:1)).slice(0,30)}
function lResHTML(){const R=lBusca(LQ);if(LQ.trim().length<2)return '<p class="lq-dica">Digite pelo menos 2 letras ou 3 números. Exemplos: o número da UC de energia ou de água, o nome do locador, a rua ou o nome do imóvel.</p>';
  if(!R.length)return '<p class="lq-dica">Nada encontrado para "'+esc(LQ)+'".</p>';
  return '<div class="lq-res">'+R.map(({i,por})=>'<button type="button" class="lq-it'+(LSEL===i.id?' on':'')+'" data-lsel="'+i.id+'"><b>'+esc(i.im)+'</b><span>'+esc(i.lo)+'</span><small>'+esc(i.end||'sem endereço')+' · '+lbn(i.b)+' · CT '+i.ct+(i.st!=='ATIVO'?' · distratado':'')+'</small><em>'+por+'</em></button>').join('')+'</div>'}
function lFicha(id){const C=lCalc(),i=C.I.find(x=>x.id===id);if(!i)return '';const ms=L_MESES.filter(m=>m<='2026-11'),dr=lDias(i.fim);
  const li=(k,v)=>'<div><dt>'+k+'</dt><dd>'+(v||'<span class="muted">–</span>')+'</dd></div>';
  const stT=(arr)=>lM3Lab().map((m,j)=>'<span class="tidtag">'+m+': '+esc(arr[j]||'–')+'</span>').join(' ');
  const totE=ms.reduce((s,m)=>s+((i.cons[m]||[0,0])[1]),0),totA=ms.reduce((s,m)=>s+((i.cons[m]||[0,0])[0]),0);
  const tab='<div class="tw"><table class="utab"><thead><tr><th>Mês</th><th class="n">Aluguel previsto</th><th class="n">Aluguel pago</th><th>Situação do aluguel</th><th class="n">Energia</th><th class="n">Água</th></tr></thead><tbody>'+
    ms.map(m=>{const s=i.sm[m],p=i.pm[m]||[0,0],c=i.cons[m]||[0,0];return '<tr><td><b>'+mesNome(m)+'</b></td><td class="n">'+(s==='fora'?'–':R(i.v))+'</td><td class="n">'+(p[0]?R(p[0]):'–')+'</td><td>'+(s==='fora'?'<span class="muted">fora do contrato</span>':lPillSt(s))+'</td><td class="n">'+(c[1]?R(c[1]):'–')+'</td><td class="n">'+(c[0]?R(c[0]):'–')+'</td></tr>'}).join('')+
    '<tr class="tot"><td>Total</td><td></td><td class="n">'+R(ms.reduce((s,m)=>s+((i.pm[m]||[0])[0]),0))+'</td><td></td><td class="n">'+R(totE)+'</td><td class="n">'+R(totA)+'</td></tr></tbody></table></div>';
  return '<div class="lfi">'+
   '<div class="lfi-h"><div><span class="ubar-tag">'+lbn(i.b)+' · '+esc(i.loc)+'</span><h3>'+esc(i.im)+'</h3><p>'+esc(i.end||'Endereço não informado')+'</p></div><div class="lfi-st">'+(i.st==='ATIVO'?'<span class="pill ate">Ativo</span>':'<span class="pill nao">'+esc(i.st||'–')+'</span>')+'</div></div>'+
   '<div class="lfi-g">'+
    '<section><h4>'+ico('chave')+' Locação</h4><dl>'+li('Locador',esc(i.lo)+' <small class="muted">('+(i.pj?'empresa':'pessoa física')+')</small>')+li('Contrato','CT '+i.ct)+li('Vigência',tiD(i.ini)+' a '+tiD(i.fim)+(dr!=null?' <span class="ldr '+(dr<0?'v':dr<=30?'a':dr<=60?'m':'b')+'">'+(dr<0?'vencido':dr+' dias')+'</span>':''))+li('Aluguel','<b>'+R(i.v)+'</b>')+li('IPTU',esc(i.iptu))+li('Pagamento identificado',i.gg?'sim':'<span class="pill nao">não</span>')+'</dl></section>'+
    '<section><h4>'+ico('raio')+' Energia</h4><dl>'+li('UC (nova)',esc(i.ucn))+li('UC antiga',esc(i.uca))+li('Titular da conta',esc(i.tit))+li('Situação',stT(i.en))+li('Última leitura',i.ul&&/^\d{4}-/.test(i.ul)?tiD(i.ul):esc(i.ul))+li('Último vencimento',i.uv&&/^\d{4}-/.test(i.uv)?tiD(i.uv):esc(i.uv))+li('Total no ano','<b>'+R(totE)+'</b>')+'</dl></section>'+
    '<section><h4>'+ico('agua')+' Água</h4><dl>'+li('UC de água',esc(i.ucag))+li('Situação',stT(i.ag))+li('Total no ano','<b>'+R(totA)+'</b>')+'</dl></section>'+
   '</div><h4 class="lfi-t">Mês a mês</h4>'+tab+'</div>'}
PG['loc-busca']=()=>'<div class="ubar"><div class="ubar-l"><span class="ubar-ic">'+ico('lupa')+'</span><div class="ubar-t"><span class="ubar-tag">Controle de Locação</span><h2>Consultar imóvel</h2><span>Digite a UC de energia ou água, o locador, o endereço ou o imóvel e veja tudo daquele imóvel: locação, luz e água</span></div></div></div>'+
  '<div class="panel lq"><label class="lq-campo">'+ico('lupa')+'<input type="search" id="lq" placeholder="Ex.: 3022511733, nome do locador, Rua das Palmeiras…" value="'+esc(LQ)+'" autocomplete="off"></label><div id="lqres">'+lResHTML()+'</div></div>'+
  '<div id="lqficha">'+(LSEL?lFicha(LSEL):'')+'</div>';
document.addEventListener('input',e=>{if(e.target.id!=='lq')return;LQ=e.target.value;const r=$('lqres');if(r)r.innerHTML=lResHTML();const R_=lBusca(LQ);if(R_.length===1&&R_[0].sc===3&&LSEL!==R_[0].i.id){LSEL=R_[0].i.id;const f=$('lqficha');if(f)f.innerHTML=lFicha(LSEL)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-lsel]');if(!b)return;LSEL=b.dataset.lsel;if(location.hash!=='#loc-busca'){location.hash='loc-busca';return}const f=$('lqficha');if(f){f.innerHTML=lFicha(LSEL);document.querySelectorAll('.lq-it').forEach(x=>x.classList.toggle('on',x.dataset.lsel===LSEL));f.scrollIntoView({behavior:'smooth',block:'start'})}});

/* ---- Cadastro de imóveis e contas (substitui a planilha) ---- */
const LO_EN=['LANÇAR','LANÇADO','NÃO SAIU','PRYSCILLA','CON. PROPRIO','PG MORADOR','PROPRIETÁRIO','NÃO SE APLICA','DISTRATADO'];
const LO_AG=['LANÇAR','LANÇADO','NÃO SAIU','PRYSCILLA','POÇO ARTESIANO','PAGA PELO MORADOR','PAGO PELO LOCADOR','PAGO VIA F.FIXO PRYSCILLA','VIA CARRO PIPA','NÃO PAGA','PROPRIETÁRIO','NÃO SE APLICA','DISTRATADO'];
const LO_TIT=['CGB ENERGIA/19.859.525/0002-96','CGB ENERGIA/19.859.525/0001-05','NÃO'];
const LO_ANO=['01','02','03','04','05','06','07','08','09','10','11','12'].map(m=>'2026-'+m);
let LCANT=false;const lMesAtual=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
let L_M3=['2026-09','2026-10','2026-11'],LCE=null,LCSEC='imoveis',LCQ='',LCMES='';
const lM3Lab=()=>L_M3.map(m=>MES3[+m.slice(5)-1].charAt(0)+MES3[+m.slice(5)-1].slice(1).toLowerCase());
const lM3Nome=j=>MESES[+L_M3[j].slice(5)-1].toLowerCase();
function lNormaliza(i){i.ens=i.ens||{};i.ags=i.ags||{};i.cons=i.cons||{};i.en=L_M3.map(m=>i.ens[m]||'');i.ag=L_M3.map(m=>i.ags[m]||'');i.tit=/CGB/.test(i.titf||i.tit||'')?'CGB':(i.titf||i.tit||'');return i}
function lMeses3(){const s=new Set();LOC.imv.forEach(i=>{Object.keys(i.ens||{}).forEach(m=>s.add(m));Object.keys(i.ags||{}).forEach(m=>s.add(m))});const a=[...s].sort();if(a.length>=3)L_M3=a.slice(-3);LOC.imv.forEach(lNormaliza)}
lMeses3();
const lPodeCad=()=>!!(DBX&&CAN_EDIT);
function lAplica(o){const k=LOC.imv.findIndex(x=>x.id===o.id);if(o.del){if(k>=0)LOC.imv.splice(k,1)}else if(k>=0)LOC.imv[k]=o;else LOC.imv.push(o);lMeses3();LVER++;LCACHE=null}
async function lGravaImv(o){lAplica(o);if(lPodeCad()){try{await DBX.doc('loc_imv/'+o.id).set({j:JSON.stringify(o),em:new Date().toISOString()});return 'ok'}catch(x){toast('Não foi possível salvar para todos ('+(x.message||x.code)+').');return 'erro'}}return 'teste'}
async function locCarregarImv(db){let m=false;try{const s=await db.collection('loc_imv').get();const docs=s.docs||s;(docs||[]).forEach(d=>{const v=d.data?d.data():d;if(v&&v.j){const o=JSON.parse(v.j);const k=LOC.imv.findIndex(x=>x.id===o.id);if(o.del){if(k>=0)LOC.imv.splice(k,1)}else if(k>=0)LOC.imv[k]=o;else LOC.imv.push(o);m=true}})}catch(e){}if(m){lMeses3();LVER++;LCACHE=null}return m}
const lOp=(arr,v,ph,lab)=>'<option value="">'+(ph||'–')+'</option>'+arr.map(x=>'<option value="'+esc(x)+'"'+(x===v?' selected':'')+'>'+esc(lab?lab(x):x)+'</option>').join('')+(v&&!arr.includes(v)?'<option selected value="'+esc(v)+'">'+esc(v)+'</option>':'');
function lFormImv(){const e=LCE;
  const inp=(k,lab,t,ph,cls)=>'<label'+(cls?' class="'+cls+'"':'')+'><small>'+lab+'</small><input type="'+(t||'text')+'" data-lce="'+k+'" value="'+esc(e[k]==null?'':String(e[k]))+'" placeholder="'+(ph||'')+'"></label>';
  const sel=(k,lab,html)=>'<label><small>'+lab+'</small><select data-lce="'+k+'">'+html+'</select></label>';
  const meses='<div class="tw"><table class="utab lcm"><thead><tr><th>Mês</th><th>Energia · situação</th><th class="n">Energia · valor</th><th>Água · situação</th><th class="n">Água · valor</th></tr></thead><tbody>'+
    LO_ANO.filter(m=>LCANT||m>=lMesAtual()).map(m=>{const c=(e.cons||{})[m]||[0,0];return '<tr><td><b>'+mesNome(m)+'</b></td><td><select data-lcm="'+m+'|ens">'+lOp(LO_EN,(e.ens||{})[m])+'</select></td><td class="n"><input inputmode="decimal" data-lcm="'+m+'|ve" value="'+(c[1]?nf2.format(c[1]):'')+'" placeholder="0,00"></td><td><select data-lcm="'+m+'|ags">'+lOp(LO_AG,(e.ags||{})[m])+'</select></td><td class="n"><input inputmode="decimal" data-lcm="'+m+'|va" value="'+(c[0]?nf2.format(c[0]):'')+'" placeholder="0,00"></td></tr>'}).join('')+'</tbody></table></div>';
  return '<div class="ubar"><div class="ubar-l"><span class="ubar-ic">'+ico('chave')+'</span><div class="ubar-t"><span class="ubar-tag">Controle de Locação · Cadastro</span><h2>'+(e.novo?'Novo imóvel':esc(e.im||'Editar imóvel'))+'</h2><span>Os mesmos campos da planilha. Ao salvar, aluguel, energia e água se atualizam na hora.</span></div></div></div>'+
   (lPodeCad()?'':'<div class="note">Modo de teste: dá para preencher e ver nas visões, mas só fica salvo para todos quando quem pode editar o site cadastra pelo Claude.</div>')+
   '<div class="panel aqform"><div class="phd"><h3>1. Locador e imóvel</h3></div><div class="aqgrid">'+
    inp('lo','Locador *','text','Nome do locador ou empresa','aqw2')+sel('pj','Tipo de locador','<option value="">Pessoa física</option><option value="1"'+(e.pj?' selected':'')+'>Empresa</option>')+
    inp('end','Endereço *','text','Rua, número, bairro','aqw2')+sel('b','Base *',lOp(Object.keys(LBASE),e.b,'Escolha',lbn))+
    inp('loc','Localidade','text','Cidade')+inp('im','Imóvel (nome) *','text','Ex.: Resid. Ricardo Malta')+sel('st','Situação',lOp(['ATIVO','DISTRATADO'],e.st||'ATIVO','Escolha'))+'</div></div>'+
   '<div class="panel aqform"><div class="phd"><h3>2. Contrato</h3></div><div class="aqgrid">'+
    sel('ct','Contrato',lOp(['127','169','170'],e.ct,'Escolha',c=>'CT '+c))+inp('ini','Início','date')+inp('fim','Término','date')+
    inp('v','Valor do aluguel (R$)','text','ex.: 1.500,00')+sel('iptu','IPTU',lOp(['Sim','NÃO','NÃO SE APLICA'],e.iptu))+'</div></div>'+
   '<div class="panel aqform"><div class="phd"><h3>3. Energia e água</h3></div><div class="aqgrid">'+
    inp('ucn','Nova UC (padrão)','text','nº da UC')+inp('uca','UC antiga','text','nº da UC')+sel('titf','Titularidade da conta',lOp(LO_TIT,e.titf))+
    sel('cp','UC de consumo próprio',lOp(['CONSUMO PROPRIO','NÃO','NÃO SE APLICA'],e.cp))+inp('ul','Última leitura','date')+inp('uv','Último vencimento','date')+inp('ucag','UC de água','text','nº ou NÃO SE APLICA')+'</div></div>'+
   '<div class="panel aqform"><div class="phd"><h3>4. Contas a partir de '+mesNome(lMesAtual()).toLowerCase()+'</h3><button type="button" class="btn sm" data-lcant>'+(LCANT?'Esconder meses anteriores':'Corrigir meses anteriores')+'</button></div>'+meses+
    '<div class="aqbar">'+(!e.novo&&lPodeCad()?'<button type="button" class="btn" data-lcexclui>Excluir imóvel</button>':'')+'<span class="aqtot"></span><button type="button" class="btn" data-lccancela>Cancelar</button><button type="button" class="btn primary" data-lcsalva>'+(e.novo?'Cadastrar imóvel':'Salvar alterações')+'</button></div></div>'}
function lContasMes(){const m=LCMES||lMesAtual(),at=LOC.imv.filter(i=>i.st==='ATIVO').filter(i=>!LCQ||lNorm(i.im+' '+i.lo+' '+i.end+' '+i.loc).includes(lNorm(LCQ))).sort((a,b)=>(a.b+a.loc+a.im).localeCompare(b.b+b.loc+b.im));
  return '<div class="lcbar"><label class="lsel"><small>Mês</small><select data-lcmes>'+LO_ANO.filter(x=>x>=lMesAtual()||x===m||LO_ANO.indexOf(x)>=LO_ANO.indexOf(lMesAtual())-2).map(x=>'<option value="'+x+'"'+(x===m?' selected':'')+'>'+mesNome(x)+'</option>').join('')+'</select></label><label class="lsel lcq"><small>Buscar</small><input type="search" data-lcq value="'+esc(LCQ)+'" placeholder="imóvel, locador, endereço"></label><p class="tnota">Cada mudança é salva na hora. É o mesmo que preencher as colunas do mês na planilha.</p></div>'+
   panel('Contas de '+mesNome(m).toLowerCase(),N(at.length)+' imóveis ativos','<div class="tw"><table class="utab lcm"><thead><tr><th>Imóvel</th><th>Base</th><th>Energia · situação</th><th class="n">Energia · valor</th><th>Água · situação</th><th class="n">Água · valor</th></tr></thead><tbody>'+
    at.map(i=>{const c=(i.cons||{})[m]||[0,0];return '<tr><td><b>'+esc(i.im)+'</b><br><small class="muted">'+esc(i.lo)+'</small></td><td>'+i.b+'</td><td><select data-lcr="'+i.id+'|'+m+'|ens">'+lOp(LO_EN,(i.ens||{})[m])+'</select></td><td class="n"><input inputmode="decimal" data-lcr="'+i.id+'|'+m+'|ve" value="'+(c[1]?nf2.format(c[1]):'')+'" placeholder="0,00"></td><td><select data-lcr="'+i.id+'|'+m+'|ags">'+lOp(LO_AG,(i.ags||{})[m])+'</select></td><td class="n"><input inputmode="decimal" data-lcr="'+i.id+'|'+m+'|va" value="'+(c[0]?nf2.format(c[0]):'')+'" placeholder="0,00"></td></tr>'}).join('')+'</tbody></table></div>')}
PG['loc-cad']=()=>{if(LCE)return lFormImv();
  const L=LOC.imv.filter(i=>!LCQ||lNorm(i.im+' '+i.lo+' '+i.end+' '+i.loc+' '+i.ucn+' '+i.uca).includes(lNorm(LCQ))).sort((a,b)=>(a.st==='ATIVO'?0:1)-(b.st==='ATIVO'?0:1)||(a.b+a.loc+a.im).localeCompare(b.b+b.loc+b.im));
  return '<div class="ubar"><div class="ubar-l"><span class="ubar-ic">'+ico('chave')+'</span><div class="ubar-t"><span class="ubar-tag">Controle de Locação</span><h2>Cadastro de imóveis</h2><span>Substitui a planilha: cadastre e atualize imóveis e contas aqui</span></div></div><div class="ubar-r"><button type="button" class="btn primary" data-lcnovo>+ Novo imóvel</button></div></div>'+
   hSeg('data-lcsec',LCSEC,[['imoveis','Imóveis ('+N(LOC.imv.length)+')'],['contas','Lançar contas do mês']])+
   (LCSEC==='contas'?lContasMes():'<div class="lcbar"><label class="lsel lcq"><small>Buscar</small><input type="search" data-lcq value="'+esc(LCQ)+'" placeholder="imóvel, locador, endereço ou UC"></label></div>'+
    panel('Imóveis',N(L.length)+' cadastrados',tabela([{h:'Imóvel',w:1,f:i=>'<b>'+esc(i.im)+'</b><br><small class="muted">'+esc(i.end||i.loc)+'</small>'},{h:'Locador',w:1,f:i=>esc(i.lo)},{h:'Base',f:i=>lbn(i.b)},{h:'CT',f:i=>i.ct},{h:'Término',f:i=>tiD(i.fim)},{h:'Aluguel',n:1,f:i=>R(i.v)},{h:'Situação',f:i=>i.st==='ATIVO'?'<span class="pill ate">Ativo</span>':'<span class="pill nao">'+esc(i.st)+'</span>'},{h:'',f:i=>'<button type="button" class="fced" data-lcedita="'+i.id+'" title="Editar imóvel" aria-label="Editar imóvel"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg></button>'}],L,{})))};
const lNumBR=v=>{const n=parseFloat(String(v).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'));return isNaN(n)?0:n};
const lSalvaLinha=(()=>{const t={};return (o)=>{clearTimeout(t[o.id]);t[o.id]=setTimeout(async()=>{const r=await lGravaImv(o);if(r==='ok')toast('Salvo: '+o.im)},500)}})();
document.addEventListener('input',ev=>{const el=ev.target;
  if(el.dataset&&el.dataset.lce!=null&&LCE){const k=el.dataset.lce;LCE[k]=k==='v'?lNumBR(el.value):el.value;return}
  if(el.dataset&&el.dataset.lcm&&LCE){const [m,k]=el.dataset.lcm.split('|');LCE.cons=LCE.cons||{};const c=LCE.cons[m]||[0,0];if(k==='ve')c[1]=lNumBR(el.value);else if(k==='va')c[0]=lNumBR(el.value);LCE.cons[m]=c;return}
  if(el.dataset&&el.dataset.lcq!=null){LCQ=el.value;clearTimeout(window._lcqT);window._lcqT=setTimeout(()=>{render();const x=document.querySelector('[data-lcq]');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}},350);return}
  if(el.dataset&&el.dataset.lcr&&el.tagName==='INPUT'){const [id,m,k]=el.dataset.lcr.split('|');const i=LOC.imv.find(x=>x.id===id);if(!i)return;i.cons=i.cons||{};const c=(i.cons[m]||[0,0]).slice();if(k==='ve')c[1]=lNumBR(el.value);else c[0]=lNumBR(el.value);i.cons[m]=c;lSalvaLinha(i)}});
document.addEventListener('change',ev=>{const el=ev.target;
  if(el.dataset&&el.dataset.lce!=null&&LCE&&el.tagName==='SELECT'){const k=el.dataset.lce;LCE[k]=k==='pj'?!!el.value:el.value;return}
  if(el.dataset&&el.dataset.lcm&&LCE&&el.tagName==='SELECT'){const [m,k]=el.dataset.lcm.split('|');LCE[k]=LCE[k]||{};if(el.value)LCE[k][m]=el.value;else delete LCE[k][m];return}
  if(el.dataset&&el.dataset.lcmes!=null){LCMES=el.value;render();return}
  if(el.dataset&&el.dataset.lcr&&el.tagName==='SELECT'){const [id,m,k]=el.dataset.lcr.split('|');const i=LOC.imv.find(x=>x.id===id);if(!i)return;i[k]=Object.assign({},i[k]||{});if(el.value)i[k][m]=el.value;else delete i[k][m];lSalvaLinha(i)}});
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-lcant],[data-lcnovo],[data-lcedita],[data-lccancela],[data-lcsalva],[data-lcexclui],[data-lcsec]');if(!b)return;
  if(b.hasAttribute('data-lcant')){LCANT=!LCANT;render();return}
  if(b.dataset.lcsec){LCSEC=b.dataset.lcsec;render();return}
  if(b.hasAttribute('data-lcnovo')){LCANT=false;LCE={novo:1,id:'N'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),st:'ATIVO',ens:{},ags:{},cons:{}};if(location.hash!=='#loc-cad')location.hash='loc-cad';else render();scrollTo({top:0});return}
  if(b.dataset.lcedita){LCANT=false;const i=LOC.imv.find(x=>x.id===b.dataset.lcedita);if(!i)return;LCE=JSON.parse(JSON.stringify(i));if(location.hash!=='#loc-cad')location.hash='loc-cad';else render();scrollTo({top:0});return}
  if(b.hasAttribute('data-lccancela')){LCE=null;render();return}
  if(b.hasAttribute('data-lcexclui')){if(!confirm('Excluir este imóvel do cadastro?'))return;await lGravaImv({id:LCE.id,del:true});LCE=null;toast('Imóvel excluído.');render();return}
  const e=LCE;if(!e)return;const falta=[['lo','o locador'],['end','o endereço'],['b','a base'],['im','o nome do imóvel']].find(([k])=>!String(e[k]||'').trim());
  if(falta){toast('Preencha '+falta[1]+'.');const c=document.querySelector('[data-lce="'+falta[0]+'"]');c&&c.focus();return}
  const o=JSON.parse(JSON.stringify(e));delete o.novo;o.lo=o.lo.trim().toUpperCase();o.im=o.im.trim().toUpperCase();o.v=+o.v||0;o.em=new Date().toISOString();delete o.gg;delete o.pm;delete o.sm;
  const r=await lGravaImv(o);LCE=null;toast(r==='ok'?'Imóvel salvo. Aluguel, energia e água já foram atualizados.':r==='teste'?'Salvo nesta tela (modo de teste: não fica salvo).':'Ficou só nesta tela.');render()});
