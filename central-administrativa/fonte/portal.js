const TEMA_ICO={'Hospedagem':'cama','Alimentação':'mix','Patrimônio':'caixa','Fale Conosco':'chat'};
const TEMAS=['Hospedagem','Alimentação','Patrimônio','Fale Conosco'];
const ST_TXT={ok:'Dentro da meta',par:'Atenção',nao:'Fora da meta',nd:'Em acompanhamento'};
const ST_COR={ok:'var(--sup)',par:'var(--par)',nao:'var(--nao)',nd:'var(--muted)'};
const fP=v=>P(v),fR=v=>R(v),fN=v=>N(v);
let PF_TEMA='',PF_ST='';
function comModo(m,fn){const o=MODO,f=Object.assign({},F);Object.keys(F).forEach(k=>F[k]='');if(m!==o)usar(m);try{return fn()}finally{if(m!==o)usar(o);Object.assign(F,f)}}
/* indicadores de custo (hospedagem e alimentação) a partir da mesma base das telas de detalhe */
function indCusto(m){return comModo(m,()=>{
  const ms=MESES_DADOS(),areas=Object.keys(METAS),r26=ROWS.filter(r=>/^2026-/.test(r.mes));
  const real=ms.map(k=>sum(r26.filter(r=>r.mes===k),r=>r.tot)),qtd=ms.map(k=>sum(r26.filter(r=>r.mes===k),r=>r.dia));
  const meta=ms.map(k=>metaMes(areas,k)*fracMes(k));
  const tot=real.reduce((a,b)=>a+b,0),mt=meta.reduce((a,b)=>a+b,0),q=qtd.reduce((a,b)=>a+b,0);
  const pend=ms.map(k=>{const x=ROWS.filter(r=>r.mes===k);return x.length?x.filter(r=>r.fl&PMASK).length/x.length:null});
  const nPend=ROWS.filter(r=>r.fl&PMASK).length;
  const fech=ms.filter(k=>fracMes(k)===1),ix=fech.map(k=>ms.indexOf(k));
  const cm=ms.map((k,i)=>qtd[i]?real[i]/qtd[i]:null),u3=ix.slice(-3).map(i=>cm[i]),medU3=u3.reduce((a,b)=>a+b,0)/(u3.length||1);
  return {ms,real,meta,tot,mt,q,pend,nPend,nRows:ROWS.length,cm,medU3,cut:CUT,und:m==='alim'?'refeição':'diária'}})}
function semaforoMeta(p){return p==null?'nd':p<=.9?'ok':p<=1?'par':'nao'}
let _IND=null,_INDk='';
function INDS(){
  const k=DS.hosp.rows.length+'|'+DS.alim.rows.length+'|'+ROWS.length+'|'+CUT;if(_IND&&_INDk===k)return _IND;
  const H=indCusto('hosp'),A=indCusto('alim'),L=[];
  const custo=(X,tema,m,c0)=>{
    const lab=X.ms.map(k=>MES3[+k.slice(5)-1]),pc=X.mt?X.tot/X.mt:null,u=X.und,U=u[0].toUpperCase()+u.slice(1);
    L.push({cod:'IND-'+String(c0).padStart(2,'0'),tema,modo:m,nome:'Consumo da meta de '+(m==='alim'?'refeição':'hospedagem'),
      obj:'Mostrar quanto do orçamento de '+(m==='alim'?'refeição':'hospedagem')+' previsto até hoje já foi gasto.',
      form:'Gasto realizado ÷ meta do período (a meta do mês corrente é proporcional aos dias já passados)',und:'%',pol:'Menor é melhor',
      meta:'≤ 90% verde · 90–100% amarelo · acima de 100% vermelho',mv:1,prop:false,freq:'Diária',fonte:m==='alim'?'Planilha de alimentação (APP) + planilha de metas 2026':'Planilhas de hospedagem das bases + planilha de metas 2026',
      v:pc,fv:fP,st:semaforoMeta(pc),serie:X.ms.map((k,i)=>X.meta[i]?X.real[i]/X.meta[i]:null),lab,fs:fP,
      extra:[['Gasto realizado',R(X.tot)],['Meta do período',R(X.mt)],['Saldo',R(X.mt-X.tot)]],det:'gerencia',atu:X.cut});
    const cm=X.q?X.tot/X.q:null,var_=X.medU3&&cm?X.medU3/cm-1:null;
    L.push({cod:'IND-'+String(c0+1).padStart(2,'0'),tema,modo:m,nome:'Custo médio por '+u,
      obj:'Acompanhar o preço médio pago por '+u+' e perceber aumentos antes que pesem na meta.',
      form:'Gasto total ÷ quantidade de '+(m==='alim'?'refeições':'diárias'),und:'R$',pol:'Menor é melhor',
      meta:'Referência: média de 2026. Verde até 5% acima · amarelo até 10% · vermelho acima de 10% (últimos 3 meses fechados)',mv:cm,prop:true,freq:'Mensal',fonte:m==='alim'?'Planilha de alimentação (APP)':'Planilhas de hospedagem das bases',
      v:cm,fv:fR,st:var_==null?'nd':var_<=.05?'ok':var_<=.1?'par':'nao',serie:X.cm,lab,fs:fR,
      extra:[['Média dos últimos 3 meses fechados',R(X.medU3)],['Diferença para a média do ano',var_==null?'–':(var_>=0?'+':'')+P(var_)],[U+'s no ano',N(X.q)]],det:m==='alim'?'hoteis':'hoteis',atu:X.cut});
    const pr=X.nRows?X.nPend/X.nRows:null;
    L.push({cod:'IND-'+String(c0+2).padStart(2,'0'),tema,modo:m,nome:'Lançamentos com pendência',
      obj:'Garantir que a base usada nos indicadores esteja correta: com nota fiscal, centro de custo, valores e datas certos e sem duplicidade.',
      form:'Lançamentos com pendência ÷ total de lançamentos',und:'%',pol:'Menor é melhor',
      meta:'≤ 1% verde · até 3% amarelo · acima de 3% vermelho',mv:.01,prop:true,freq:'Diária',fonte:m==='alim'?'Planilha de alimentação (APP)':'Planilhas de hospedagem das bases',
      v:pr,fv:fP,st:pr==null?'nd':pr<=.01?'ok':pr<=.03?'par':'nao',serie:X.pend,lab,fs:fP,
      extra:[['Lançamentos com pendência',N(X.nPend)],['Total de lançamentos',N(X.nRows)]],det:'qualidade',atu:X.cut});
  };
  custo(H,'Hospedagem','hosp',1);custo(A,'Alimentação','alim',4);
  /* patrimônio */
  const lab=PMESES.map(m=>MES3[m-1]),cad=PAT.cad,cadPl=new Set(cad.map(x=>x.pl));
  const cM=PMESES.map(m=>contSt(PAT.inv.filter(x=>x.m===m)));
  const cU=cM[cM.length-1];
  L.push({cod:'IND-07',tema:'Patrimônio',nome:'Conformidade do inventário',obj:'Medir quantos bens inventariados no mês estavam em ordem (encontrados e em conformidade).',
    form:'Itens em conformidade ÷ itens verificados no mês (conformes + não conformes + não encontrados)',und:'%',pol:'Maior é melhor',
    meta:'≥ 90% verde · 80–90% amarelo · abaixo de 80% vermelho',mv:.9,prop:true,freq:'Mensal (cronograma)',fonte:'Planilha INVENTÁRIO 2026',
    v:cU.pc,fv:fP,st:cU.pc==null?'nd':cU.pc>=.9?'ok':cU.pc>=.8?'par':'nao',serie:cM.map(c=>c.pc),lab,fs:fP,
    extra:[['Mês de referência',MESES[PAT_ULT-1]],['Itens verificados',N(cU.C+cU.NC+cU.NE)],['Não conformes / não encontrados',N(cU.NC)+' / '+N(cU.NE)]],det:'pat-painel',atu:null});
  const cob=PMESES.map(m=>new Set(PAT.inv.filter(x=>x.m<=m&&cadPl.has(x.pl)).map(x=>x.pl)).size/(cad.length||1));
  const cobU=cob[cob.length-1],esp=PAT_ULT/12;
  L.push({cod:'IND-08',tema:'Patrimônio',nome:'Cobertura do inventário',obj:'Saber quanto do cadastro de bens já foi verificado pelo menos uma vez em 2026.',
    form:'Bens do cadastro verificados no ano ÷ bens cadastrados',und:'%',pol:'Maior é melhor',
    meta:'100% até dezembro. Verde a partir de 90% · amarelo de 75% a 90% · vermelho abaixo de 75%',mv:1,prop:true,freq:'Mensal',fonte:'Planilhas INVENTÁRIO 2026 e cadastro de patrimônio',
    v:cobU,fv:fP,st:cobU>=.9?'ok':cobU>=.75?'par':'nao',serie:cob,lab,fs:fP,
    extra:[['Bens verificados',N(Math.round(cobU*cad.length))+' de '+N(cad.length)],['Ainda não verificados',N(cad.length-Math.round(cobU*cad.length))]],det:'pat-bens',atu:null});
  const at=[...atual(PAT.inv).values()],ne=at.filter(x=>x.st==='NE').length,neT=ne/(at.length||1);
  L.push({cod:'IND-09',tema:'Patrimônio',nome:'Bens não encontrados',obj:'Controlar os bens que não foram localizados na última verificação e que podem representar perda.',
    form:'Bens com situação mais recente "não encontrado" ÷ bens já verificados',und:'%',pol:'Menor é melhor',
    meta:'≤ 2% verde · até 5% amarelo · acima de 5% vermelho',mv:.02,prop:true,freq:'Mensal',fonte:'Planilha INVENTÁRIO 2026',
    v:neT,fv:fP,st:neT<=.02?'ok':neT<=.05?'par':'nao',serie:cM.map(c=>(c.C+c.NC+c.NE)?c.NE/(c.C+c.NC+c.NE):null),lab,fs:fP,
    extra:[['Bens não encontrados hoje',N(ne)],['Bens já verificados',N(at.length)]],det:'pat-nc',atu:null});
  /* fale conosco */
  const fms=[...new Set(FC.at.map(x=>ymd(x.d)))].sort(),flab=fms.map(k=>MES3[+k.slice(5)-1]);
  const res=FC.at.filter(x=>x.st==='RESOLVIDO').length/(FC.at.length||1);
  L.push({cod:'IND-10',tema:'Fale Conosco',nome:'Atendimentos resolvidos',obj:'Garantir que as dúvidas e reclamações dos colaboradores tenham resposta.',
    form:'Atendimentos com status resolvido ÷ total de atendimentos',und:'%',pol:'Maior é melhor',
    meta:'≥ 95% verde · 85–95% amarelo · abaixo de 85% vermelho',mv:.95,prop:true,freq:'Mensal',fonte:'Planilha ATENDIMENTOS DO FALE CONOSCO CGB',
    v:res,fv:fP,st:res>=.95?'ok':res>=.85?'par':'nao',serie:fms.map(k=>{const x=FC.at.filter(r=>ymd(r.d)===k);return x.length?x.filter(r=>r.st==='RESOLVIDO').length/x.length:null}),lab:flab,fs:fP,
    extra:[['Atendimentos',N(FC.at.length)],['Em andamento',N(FC.at.filter(x=>x.st!=='RESOLVIDO').length)]],det:'fc-lista',atu:FC_ULT*864e5});
  const ativ=Object.values(FC.ativos).reduce((a,b)=>a+b,0);
  const alc=fms.map(k=>new Set(FC.at.filter(x=>ymd(x.d)<=k).map(x=>x.mat||x.nm)).size/(ativ||1));
  L.push({cod:'IND-11',tema:'Fale Conosco',nome:'Alcance do canal',obj:'Medir quantos colaboradores ativos já usaram o Fale Conosco, para saber se o canal é conhecido.',
    form:'Colaboradores diferentes atendidos ÷ colaboradores ativos',und:'%',pol:'Maior é melhor',
    meta:'Sem meta definida — indicador em acompanhamento',mv:null,prop:false,freq:'Mensal',fonte:'Planilha ATENDIMENTOS DO FALE CONOSCO CGB + base de colaboradores (só a contagem)',
    v:alc[alc.length-1],fv:fP,st:'nd',serie:alc,lab:flab,fs:fP,
    extra:[['Colaboradores atendidos',N(new Set(FC.at.map(x=>x.mat||x.nm)).size)],['Colaboradores ativos',N(ativ)]],det:'fc-painel',atu:FC_ULT*864e5});
  L.forEach(i=>i.id='ind-'+i.cod.slice(4));
  _IND=L;_INDk=k;return L}
/* gráficos */
function indSpark(i,W,H){W=W||220;H=H||48;const v=i.serie.map(x=>x==null?null:x),ok=v.filter(x=>x!=null);if(ok.length<2)return '';
  let mn=Math.min(...ok),mx=Math.max(...ok);if(i.mv!=null&&i.mv!==i.v){mn=Math.min(mn,i.mv);mx=Math.max(mx,i.mv)}const pad=(mx-mn)*.12||1e-9;mn-=pad;mx+=pad;
  const X=k=>3+k*(W-6)/(v.length-1),Y=x=>H-3-(H-6)*(x-mn)/(mx-mn);
  const pts=v.map((x,k)=>x==null?null:X(k).toFixed(1)+','+Y(x).toFixed(1)).filter(Boolean),c=ST_COR[i.st];
  const ml=i.mv!=null&&i.und!=='R$'?'<line x1="0" x2="'+W+'" y1="'+Y(i.mv).toFixed(1)+'" y2="'+Y(i.mv).toFixed(1)+'" class="isp-meta"/>':'';
  const lx=v.length-1;let li=lx;while(li>0&&v[li]==null)li--;
  return '<svg class="isp" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" aria-hidden="true">'+ml+'<polygon points="'+X(0).toFixed(1)+','+H+' '+pts.join(' ')+' '+X(li).toFixed(1)+','+H+'" style="fill:'+c+'" class="isp-a"/><polyline points="'+pts.join(' ')+'" style="stroke:'+c+'"/><circle cx="'+X(li).toFixed(1)+'" cy="'+Y(v[li]).toFixed(1)+'" r="3" style="fill:'+c+'"/></svg>'}
function indChart(i){const v=i.serie,W=760,H=260,L=56,B=30,T=24;const ok=v.filter(x=>x!=null);const raw=Math.max(...ok,i.mv||0)*1.08||1;const nice=x=>{const p=10**Math.floor(Math.log10(x)),f=x/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p};const st=nice(raw/5),nt=Math.ceil(raw/st),mx=st*nt;
  const bw=(W-L-10)/v.length,Y=x=>T+(H-T-B)*(1-x/mx);let g='';const ft=x=>i.und==='%'?nf0.format(x*100)+'%':(st<10&&st%1?nf1.format(x):nf0.format(x));
  for(let t=0;t<=nt;t++){const y=Y(st*t);g+='<line x1="'+L+'" x2="'+W+'" y1="'+y+'" y2="'+y+'" class="ich-g"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" class="ich-t">'+ft(st*t)+'</text>'}
  v.forEach((x,k)=>{const cx=L+k*bw+bw/2;g+='<text x="'+cx+'" y="'+(H-10)+'" text-anchor="middle" class="ich-l">'+i.lab[k]+'</text>';if(x==null)return;const y=Y(x),last=k===v.length-1;
    g+='<rect x="'+(cx-bw*.32)+'" y="'+y+'" width="'+bw*.64+'" height="'+Math.max(1,Y(0)-y)+'" rx="3" class="ich-b'+(last?' on':'')+'" data-tip="'+esc('<b>'+i.lab[k]+'</b><br>'+i.fs(x))+'"/><text x="'+cx+'" y="'+(Y(0)-y>26?y+16:y-6)+'" text-anchor="middle" class="ich-v'+(Y(0)-y>26?' in':'')+'">'+esc(i.fs(x).replace('R$ ',''))+'</text>'});
  if(i.mv!=null&&i.und!=='R$'){const y=Y(i.mv);g+='<line x1="'+L+'" x2="'+W+'" y1="'+y+'" y2="'+y+'" class="ich-m"/>'}
  if(i.und==='R$'&&i.mv){const y=Y(i.mv);g+='<line x1="'+L+'" x2="'+W+'" y1="'+y+'" y2="'+y+'" class="ich-m"/>'}
  return '<svg class="ich" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Histórico mensal de '+esc(i.nome)+'">'+g+'</svg>'}
const stDot=st=>'<span class="ist '+st+'"><i></i>'+ST_TXT[st]+'</span>';
function varTxt(i){const v=i.serie.filter(x=>x!=null);if(v.length<2)return '';const a=v[v.length-1],b=v[v.length-2];if(!b)return '';const d=a-b,up=d>0;
  const bom=(i.pol.startsWith('Maior')?up:!up);const t=i.und==='%'?(up?'+':'')+nf1.format(d*100)+' p.p.':(up?'+':'')+P(a/b-1);
  return '<span class="ivar '+(Math.abs(d)<1e-9?'':bom?'bom':'ruim')+'">'+(up?'▲':'▼')+' '+t+' <small>vs mês anterior</small></span>'}
/* página inicial */
PG.portal=()=>{
  const L=INDS(),cnt=s=>L.filter(i=>i.st===s).length,nm=L.filter(i=>i.st!=='nd').length,ok=cnt('ok'),sc=nm?ok/nm:0;
  const vis=L.filter(i=>(!PF_TEMA||i.tema===PF_TEMA)&&(!PF_ST||i.st===PF_ST));
  const anel=(()=>{const r=46,c=2*Math.PI*r;let o=0,h='';for(const s of ['ok','par','nao']){const f=cnt(s)/(nm||1);if(f)h+='<circle r="'+r+'" cx="60" cy="60" style="stroke:'+ST_COR[s]+'" stroke-dasharray="'+(f*c-3).toFixed(1)+' '+c+'" stroke-dashoffset="'+(-o*c).toFixed(1)+'"/>';o+=f}return '<svg class="anel" viewBox="0 0 120 120" aria-hidden="true"><circle r="46" cx="60" cy="60" class="anel-f"/>'+h+'</svg>'})();
  const card=i=>'<a class="ind '+i.st+'" href="#'+i.id+'"><div class="ind-hd"><span>'+ico(TEMA_ICO[i.tema])+i.tema+'</span><code>'+i.cod+'</code></div><h3>'+esc(i.nome)+'</h3>'+
    '<div class="ind-mid"><div><div class="ind-v">'+i.fv(i.v)+'</div><div class="ind-m">'+(i.mv==null?'sem meta definida':i.und==='R$'?'média 2026 · '+i.fv(i.mv):'meta '+(i.pol.startsWith('Maior')?'≥ ':'≤ ')+i.fv(i.mv))+(i.prop?' <em>proposta</em>':'')+'</div></div>'+indSpark(i,200,52)+'</div>'+
    '<div class="ind-st">'+stDot(i.st)+varTxt(i)+'</div><div class="ind-ft"><span>⟳ '+i.freq+'</span><span>'+esc(i.pol)+'</span><b>Ver ficha →</b></div></a>';
  const foco=L.filter(i=>i.st==='nao'||i.st==='par').sort((a,b)=>(a.st==='nao'?0:1)-(b.st==='nao'?0:1));
  const chip=(k,v,t,n)=>'<button type="button" class="pchip'+((k==='t'?PF_TEMA:PF_ST)===v?' on':'')+'" data-pchip="'+k+'|'+v+'">'+t+(n!=null?' <b>'+n+'</b>':'')+'</button>';
  const grupos=(PF_TEMA?[PF_TEMA]:TEMAS).map(t=>({t,l:vis.filter(i=>i.tema===t)})).filter(g=>g.l.length);
  return '<div class="phero"><div class="phero-t"><span class="ubar-tag">Administrativo · CGB</span><h2>Indicadores do Administrativo</h2><p>'+N(L.length)+' indicadores de 4 áreas, calculados direto das planilhas. Clique em qualquer um para ver a ficha completa.</p>'+
    '<div class="pres">'+['ok','par','nao','nd'].map(s=>'<button type="button" class="pres-i '+s+(PF_ST===s?' on':'')+'" data-pchip="s|'+s+'"><i></i><b>'+cnt(s)+'</b><span>'+ST_TXT[s].toLowerCase()+'</span></button>').join('')+'</div></div>'+
    '<div class="phero-sc">'+anel+'<div class="phero-n"><b>'+P(sc).replace(',0','')+'</b><small>dos indicadores<br>com meta estão no verde</small></div></div></div>'+
    (foco.length&&!PF_TEMA&&!PF_ST?'<div class="panel pfoco"><div class="phd"><h3>Precisa de atenção agora</h3><small>ordenado pela gravidade</small></div><div class="pfoco-l">'+foco.map(i=>'<a href="#'+i.id+'" class="pf-i '+i.st+'"><i></i><code>'+i.cod+'</code><span>'+esc(i.nome)+' <small>'+i.tema+'</small></span><b>'+i.fv(i.v)+'</b><small class="pf-m">'+(i.mv==null?'':(i.und==='R$'?'média ':'meta ')+i.fv(i.mv))+'</small></a>').join('')+'</div></div>':'')+
    '<div class="pchips">'+chip('t','','Todas as áreas')+TEMAS.map(t=>chip('t',t,t,L.filter(i=>i.tema===t).length)).join('')+(PF_ST?'<button type="button" class="pchip on" data-pchip="s|">'+ST_TXT[PF_ST]+' ✕</button>':'')+'</div>'+
    (grupos.length?grupos.map(g=>'<div class="pgrp"><div class="pgrp-h">'+ico(TEMA_ICO[g.t])+'<h3>'+g.t+'</h3><span>'+g.l.length+' indicador'+(g.l.length>1?'es':'')+'</span><a href="#'+g.l[0].det+'" data-ir="'+(g.l[0].modo||'')+'|'+({Hospedagem:'inicio','Alimentação':'inicio','Patrimônio':'pat-painel','Fale Conosco':'fc-painel'})[g.t]+'">Abrir painel da área →</a></div><div class="pgrid">'+g.l.map(card).join('')+'</div></div>').join(''):'<div class="note">Nenhum indicador com esse filtro.</div>')}
/* ficha */
PG.ficha=()=>{
  const L=INDS(),id=location.hash.slice(1),k=L.findIndex(i=>i.id===id),i=L[k]||L[0],ant=L[k-1],prox=L[k+1];
  const linhas=[['Objetivo',i.obj],['Fórmula',i.form],['Unidade',i.und==='%'?'Percentual (%)':'Reais (R$)'],['Polaridade',i.pol],['Meta e farol',i.meta+(i.prop?' <span class="pill par">meta proposta — confirmar com a gestão</span>':'')],['Periodicidade',i.freq],['Fonte dos dados',i.fonte],['Última atualização',i.atu?dt(Math.floor(i.atu/864e5)):MESES[PAT_ULT-1]+'/2026 (último inventário)'],['Responsável','Administrativo CGB']];
  const hist=i.serie.map((v,n)=>({l:i.lab[n],v})).filter(x=>x.v!=null).reverse();
  return '<nav class="bread"><a href="#portal">Administrativo</a><span>›</span><a href="#catalogo">Catálogo</a><span>›</span><b>'+i.cod+'</b></nav>'+
   '<div class="fhd"><div><span class="ubar-tag">'+ico(TEMA_ICO[i.tema])+' '+i.tema+' · '+i.cod+'</span><h2>'+esc(i.nome)+'</h2><p>'+esc(i.obj)+'</p></div><div class="fstep"><span class="fstep-n">Indicador <b>'+(k+1)+'</b> de <b>'+L.length+'</b></span><div class="fstep-c">'+(ant?'<a class="fstep-b" href="#'+ant.id+'" title="Anterior: '+ant.cod+' · '+esc(ant.nome)+'" aria-label="Indicador anterior">'+CHEV_L+'</a>':'<span class="fstep-b off">'+CHEV_L+'</span>')+
     '<select class="fstep-s" data-indgo aria-label="Ir para outro indicador">'+TEMAS.filter(t=>L.some(x=>x.tema===t)).map(t=>'<optgroup label="'+t+'">'+L.filter(x=>x.tema===t).map(x=>'<option value="'+x.id+'"'+(x.id===i.id?' selected':'')+'>'+x.cod+' · '+esc(x.nome)+'</option>').join('')+'</optgroup>').join('')+'</select>'+
     (prox?'<a class="fstep-b" href="#'+prox.id+'" title="Próximo: '+prox.cod+' · '+esc(prox.nome)+'" aria-label="Próximo indicador">'+CHEV_R+'</a>':'<span class="fstep-b off">'+CHEV_R+'</span>')+'</div></div></div>'+
   '<div class="fgrid"><div class="panel fval '+i.st+'"><div class="phd"><h3>Resultado atual</h3></div><div class="fval-v">'+i.fv(i.v)+'</div>'+stDot(i.st)+'<div class="fval-m">'+(i.mv==null?'Sem meta definida':(i.und==='R$'?'Referência (média 2026): ':'Meta: '+(i.pol.startsWith('Maior')?'≥ ':'≤ '))+i.fv(i.mv))+'</div>'+varTxt(i)+
   '<dl class="fx">'+i.extra.map(([a,b])=>'<div><dt>'+a+'</dt><dd>'+b+'</dd></div>').join('')+'</dl>'+
   '<a class="btn primary fgo" href="#'+i.det+'" data-ir="'+(i.modo||'')+'|'+i.det+'">Analisar em detalhe →</a></div>'+
   '<div class="panel"><div class="phd"><h3>Histórico mensal</h3><small>'+(i.mv!=null?'- - - '+(i.und==='R$'?'média do ano':'meta')+' '+i.fv(i.mv):'')+(i.und==='R$'?' · valores em R$':'')+'</small></div>'+indChart(i)+'</div></div>'+
   '<div class="fgrid2"><div class="panel"><div class="phd"><h3>Ficha técnica</h3><small>como este indicador é calculado</small></div><dl class="ftec">'+linhas.map(([a,b])=>'<div><dt>'+a+'</dt><dd>'+b+'</dd></div>').join('')+'</dl></div>'+
   '<div class="panel"><div class="phd"><h3>Mês a mês</h3></div>'+tabela([{h:'Mês',f:x=>x.l},{h:'Resultado',n:1,f:x=>i.fs(x.v)},{h:'Situação',f:x=>{const t=Object.assign({},i,{v:x.v});return stDot(stDe(t))}}],hist,{})+'</div></div>'+
   '<nav class="fpag" aria-label="Navegar entre indicadores">'+(ant?'<a class="fpag-i ant" href="#'+ant.id+'">'+CHEV_L+'<span><small>Indicador anterior</small><b>'+ant.cod+' · '+esc(ant.nome)+'</b><em>'+ant.tema+'</em></span></a>':'<span></span>')+
   (prox?'<a class="fpag-i prox" href="#'+prox.id+'"><span><small>Próximo indicador</small><b>'+prox.cod+' · '+esc(prox.nome)+'</b><em>'+prox.tema+'</em></span>'+CHEV_R+'</a>':'<span></span>')+'</nav>'}
const CHEV_L='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',CHEV_R='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
function stDe(i){const v=i.v;if(v==null||i.mv==null)return 'nd';
  if(i.und==='R$'){const d=v/i.mv-1;return d<=.05?'ok':d<=.1?'par':'nao'}
  if(i.cod==='IND-01'||i.cod==='IND-04')return semaforoMeta(v);
  const m=/(\d+)%[^·]*·[^0-9]*(\d+)/.exec(i.meta);
  if(i.pol.startsWith('Maior')){const lim={['IND-07']:[.9,.8],['IND-08']:[.9,.75],['IND-10']:[.95,.85]}[i.cod]||[i.mv,i.mv*.9];return v>=lim[0]?'ok':v>=lim[1]?'par':'nao'}
  const lim={['IND-03']:[.01,.03],['IND-06']:[.01,.03],['IND-09']:[.02,.05]}[i.cod]||[i.mv,i.mv*1.1];return v<=lim[0]?'ok':v<=lim[1]?'par':'nao'}
/* catálogo */
PG.catalogo=()=>{const L=INDS();
  return '<div class="ubar"><div class="ubar-l"><span class="ubar-ic">'+ico('lista')+'</span><div class="ubar-t"><span class="ubar-tag">Administrativo · CGB</span><h2>Catálogo de indicadores</h2><span>O que cada número significa, como é calculado, qual a meta e de onde vem o dado.</span></div></div></div>'+
  '<div class="panel">'+tabela([{h:'Código',f:i=>'<a href="#'+i.id+'"><code>'+i.cod+'</code></a>'},{h:'Indicador',w:1,f:i=>'<a href="#'+i.id+'"><b>'+esc(i.nome)+'</b></a><br><small>'+i.tema+'</small>'},{h:'Fórmula',w:1,f:i=>esc(i.form)},{h:'Meta',w:1,f:i=>esc(i.meta)+(i.prop?' <span class="pill par">proposta</span>':'')},{h:'Polaridade',f:i=>i.pol},{h:'Frequência',f:i=>i.freq},{h:'Atual',n:1,f:i=>i.fv(i.v)},{h:'Situação',f:i=>stDot(i.st)}],L,{})+'</div>'+
  '<div class="note">As metas marcadas como <b>proposta</b> foram sugeridas para o portal funcionar e precisam ser confirmadas pela gestão. As metas de hospedagem e refeição vêm da planilha de metas 2026.</div>'}
function renderNav(p){const sec=p.g==='Administrativo'?(p.id==='catalogo'?'catalogo':'portal'):p.g;
  const it=[['portal','Administrativo','#portal'],['Hospedagem / Alimentação','Hospedagem e Alimentação','#inicio'],['Patrimônio','Patrimônio','#pat-painel'],['Fale Conosco','Fale Conosco','#fc-painel'],['catalogo','Catálogo de indicadores','#catalogo']];
  $('tnav').innerHTML=it.map(([k,t,h])=>'<a href="'+h+'"'+(k===sec?' aria-current="page"':'')+'>'+t+'</a>').join('')}
function ligarPortal(){const m=$('main');const ig=m.querySelector('[data-indgo]');if(ig)ig.onchange=()=>{location.hash=ig.value};
  m.querySelectorAll('[data-pchip]').forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.pchip.split('|');if(k==='t')PF_TEMA=PF_TEMA===v?'':v;else PF_ST=PF_ST===v?'':v;render()});
  m.querySelectorAll('[data-ir]').forEach(a=>a.onclick=e=>{const [mo,h]=a.dataset.ir.split('|');if(mo&&mo!==MODO){e.preventDefault();usar(mo);if(location.hash==='#'+h)render();else location.hash=h}})}
