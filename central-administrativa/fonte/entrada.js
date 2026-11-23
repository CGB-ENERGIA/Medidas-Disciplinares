/* ===== Tela de entrada (modelo aprovado) ===== */
function enSpark(v,cor){v=(v||[]).filter(x=>x!=null&&isFinite(x));if(v.length<2)return '';const mx=Math.max(...v),mn=Math.min(...v),w=140,h=48,p=v.map((x,i)=>[(i*w/(v.length-1)).toFixed(1),(h-6-(mx===mn?.5:(x-mn)/(mx-mn))*(h-12)).toFixed(1)]),id='sg'+Math.random().toString(36).slice(2,7);
  return '<svg class="en-sp" viewBox="0 0 140 48" aria-hidden="true"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+cor+'" stop-opacity=".25"/><stop offset="1" stop-color="'+cor+'" stop-opacity="0"/></linearGradient></defs><path d="M'+p.map(q=>q.join(',')).join('L')+'L140,48L0,48Z" fill="url(#'+id+')"/><polyline fill="none" stroke="'+cor+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="'+p.map(q=>q.join(',')).join(' ')+'"/><circle cx="'+p[p.length-1][0]+'" cy="'+p[p.length-1][1]+'" r="4" fill="'+cor+'"/></svg>'}
const EN_COR={g:'#2f8f12',a:'#c27a00',r:'#c00000',n:'#711424'},EN_ST={ok:['g','Em dia'],par:['a','Atenção'],nao:['r','Agir'],nd:['n','Sem meta']};
PG.entrada=()=>{const L=INDS(),nm=L.filter(i=>i.st!=='nd').length,ok=L.filter(i=>i.st==='ok').length,sc=nm?ok/nm:0;
  const ind=t=>L.find(i=>i.tema===t);const C=lCalc(),at=C.I.filter(i=>i.st==='ATIVO'),ref=lMesRef();
  const pendL=C.I.filter(i=>i.sm[ref]&&['sem','aber','parc','nid'].includes(i.sm[ref])).length,v90=at.filter(i=>{const d=lDias(i.fim);return d!=null&&d<=90}).length,ensai=at.filter(i=>i.en[2]==='NÃO SAIU').length;
  const prev=C.I.filter(i=>i.sm[ref]!=='fora').reduce((s,i)=>s+i.v,0),pago=C.I.reduce((s,i)=>s+((i.pm[ref]||[0])[0]),0)+C.soltos.reduce((s,g)=>s+(g.m[ref]||[]).filter(p=>p[1]).reduce((a,p)=>a+p[0],0),0);
  const serL=L_MESES.filter(m=>m<=ref).slice(-9).map(m=>C.I.filter(i=>i.sm[m]&&['sem','aber','parc','nid'].includes(i.sm[m])).length);
  const hpend=(DS.hosp.rows||[]).filter(r=>r.fl&(1|4|64|16|8)).length,fcAb=FC.at.filter(x=>x.st!=='RESOLVIDO').length,tiC=tiNotas().filter(n=>n.st==='comigo').length;
  const pendTot=hpend+pendL+fcAb+tiC;
  const deInd=(i,k,nm,d,ic,go,ac)=>{if(!i)return null;const [c,st]=EN_ST[i.st]||EN_ST.nd;const pct=i.und==='%'?i.v:(i.mv?i.v/i.mv:null);const ex=(i.extra||[])[0];
    return {k,nm,d,ic,go,c,st,val:i.fv(i.v),lbl:i.nome,pct,serie:i.serie,rod:ex?ex[0]+': '+ex[1]:'',ac}};
  const A=[deInd(ind('Hospedagem'),'hosp','Hospedagem e Alimentação','Custos, metas e pendências','cama','inicio',[['inicio','Painel'],['onde','Onde se gasta'],['lancar','Lançar']]),
   {k:'loc',nm:'Controle de Locação',d:'Aluguel, água e energia',ic:'chave',go:'loc-aluguel',c:pendL?'r':'g',st:pendL?'Agir':'Em dia',val:N(pendL),lbl:'pagamentos pendentes em '+MES3[+ref.slice(5)-1].toLowerCase(),pct:prev?pago/prev:null,serie:serL,rod:N(v90)+' contratos a vencer em 90 dias',ac:[['loc-busca','Consultar UC'],['loc-cad','Cadastro'],['loc-energia','Energia']]},
   deInd(ind('Patrimônio'),'pat','Patrimônio','Inventário 2026','caixa','pat-painel',[['pat-painel','Painel'],['pat-bens','Bens']]),
   deInd(ind('Fale Conosco'),'fc','Fale Conosco','Atendimentos aos colaboradores','chat','fc-painel',[['fc-painel','Painel'],['fc-novo','Registrar']]),
   deInd(ind('Setor de TI'),'ti','Setor de TI','Compras e prestação de contas','pc','ti-custos',[['ti-custos','Custos'],['ti-fin','Financeiro'],['ti-aquis','Aquisições']]),
   {k:'db',nm:'Banco de dados',d:'Envio e atualização das bases',ic:'db',go:'dados',c:'n',st:'Atualizado',val:'9',lbl:'bases alimentando o site',pct:1,serie:null,rod:'Hospedagem até '+dt(Math.floor((DS.hosp.cut||CUT)/864e5)),ac:[['dados','Ver bases e enviar']]}].filter(Boolean);
  const card=(a,i)=>'<a class="en-c en-'+a.c+'" href="#'+a.go+'" style="animation-delay:'+(i*.07)+'s"><div class="en-h"><span class="en-i">'+ico(a.ic)+'</span><div><h3>'+a.nm+'</h3><small>'+a.d+'</small></div><span class="en-st">'+a.st+'</span></div>'+
    '<div class="en-mid"><div><div class="en-v">'+a.val+'</div><div class="en-l">'+esc(a.lbl)+'</div></div>'+enSpark(a.serie,EN_COR[a.c])+'</div>'+
    (a.pct!=null?'<div class="en-bar"><u style="--w:'+Math.max(2,Math.min(100,a.pct*100)).toFixed(1)+'%"></u></div>':'')+
    '<div class="en-ac">'+a.ac.map(([h,t])=>'<span data-enir="'+h+'">'+t+'</span>').join('')+'</div><div class="en-ft"><span>'+esc(a.rod)+'</span><b>Abrir '+ico('seta')+'</b></div></a>';
  const T=A.map(a=>'<span><i>'+a.nm.split(' ')[0]+'</i> '+a.val+' '+esc(a.lbl)+'</span>').concat(['<span><i>Contratos</i> '+N(v90)+' vencem em até 90 dias</span>','<span><i>Energia</i> '+N(ensai)+' contas de '+lM3Nome(2)+' não saíram</span>']);
  const fcU=FC.at.slice().sort((a,b)=>(b.d||0)-(a.d||0))[0],tiU=tiNotas().slice().sort((a,b)=>(b.emissao||'').localeCompare(a.emissao||''))[0];
  const rec=[fcU&&['g','Fale Conosco','último atendimento: '+esc(fcU.as),dt(fcU.d)],tiU&&['a','Setor de TI','nota '+esc(tiU.num||'sem nº')+' · '+esc((TI_ST[tiU.st]||{}).t||''),tiD(tiU.emissao)],['n','Hospedagem','dados das bases até',dt(Math.floor((DS.hosp.cut||CUT)/864e5))],['r','Locação',N(at.filter(i=>i.en[2]==='LANÇADO').length)+' contas de energia lançadas em '+lM3Nome(2),mesNome(L_M3[2])]].filter(Boolean);
  const h=new Date().getHours(),saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  return '<section class="en-hero"><canvas class="en-rede" aria-hidden="true"></canvas><div class="en-marca" aria-hidden="true"></div><div class="en-marca2" aria-hidden="true"></div><div class="en-hw"><div>'+
    '<span class="en-eb"><i></i>Dados ao vivo · atualizados em '+dt(Math.floor(CUT/864e5))+'</span><h1>'+saud+'.<br><em>Tudo o que a CGB precisa acompanhar</em>, em um só lugar.</h1><p class="en-lead">Hospedagem, locação, patrimônio, atendimentos e compras de TI, com metas, pendências e lançamentos.</p>'+
    '<button type="button" class="en-busca" data-enbusca>'+ico('lupa')+'<span>Buscar área, indicador, imóvel, UC ou colaborador…</span><kbd>Ctrl K</kbd><b>Buscar</b></button>'+
    '<div class="en-sug"><a href="#loc-energia">Contas de energia</a><a href="#loc-aluguel">Contratos a vencer</a><a href="#portal">Indicadores</a><a href="#fc-novo">Registrar atendimento</a></div></div>'+
    '<div class="en-saude"><div class="en-anel"><svg viewBox="0 0 150 150"><defs><linearGradient id="enGr" x1="0" x2="1"><stop offset="0" stop-color="#ffd1da"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><circle class="bg" cx="75" cy="75" r="65"/><circle class="fg" cx="75" cy="75" r="65" style="--o:'+(408*(1-sc)).toFixed(1)+'"/></svg><div><b>'+P(sc).replace(',0%','%')+'</b><small>indicadores no verde</small></div></div>'+
    '<div><h3>Saúde geral da Central</h3><p>'+ok+' dos '+nm+' indicadores com meta estão dentro do esperado</p><div class="en-mini"><div><b>'+N(pendTot)+'</b><small>pendências abertas</small></div><div><b>'+N(v90)+'</b><small>contratos a vencer</small></div><div><b>'+N(ensai)+'</b><small>contas não saíram</small></div></div></div></div></div>'+
    '<div class="en-tick"><b>AGORA</b><div class="en-fx"><div class="en-tr">'+T.join('')+T.join('')+'</div></div></div>'+
    '<div class="en-sec"><h2>Suas áreas</h2><small>clique para abrir o painel completo</small></div></section>'+
   '<div class="en-grid">'+A.map(card).join('')+'</div>'+
   '<div class="en-low"><div class="en-box"><h3>Atalhos rápidos</h3><div class="en-atal">'+
    [['lancar','cama','Lançar hospedagem','sem planilha'],['loc-cad|contas','raio','Contas do mês','energia e água'],['fc-novo','chat','Registrar atendimento','Fale Conosco'],['ti-nota-nova','pc','Nova compra','Setor de TI']].map(([h,i,t,s])=>'<a href="#'+h.split('|')[0]+'"'+(h.includes('|')?' data-enlc="1"':'')+'>'+ico(i)+'<b>'+t+'</b><small>'+s+'</small></a>').join('')+'</div></div>'+
   '<div class="en-box"><h3>Atualizações recentes</h3><div class="en-tl">'+rec.map(([c,a,t,d])=>'<div class="en-'+c+'"><i></i><span><b>'+a+'</b> · '+t+'</span><small>'+d+'</small></div>').join('')+'</div></div></div>'};
document.addEventListener('click',e=>{const b=e.target.closest('[data-enbusca],[data-enir],[data-enlc]');if(!b)return;
  if(b.hasAttribute('data-enbusca')){e.preventDefault();ckAbrir();return}
  if(b.dataset.enir){e.preventDefault();e.stopPropagation();location.hash=b.dataset.enir;return}
  if(b.hasAttribute('data-enlc')){LCSEC='contas'}});
function enRede(){const cv=document.querySelector('#main .en-rede');if(!cv||cv._on)return;cv._on=1;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const x=cv.getContext('2d');let W,H,P;const dp=devicePixelRatio||1;
  const rs=()=>{W=cv.width=cv.offsetWidth*dp;H=cv.height=cv.offsetHeight*dp;P=Array.from({length:60},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35}))};rs();
  const d=()=>{if(!cv.isConnected)return;if(!document.hidden){x.clearRect(0,0,W,H);for(const p of P){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1}const L=170*dp;
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],dd=Math.hypot(a.x-b.x,a.y-b.y);if(dd<L){x.strokeStyle='rgba(255,210,220,'+(0.22*(1-dd/L))+')';x.lineWidth=1;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}}
    for(const p of P){x.fillStyle='rgba(255,220,228,.7)';x.beginPath();x.arc(p.x,p.y,1.8*dp,0,7);x.fill()}}requestAnimationFrame(d)};d()}
function enConta(){document.querySelectorAll('#main .en-v,#main .en-mini b,#main .en-anel b').forEach(el=>{if(el._c)return;el._c=1;const t=el.textContent,m=t.match(/^([^\d-]*)([\d.]+(?:,\d+)?)(.*)$/);if(!m)return;const alvo=parseFloat(m[2].replace(/\./g,'').replace(',','.')),dec=(m[2].split(',')[1]||'').length,t0=performance.now();
  const f=n=>{const p=Math.min(1,(n-t0)/1300),e=1-Math.pow(1-p,3);el.textContent=m[1]+(alvo*e).toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec})+m[3];if(p<1)requestAnimationFrame(f);else el.textContent=t};requestAnimationFrame(f)})}
{const _r=render;render=function(){const r=_r.apply(this,arguments);try{if((location.hash||'#entrada')==='#entrada'||!location.hash){enRede();enConta()}}catch(e){console.error(e)}return r}}
document.querySelectorAll('header.top .tbtn,header.top .cmd-btn,header.top .modo button').forEach(b=>{if(!b.title){const t=(b.querySelector('.txt,span')||{}).textContent;if(t)b.title=t.trim()}});
