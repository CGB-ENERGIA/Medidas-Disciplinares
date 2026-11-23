/* =========================================================
   CGB · Biblioteca de gráficos e painel de detalhe
   VX = gráficos (SVG, sem dependências)  ·  DT = painel de detalhe
   Requer o CSS cgb-kit.css (variáveis --vx* e classes .vx-*, .dt-*)
   ========================================================= */

const VX={
  esc:s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
  cap:s=>String(s||'').toLowerCase().replace(/(^|[\s(/-])\S/g,m=>m.toUpperCase()),
  brl(v){v=+v||0;const a=Math.abs(v),s=v<0?'-':'';return a>=1e6?s+'R$ '+(a/1e6).toFixed(2).replace('.',',')+' mi':a>=1e3?s+'R$ '+(a/1e3).toFixed(1).replace('.',',')+' mil':s+'R$ '+Math.round(a)},
  pc:v=>v==null||!isFinite(v)?'–':(v*100).toFixed(0)+'%',
  card(tag,tit,sub,body,leg){return '<div class="vx-card"><div class="vx-h"><span class="vx-tag">'+tag+'</span><h3>'+tit+'</h3>'+(sub?'<small>'+sub+'</small>':'')+'</div><div class="vx-b">'+body+'</div>'+(leg?'<div class="vx-leg">'+leg+'</div>':'')+'</div>'},
  li:(cls,t)=>'<span><i class="'+cls+'"></i>'+t+'</span>',
  vazio:t=>'<div class="vx-vazio">'+t+'</div>',
  M3:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
};

/* Barra com marca de meta (bullet graph, Stephen Few) */
VX.bullet=function(it,o){o=o||{};if(!it.length)return VX.vazio('Sem dados para o período.');
  const W=640,rh=34,L=228,mx=Math.max(...it.map(a=>Math.max(a.meta||0,a.v)))*1.06||1,x=v=>L+(W-L-64)*v/mx;
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+(it.length*rh+6)+'" role="img" aria-label="'+VX.esc(o.aria||'Gasto contra meta')+'">';
  it.forEach((a,i)=>{const y=i*rh+4,p=a.meta?a.v/a.meta:null,ov=p!=null&&p>1;
    s+='<g class="vx-clk"'+(a.d?' data-vxd="'+VX.esc(a.d)+'"':'')+'><rect x="0" y="'+y+'" width="'+W+'" height="'+(rh-2)+'" fill="transparent"/>';s+='<text class="vx-t" x="0" y="'+(y+17)+'" font-size="12.5" font-weight="600">'+VX.esc(a.nm.length>30?a.nm.slice(0,29)+'…':a.nm)+'<title>'+VX.esc(a.nm)+'</title></text>';
    if(a.meta)s+='<rect class="vx-track" x="'+L+'" y="'+(y+7)+'" width="'+(x(a.meta)-L)+'" height="14" rx="7"/>';
    s+='<rect class="'+(ov?'vx-bad':'vx-w')+'" x="'+L+'" y="'+(y+7)+'" width="'+Math.max(4,x(a.v)-L)+'" height="14" rx="7"><title>'+VX.esc(a.nm)+': '+VX.brl(a.v)+(a.meta?' de '+VX.brl(a.meta):'')+'</title></rect>';
    if(a.meta)s+='<rect class="vx-mark" x="'+(x(a.meta)-1.5)+'" y="'+(y+1)+'" width="3" height="26" rx="1.5"/>';
    s+='<text class="'+(ov?'vx-tbad':'vx-t')+'" x="'+(Math.max(a.meta?x(a.meta):0,x(a.v))+8)+'" y="'+(y+18)+'" font-size="12" font-weight="800">'+(p!=null?VX.pc(p):VX.brl(a.v))+'</text></g>'});
  return s+'</svg>'};

/* Linha acumulada contra o ritmo da meta */
VX.ritmo=function(ms,real,meta){const n=ms.length;if(!n)return VX.vazio('Sem dados.');
  const ac=[],am=[];let r=0,m=0;ms.forEach((k,i)=>{r+=real[i]||0;m+=meta[i]||0;ac.push(r);am.push(m)});
  const W=460,H=300,PL=54,PB=28,top=Math.max(...ac,...am)*1.08||1,bx=i=>PL+(W-PL-14)*(n>1?i/(n-1):.5),by=v=>H-PB-(H-PB-14)*v/top;
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Gasto acumulado contra o ritmo da meta">';
  const step=top>4e6?1e6:top>2e6?5e5:top>8e5?2e5:top>2e5?5e4:top>4e4?1e4:top>8e3?2e3:500;
  for(let v=0;v<=top;v+=step)s+='<line class="vx-grid" x1="'+PL+'" x2="'+(W-14)+'" y1="'+by(v)+'" y2="'+by(v)+'"/><text class="vx-m" x="'+(PL-6)+'" y="'+(by(v)+4)+'" font-size="10" text-anchor="end">'+VX.brl(v).replace('R$ ','')+'</text>';
  ms.forEach((k,i)=>{if(n<=12||i%2===0)s+='<text class="vx-m" x="'+bx(i)+'" y="'+(H-8)+'" font-size="10" text-anchor="middle">'+VX.M3[+k.slice(5)-1]+'</text>'});
  const pm=am.map((v,i)=>bx(i)+','+by(v)).join(' '),pr=ac.map((v,i)=>bx(i)+','+by(v)).join(' ');
  if(am[n-1]>0)s+='<polyline points="'+pm+'" fill="none" class="vx-sk" stroke-width="1.6" stroke-dasharray="5 4"/>';
  s+='<polygon points="'+bx(0)+','+by(0)+' '+pr+' '+bx(n-1)+','+by(0)+'" class="vx-area"/><polyline points="'+pr+'" fill="none" class="vx-swine" stroke-width="2.6"/>';
  const lx=bx(n-1),ly=by(ac[n-1]),ok=ac[n-1]<=am[n-1]||!am[n-1];
  s+='<circle cx="'+lx+'" cy="'+ly+'" r="5" class="'+(ok?'vx-w':'vx-bad')+'" stroke="#fff" stroke-width="2"/>';
  s+='<text class="'+(ok?'vx-tw':'vx-tbad')+'" x="'+(lx-8)+'" y="'+(ly+(ly<60?22:-10))+'" font-size="12" font-weight="800" text-anchor="end">'+VX.brl(ac[n-1])+'</text>';
  if(am[n-1]>0)s+='<text class="vx-t" x="'+(lx-8)+'" y="'+(by(am[n-1])+(by(am[n-1])<by(ac[n-1])?-8:16))+'" font-size="10.5" font-weight="700" text-anchor="end">meta até aqui · '+VX.brl(am[n-1])+'</text>';
  return {svg:s+'</svg>',gap:am[n-1]-ac[n-1],tem:am[n-1]>0}};

/* Mapa de blocos: coluna por grupo, blocos por subgrupo */
VX.blocos=function(grupos,nomeG){if(!grupos.length)return VX.vazio('Sem dados.');
  const TW=1300,TH=290,HD=26,tot=grupos.reduce((a,g)=>a+g.v,0)||1;let x0=0,k=0;
  let s='<svg class="vx-svg" viewBox="0 0 '+TW+' '+(TH+HD)+'" role="img" aria-label="Mapa de blocos">';
  for(const g of grupos){const w=TW*g.v/tot,op=[1,.86,.72,.6,.5,.42][Math.min(k,5)];k++;
    s+='<text class="vx-t" x="'+(x0+4)+'" y="16" font-size="13" font-weight="900">'+VX.esc(w>150?nomeG(g.k):g.k)+'<tspan class="vx-m" font-weight="700"> · '+(w>330?VX.brl(g.v)+' · ':'')+Math.round(g.v/tot*100)+'%</tspan></text>';
    const it=g.sub.slice(0,3),rest=g.sub.slice(3).reduce((a,c)=>a+c.v,0);if(rest>0)it.push({k:'Outras',v:rest,o:1});
    let y0=HD;for(const c of it){const h=TH*c.v/(g.v||1);
      s+='<g class="vx-clk" data-vxd="'+VX.esc(c.o?'b|'+g.k+'|'+nomeG(g.k):'cid|'+c.k+'|'+VX.cap(c.k))+'"><rect class="vx-tm" x="'+(x0+1.5)+'" y="'+(y0+1.5)+'" width="'+Math.max(0,w-3)+'" height="'+Math.max(0,h-3)+'" rx="8" fill-opacity="'+(c.o?op*.55:op)+'"><title>'+VX.esc(nomeG(g.k)+' · '+c.k+': '+VX.brl(c.v))+'</title></rect>';
      if(h>40&&w>95)s+='<text x="'+(x0+11)+'" y="'+(y0+20)+'" font-size="12" font-weight="700" class="vx-num">'+VX.esc(VX.cap(c.k).slice(0,Math.floor(w/8)))+'</text><text x="'+(x0+11)+'" y="'+(y0+35)+'" font-size="11" fill="#ffe0e7">'+VX.brl(c.v)+'</text>';
      s+='</g>';y0+=h}
    x0+=w}
  return s+'</svg>'};

/* Linha do tempo de contratos */
VX.tempo=function(L,hoje){const fut=L.filter(i=>i.fim&&Date.parse(i.fim)>=hoje).sort((a,b)=>a.fim<b.fim?-1:1);if(!fut.length)return {svg:VX.vazio('Nenhum contrato com vencimento futuro.'),n90:0};
  const vist={},sel=[];for(const i of fut){vist[i.fim]=(vist[i.fim]||0)+1;if(vist[i.fim]<=2)sel.push(i);if(sel.length>=12)break}
  const n90=fut.filter(i=>(Date.parse(i.fim)-hoje)/864e5<=90).length;
  const W=640,rh=26,LB=196,t0=hoje-120*864e5,t1=hoje+300*864e5,X=d=>LB+(W-LB-60)*Math.max(0,Math.min(1,(d-t0)/(t1-t0)));
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+(sel.length*rh+44)+'" role="img" aria-label="Linha do tempo dos contratos">';
  const d0=new Date(t0);for(let m=0;m<=14;m+=3){const d=new Date(d0.getFullYear(),d0.getMonth()+m+1,1).getTime();if(d>t1)break;
    s+='<line class="vx-grid" x1="'+X(d)+'" x2="'+X(d)+'" y1="18" y2="'+(sel.length*rh+24)+'"/><text class="vx-m" x="'+X(d)+'" y="12" font-size="10.5" text-anchor="middle">'+VX.M3[new Date(d).getMonth()]+'/'+String(new Date(d).getFullYear()).slice(2)+'</text>'}
  s+='<rect class="vx-zona" x="'+X(hoje)+'" y="18" width="'+(X(hoje+90*864e5)-X(hoje))+'" height="'+(sel.length*rh+6)+'"/>';
  sel.forEach((i,k)=>{const y=k*rh+24,f=Date.parse(i.fim),ini=i.ini?Date.parse(i.ini):t0,d=Math.round((f-hoje)/864e5),u=d<=90;
    s+='<g class="vx-clk" data-vxd="id|'+VX.esc(i.id)+'|'+VX.esc(VX.cap(i.im))+'"><rect x="0" y="'+(y+1)+'" width="'+W+'" height="'+(rh-2)+'" fill="transparent"/>';s+='<text class="vx-t" x="0" y="'+(y+14)+'" font-size="11.5" font-weight="600">'+VX.esc(VX.cap(i.im).slice(0,22))+'<title>'+VX.esc(i.im+' · '+(i.loc||''))+'</title></text><text class="vx-m" x="'+(LB-8)+'" y="'+(y+14)+'" font-size="10" text-anchor="end">'+VX.esc(i.b)+'</text>';
    s+='<rect class="'+(u?'vx-bad':'vx-w')+'" x="'+X(ini)+'" y="'+(y+4)+'" width="'+Math.max(6,X(f)-X(ini))+'" height="13" rx="6.5" fill-opacity="'+(u?1:.5)+'"/>';
    s+='<circle cx="'+X(f)+'" cy="'+(y+10.5)+'" r="4.5" class="vx-dot'+(u?' bad':'')+'"/><text class="'+(u?'vx-tbad':'vx-m')+'" x="'+(X(f)+9)+'" y="'+(y+14)+'" font-size="10.5" font-weight="800">'+d+' dias</text></g>'});
  s+='<line class="vx-sk" x1="'+X(hoje)+'" x2="'+X(hoje)+'" y1="16" y2="'+(sel.length*rh+26)+'" stroke-width="1.5" stroke-dasharray="3 3"/><text class="vx-t" x="'+(X(hoje)+4)+'" y="'+(sel.length*rh+38)+'" font-size="10.5" font-weight="700">hoje</text>';
  return {svg:s+'</svg>',n90}};

/* Grade de situação (linhas x meses) */
VX.GST={pago:['vx-ok','Pago'],parc:['vx-par','Parcial'],aber:['vx-bad','Em aberto'],nid:['vx-nid','Não identificado'],sem:['vx-sem','Sem lançamento'],fora:['vx-fora','Fora do contrato']};
VX.grade=function(L,M,cur){const sc=i=>M.reduce((a,m)=>a+({aber:3,parc:2,nid:.3}[i.sm[m]]||0),0);
  const pend=L.filter(i=>M.some(m=>m!==cur&&/aber|parc/.test(i.sm[m]))).sort((a,b)=>sc(b)-sc(a)).slice(0,9);
  const ok=L.filter(i=>!pend.includes(i)&&M.filter(m=>i.sm[m]==='pago').length>=3).slice(0,Math.max(3,12-pend.length));
  const rows=pend.concat(ok);if(!rows.length)return VX.vazio('Sem pagamentos no período.');
  const cw=56,LB=196;let s='<svg class="vx-svg" viewBox="0 0 '+(LB+cw*M.length)+' '+(rows.length*26+30)+'" role="img" aria-label="Situação do aluguel mês a mês">';
  M.forEach((m,k)=>s+='<text class="vx-m" x="'+(LB+k*cw+cw/2)+'" y="14" font-size="11" font-weight="700" text-anchor="middle">'+VX.M3[+m.slice(5)-1]+(m===cur?'*':'')+'</text>');
  rows.forEach((i,r)=>{const y=r*26+22;if(r===pend.length&&r>0)s+='<line class="vx-grid" x1="0" x2="'+(LB+cw*M.length)+'" y1="'+(y-1)+'" y2="'+(y-1)+'"/>';s+='<g class="vx-clk" data-vxd="id|'+VX.esc(i.id)+'|'+VX.esc(VX.cap(i.im))+'">';
    s+='<text class="vx-t" x="0" y="'+(y+15)+'" font-size="11.5" font-weight="600">'+VX.esc(VX.cap(i.im).slice(0,20))+'<title>'+VX.esc(i.im+' · '+(i.loc||''))+'</title></text><text class="vx-m" x="'+(LB-8)+'" y="'+(y+15)+'" font-size="10" text-anchor="end">'+VX.esc(i.b)+'</text>';
    M.forEach((m,k)=>{const g=VX.GST[i.sm[m]]||VX.GST.sem;s+='<rect class="'+g[0]+'"'+(m===cur?' fill-opacity=".4"':'')+' x="'+(LB+k*cw+3)+'" y="'+(y+2)+'" width="'+(cw-6)+'" height="20" rx="6"><title>'+VX.esc(VX.cap(i.im))+' · '+VX.M3[+m.slice(5)-1]+': '+g[1]+'</title></rect>'});s+='</g>'});
  return s+'</svg>'};

/* Mini gráficos lado a lado (small multiples) */
VX.minis=function(L,idx,un){const lim=(typeof LF!=='undefined'&&LF.mes)||'9999';const cm=L.filter(i=>i.cons).map(i=>{const ks=Object.keys(i.cons).filter(k=>k<=lim).sort(),v=ks.map(k=>+(i.cons[k]||[])[idx]||0);if(ks.length<4)return null;const base=v.slice(0,-1),av=base.reduce((a,b)=>a+b,0)/Math.max(1,base.length);return {i,ks,v,r:av?v[v.length-1]/av:0}}).filter(o=>o&&Math.max(...o.v)>0&&o.v[o.v.length-1]>0).sort((a,b)=>b.r-a.r).slice(0,8);
  if(!cm.length)return VX.vazio('Ainda não há histórico de contas suficiente para comparar.');
  return '<div class="vx-minis">'+cm.map(o=>{const mx=Math.max(...o.v),w=260,h=64,pts=o.v.map((v,k)=>[(k/(o.v.length-1))*(w-12)+6,h-8-(v/mx)*(h-18)]),al=o.r>1.25,d=Math.round(o.r*100-100);
    return '<div class="vx-mini vx-clk'+(al?' vx-al':'')+'" data-vxd="id|'+VX.esc(o.i.id)+'|'+VX.esc(VX.cap(o.i.im))+'"><b>'+VX.esc(VX.cap(o.i.im).slice(0,26))+' <span>· '+VX.esc(o.i.b)+'</span></b><small>'+(al?'▲ ':'')+'último mês '+(d>=0?'+':'')+d+'% vs média · '+VX.brl(o.v[o.v.length-1])+'</small><svg viewBox="0 0 '+w+' '+h+'" class="vx-svg"><polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" class="'+(al?'vx-sbad':'vx-swine')+'" stroke-width="2"/><circle cx="'+pts[pts.length-1][0]+'" cy="'+pts[pts.length-1][1]+'" r="4" class="'+(al?'vx-bad':'vx-w')+'"/></svg></div>'}).join('')+'</div>'};


/* Último mês × média: quais contas subiram mais (barras pareadas) */
VX.subiu=function(L,idx){const lim=(typeof LF!=='undefined'&&LF.mes)||'9999';
  const it=L.filter(i=>i.cons).map(i=>{const ks=Object.keys(i.cons).filter(k=>k<=lim).sort(),v=ks.map(k=>+(i.cons[k]||[])[idx]||0);if(ks.length<3)return null;
    const ult=v[v.length-1],ant=v.slice(0,-1).filter(x=>x>0),med=ant.length?ant.reduce((a,b)=>a+b,0)/ant.length:0;if(!ult||!med)return null;
    return {i,ult,med,dif:ult-med,mes:ks[ks.length-1]}}).filter(o=>o&&o.med>=20&&o.dif>=Math.max(5,o.med*.1)).sort((a,b)=>b.dif-a.dif).slice(0,8);
  if(!it.length)return VX.vazio('Nenhuma conta subiu mais de 10% acima da média no último mês.');
  const W=1100,rh=44,LB=250,RB=210,mx=Math.max(...it.map(o=>o.ult))||1,x=v=>LB+(W-LB-RB)*v/mx;
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+(it.length*rh+4)+'" role="img" aria-label="Contas que mais subiram">';
  it.forEach((o,k)=>{const y=k*rh+2,p=o.ult/o.med-1;
    s+='<g class="vx-clk" data-vxd="id|'+VX.esc(o.i.id)+'|'+VX.esc(VX.cap(o.i.im))+'"><rect x="0" y="'+y+'" width="'+W+'" height="'+(rh-4)+'" fill="transparent"/>';
    s+='<text class="vx-t" x="0" y="'+(y+17)+'" font-size="13" font-weight="700">'+VX.esc(VX.cap(o.i.im).slice(0,28))+'</text><text class="vx-m" x="0" y="'+(y+33)+'" font-size="11">'+VX.esc(VX.cap(o.i.loc||'').slice(0,26))+' · '+VX.esc(o.i.b)+'</text>';
    s+='<rect class="vx-media" x="'+LB+'" y="'+(y+6)+'" width="'+Math.max(3,x(o.med)-LB)+'" height="12" rx="6"/><text class="vx-m" x="'+(x(o.med)+6)+'" y="'+(y+16)+'" font-size="11">média '+VX.brl(o.med)+'</text>';
    s+='<rect class="vx-bad" x="'+LB+'" y="'+(y+22)+'" width="'+Math.max(3,x(o.ult)-LB)+'" height="12" rx="6"/><text class="vx-tbad" x="'+(x(o.ult)+6)+'" y="'+(y+32)+'" font-size="11" font-weight="800">'+VX.M3[+o.mes.slice(5)-1]+' '+VX.brl(o.ult)+'</text>';
    s+='<text class="vx-tbad" x="'+(W-4)+'" y="'+(y+20)+'" font-size="15" font-weight="900" text-anchor="end">+'+VX.brl(o.dif)+'</text><text class="vx-m" x="'+(W-4)+'" y="'+(y+35)+'" font-size="11" text-anchor="end">'+(p>=10?'mais de 10x':'+'+Math.round(p*100)+'%')+' sobre a média</text></g>'});
  return s+'</svg>'};


/* Todas as bases: último mês × média mensal */
VX.subiuBase=function(L,idx){const lim=(typeof LF!=='undefined'&&LF.mes)||'9999',tot={};
  L.forEach(i=>Object.entries(i.cons||{}).forEach(([m,c])=>{if(m>lim)return;const x=+(c||[])[idx]||0;(tot[i.b]=tot[i.b]||{})[m]=(tot[i.b][m]||0)+x}));
  const all=[...new Set(Object.values(tot).flatMap(o=>Object.keys(o).filter(m=>o[m]>0)))].sort(),ult=all[all.length-1];if(!ult)return VX.vazio('Sem contas no período.');
  const nb=b=>{try{return bnome(b)}catch(e){return b}};
  const it=Object.keys(tot).map(b=>{const o=tot[b],ant=Object.keys(o).filter(m=>m<ult&&o[m]>0).map(m=>o[m]),med=ant.length?ant.reduce((a,c)=>a+c,0)/ant.length:0,u=o[ult]||0;return {b,u,med,dif:u-med}}).filter(o=>o.u||o.med).sort((a,b)=>b.dif-a.dif);
  const W=1100,rh=44,LB=210,RB=210,mx=Math.max(...it.map(o=>Math.max(o.u,o.med)))||1,x=v=>LB+(W-LB-RB)*v/mx;
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+(it.length*rh+4)+'" role="img" aria-label="Contas por base">';
  it.forEach((o,k)=>{const y=k*rh+2,up=o.dif>0.5,p=o.med?o.u/o.med-1:null;
    s+='<g class="vx-clk" data-vxd="b|'+o.b+'|'+VX.esc(nb(o.b))+'"><rect x="0" y="'+y+'" width="'+W+'" height="'+(rh-4)+'" fill="transparent"/>';
    s+='<text class="vx-t" x="0" y="'+(y+18)+'" font-size="13.5" font-weight="800">'+VX.esc(nb(o.b))+'</text><text class="vx-m" x="0" y="'+(y+34)+'" font-size="11">'+o.b+'</text>';
    s+='<rect class="vx-media" x="'+LB+'" y="'+(y+6)+'" width="'+Math.max(3,x(o.med)-LB)+'" height="12" rx="6"/><text class="vx-m" x="'+(x(o.med)+6)+'" y="'+(y+16)+'" font-size="11">média '+VX.brl(o.med)+'</text>';
    s+='<rect class="'+(up?'vx-bad':'vx-ok')+'" x="'+LB+'" y="'+(y+22)+'" width="'+Math.max(3,x(o.u)-LB)+'" height="12" rx="6"/><text class="'+(up?'vx-tbad':'vx-tok')+'" x="'+(x(o.u)+6)+'" y="'+(y+32)+'" font-size="11" font-weight="800">'+VX.M3[+ult.slice(5)-1]+' '+VX.brl(o.u)+'</text>';
    s+='<text class="'+(up?'vx-tbad':'vx-tok')+'" x="'+(W-4)+'" y="'+(y+20)+'" font-size="15" font-weight="900" text-anchor="end">'+(up?'+':'−')+VX.brl(Math.abs(o.dif)).replace('-','')+'</text><text class="vx-m" x="'+(W-4)+'" y="'+(y+35)+'" font-size="11" text-anchor="end">'+(p==null?'sem histórico':(p>=0?'+':'')+Math.round(p*100)+'% '+(up?'acima':'abaixo')+' da média')+'</text></g>'});
  return s+'</svg>'};


/* Um mini gráfico de colunas por base */
VX.minisBase=function(L,idx){const d0=new Date(),cur=d0.getFullYear()+'-'+String(d0.getMonth()+1).padStart(2,'0'),lim=(typeof LF!=='undefined'&&LF.mes)||'9999',tot={};
  L.forEach(i=>Object.entries(i.cons||{}).forEach(([m,c])=>{if(m>lim)return;const x=+(c||[])[idx]||0;(tot[i.b]=tot[i.b]||{})[m]=(tot[i.b][m]||0)+x}));
  const all=[...new Set(Object.values(tot).flatMap(o=>Object.keys(o).filter(m=>o[m]>0)))].filter(m=>(typeof LF!=='undefined'&&LF.mes)||m<cur).sort(),ms=all.slice(-8),ult=ms[ms.length-1];if(!ult)return VX.vazio('Sem contas no período.');
  const nb=b=>{const F={BDC:'Barra do Corda'};let n=b;try{n=bnome(b)}catch(e){}return n===b&&F[b]?F[b]:n};
  const it=Object.keys(tot).map(b=>{const o=tot[b],v=ms.map(m=>o[m]||0),ant=v.slice(0,-1).filter(x=>x>0),med=ant.length?ant.reduce((a,c)=>a+c,0)/ant.length:0,u=v[v.length-1];return {b,v,u,med,dif:u-med}}).filter(o=>o.u||o.med).sort((a,b)=>b.u-a.u);
  return '<div class="vx-minis">'+it.map(o=>{const up=o.dif>0.5&&o.med>0,p=o.med?o.u/o.med-1:null,w=280,h=96,n=o.v.length,bw=(w-8)/n,mx=Math.max(...o.v,o.med)||1,yv=v=>h-16-(h-30)*v/mx;
    let g='<svg viewBox="0 0 '+w+' '+h+'" class="vx-svg">';
    o.v.forEach((x,k)=>{const last=k===n-1,y=yv(x);g+='<rect class="'+(last?(up?'vx-bad':'vx-ok'):'vx-media')+'" x="'+(4+k*bw+bw*.18)+'" y="'+y+'" width="'+(bw*.64)+'" height="'+Math.max(x?2:0,h-16-y)+'" rx="3"><title>'+VX.M3[+ms[k].slice(5)-1]+': '+VX.brl(x)+'</title></rect><text class="vx-m" x="'+(4+k*bw+bw/2)+'" y="'+(h-3)+'" font-size="9.5" text-anchor="middle">'+VX.M3[+ms[k].slice(5)-1]+'</text>'});
    if(o.med)g+='<line class="vx-sk" x1="2" x2="'+(w-2)+'" y1="'+yv(o.med)+'" y2="'+yv(o.med)+'" stroke-width="1.3" stroke-dasharray="4 3"/>';
    g+='</svg>';
    return '<div class="vx-mini vx-clk" data-vxd="b|'+o.b+'|'+VX.esc(nb(o.b))+'"><b>'+VX.esc(nb(o.b))+' <span>· '+o.b+'</span></b><div class="vx-mv"><strong>'+VX.brl(o.u)+'</strong><em class="'+(up?'up':'dn')+'">'+(p==null?'sem histórico':(up?'▲ ':'▼ ')+(p>=0?'+':'')+Math.round(p*100)+'% vs média')+'</em></div><small>'+VX.M3[+ult.slice(5)-1]+' · média '+VX.brl(o.med)+'/mês</small>'+g+'</div>'}).join('')+'</div>'};

/* Grade de 100 quadradinhos (waffle) */
VX.waffle=function(parts){const tot=parts.reduce((a,p)=>a+p.n,0);if(!tot)return VX.vazio('Sem inventário registrado.');
  let q=parts.map(p=>({...p,q:Math.floor(p.n/tot*100),r:(p.n/tot*100)%1}));let falta=100-q.reduce((a,p)=>a+p.q,0);
  q.slice().sort((a,b)=>b.r-a.r).forEach(p=>{if(falta>0&&p.n>0){p.q++;falta--}});
  const cells=[];q.forEach(p=>{for(let i=0;i<p.q;i++)cells.push(p)});
  let s='<svg class="vx-svg vx-waf" viewBox="0 0 250 250" role="img" aria-label="Grade de 100 quadrados">';
  cells.forEach((p,k)=>{const c=k%10,r=Math.floor(k/10);s+='<rect class="'+p.cls+' vx-clk"'+(p.d?' data-vxd="'+p.d+'"':'')+' x="'+(c*25+1.5)+'" y="'+(r*25+1.5)+'" width="22" height="22" rx="5"><title>'+p.nm+': '+p.n+' itens</title></rect>'});
  return s+'</svg>'};

/* Funil de etapas */
VX.funil=function(et){const mx=et[0].n||1,W=520,rh=58;let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+(et.length*rh)+'" role="img" aria-label="Funil de atendimentos">';
  et.forEach((e,i)=>{const w=Math.max(70,(W-200)*e.n/mx),x=(W-200-w)/2,y=i*rh;
    s+='<g class="vx-clk"'+(e.d?' data-vxd="'+VX.esc(e.d)+'"':'')+'><rect class="'+e.cls+'" x="'+x+'" y="'+(y+4)+'" width="'+w+'" height="'+(rh-14)+'" rx="12"/><text x="'+(x+w/2)+'" y="'+(y+rh/2+3)+'" text-anchor="middle" font-size="17" font-weight="900" class="vx-num">'+e.n+'</text>';
    s+='<text class="vx-t" x="'+(W-188)+'" y="'+(y+rh/2-2)+'" font-size="12.5" font-weight="700">'+e.nm+(e.sub?'<title>'+e.sub+'</title>':'')+'</text><text class="vx-m" x="'+(W-188)+'" y="'+(y+rh/2+14)+'" font-size="11">'+(i?VX.pc(e.n/mx)+' do total':'100%')+'</text></g>'});
  return s+'</svg>'};

/* Mapa de calor (linhas x colunas, com o número dentro) */
VX.calor=function(rl,cl,val,o){o=o||{};let mx=0;rl.forEach(r=>cl.forEach(c=>mx=Math.max(mx,val(r,c))));if(!mx)return VX.vazio('Sem dados.');
  const LB=180,cw=Math.max(44,Math.min(70,(640-LB)/cl.length)),rh=30,W=LB+cw*cl.length;
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+(rl.length*rh+24)+'" role="img" aria-label="'+VX.esc(o.aria||'Mapa de calor')+'">';
  cl.forEach((c,k)=>s+='<text class="vx-m" x="'+(LB+k*cw+cw/2)+'" y="14" font-size="11" font-weight="700" text-anchor="middle">'+VX.esc(o.cn?o.cn(c):c)+'</text>');
  rl.forEach((r,i)=>{const y=i*rh+20;s+='<text class="vx-t" x="0" y="'+(y+18)+'" font-size="11.5" font-weight="600">'+VX.esc(VX.cap(r).slice(0,24))+'</text>';
    cl.forEach((c,k)=>{const v=val(r,c),t=v/mx,lv=v?Math.min(5,Math.ceil(t*5)):0;s+='<rect class="vx-h'+lv+(o.dv&&v?' vx-clk':'')+'"'+(o.dv&&v?' data-vxd="'+VX.esc(o.dv(r,c))+'"':'')+' x="'+(LB+k*cw+2)+'" y="'+(y+2)+'" width="'+(cw-4)+'" height="'+(rh-4)+'" rx="6"><title>'+VX.esc(r)+' · '+VX.esc(o.cn?o.cn(c):c)+': '+v+'</title></rect>'+(v?'<text x="'+(LB+k*cw+cw/2)+'" y="'+(y+19)+'" font-size="11" font-weight="700" text-anchor="middle" class="'+(lv>=3?'vx-num':'vx-t')+'">'+v+'</text>':'')})});
  return s+'</svg>'};

/* Cascata (waterfall): meta - gastos = saldo */
VX.cascata=function(ini,passos,lab){const W=1100,H=300,PB=58,PT=26,n=passos.length+2,bw=Math.min(70,(W-40)/n*.62),gap=(W-40)/n;
  let acc=ini,mx=Math.max(ini,passos.reduce((a,p)=>a+p.v,0),1)*1.08;const sal=ini-passos.reduce((a,p)=>a+p.v,0);let mn=Math.min(0,sal)*1.15;
  const y=v=>PT+(H-PB-PT)*(mx-v)/(mx-mn),cx=i=>20+gap*i+gap/2;
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Cascata do orçamento">';
  s+='<line class="vx-grid" x1="10" x2="'+(W-10)+'" y1="'+y(0)+'" y2="'+y(0)+'"/>';
  const bar=(i,a,b,cls,top,nm)=>{const y1=y(Math.max(a,b)),y2=y(Math.min(a,b));s+='<rect class="'+cls+'" x="'+(cx(i)-bw/2)+'" y="'+y1+'" width="'+bw+'" height="'+Math.max(2,y2-y1)+'" rx="6"/><text class="vx-t" x="'+cx(i)+'" y="'+(y1-7)+'" font-size="11.5" font-weight="800" text-anchor="middle">'+top+'</text>';
    const pal=nm.split(' ');let l1='',l2='';for(const w of pal){if((l1+' '+w).trim().length<=13&&!l2)l1=(l1+' '+w).trim();else l2=(l2+' '+w).trim()}
    s+='<text class="vx-m" x="'+cx(i)+'" y="'+(H-PB+18)+'" font-size="10.5" text-anchor="middle">'+VX.esc(l1)+'</text>'+(l2?'<text class="vx-m" x="'+cx(i)+'" y="'+(H-PB+31)+'" font-size="10.5" text-anchor="middle">'+VX.esc(l2.slice(0,15))+'</text>':'')};
  bar(0,0,ini,'vx-mark',VX.brl(ini),lab||'Meta do mês');
  passos.forEach((p,i)=>{const a=acc,b=acc-p.v;if(p.d)s+='<g class="vx-clk" data-vxd="'+VX.esc(p.d)+'"><rect x="'+(cx(i+1)-gap/2)+'" y="'+PT+'" width="'+gap+'" height="'+(H-PT)+'" fill="transparent"/>';s+='<line class="vx-sk" stroke-dasharray="2 3" x1="'+(cx(i)+bw/2)+'" x2="'+(cx(i+1)-bw/2)+'" y1="'+y(a)+'" y2="'+y(a)+'"/>';bar(i+1,a,b,'vx-w','−'+VX.brl(p.v).replace('R$ ',''),p.nm);if(p.d)s+='</g>';acc=b});
  s+='<line class="vx-sk" stroke-dasharray="2 3" x1="'+(cx(n-2)+bw/2)+'" x2="'+(cx(n-1)-bw/2)+'" y1="'+y(acc)+'" y2="'+y(acc)+'"/>';
  bar(n-1,0,sal,sal>=0?'vx-ok':'vx-bad',VX.brl(sal),sal>=0?'Sobra':'Estouro');
  return s+'</svg>'};

/* Linha de atualização das bases */
VX.frescor=function(F){const hoje=Date.now(),pd=t=>{const m=String(t||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?Date.parse(m[3]+'-'+m[2]+'-'+m[1]+'T12:00:00'):null};
  const it=F.map(f=>({nm:f.nm,t:pd(f.dt),dt:f.dt})).filter(x=>x.t).sort((a,b)=>a.t-b.t);if(!it.length)return VX.vazio('Sem datas de atualização.');
  const W=1100,rh=34,LB=190,t0=hoje-60*864e5,X=t=>LB+(W-LB-110)*Math.max(0,(t-t0)/(hoje-t0));
  let s='<svg class="vx-svg" viewBox="0 0 '+W+' '+(it.length*rh+30)+'" role="img" aria-label="Atualização das bases">';
  s+='<rect class="vx-zok" x="'+X(hoje-7*864e5)+'" y="10" width="'+(X(hoje)-X(hoje-7*864e5))+'" height="'+(it.length*rh+4)+'"/>';
  [60,30,7,0].forEach(d=>s+='<text class="vx-m" x="'+X(hoje-d*864e5)+'" y="'+(it.length*rh+28)+'" font-size="10" text-anchor="middle">'+(d?d+' dias':'hoje')+'</text>');
  it.forEach((x,i)=>{const y=i*rh+14,d=Math.floor((hoje-x.t)/864e5),c=d<=7?'ok':d<=30?'par':'bad';
    s+='<text class="vx-t" x="0" y="'+(y+15)+'" font-size="12" font-weight="600">'+VX.esc(x.nm)+'</text><line class="vx-grid" x1="'+LB+'" x2="'+X(hoje)+'" y1="'+(y+11)+'" y2="'+(y+11)+'"/>';
    s+='<line class="vx-s'+c+'" x1="'+X(x.t)+'" x2="'+X(hoje)+'" y1="'+(y+11)+'" y2="'+(y+11)+'" stroke-width="3" stroke-dasharray="2 3"/><circle cx="'+X(x.t)+'" cy="'+(y+11)+'" r="7" class="vx-'+c+'"/>';
    s+='<text class="vx-t'+c+'" x="'+(X(hoje)+10)+'" y="'+(y+15)+'" font-size="11.5" font-weight="800">'+(d<=0?'hoje':d===1?'há 1 dia':'há '+d+' dias')+'</text>'});
  return s+'</svg>'};


/* ===== DETALHE PADRÃO: clique em qualquer indicador para ver o resumo ===== */
const DT={
  nrm:s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/\s+/g,' ').trim(),
  MF:['JANEIRO','FEVEREIRO','MARCO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'],
  DS:['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  num:v=>(+v||0).toLocaleString('pt-BR'),
  dia:v=>{if(!v)return '–';const d=typeof v==='number'?new Date((v>40000?(v-25569):v)*864e5):new Date(String(v).slice(0,10)+'T12:00:00');return isNaN(d)?'–':d.toLocaleDateString('pt-BR',{timeZone:'UTC'})},
  sum:(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0),
  grp(a,f){const m=new Map();for(const x of a){const k=f(x);if(k==null||k==='')continue;const g=m.get(k)||{k,n:0,v:0,rows:[]};g.n++;g.rows.push(x);m.set(k,g)}return [...m.values()]},
  mes(l){const t=DT.nrm(l),m=t.match(/^(JANEIRO|FEVEREIRO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO|JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\b(?:\s*[\/ ]\s*(\d{4}))?$/);
    if(!m)return null;const i=DT.MF.findIndex(x=>x.startsWith(m[1].slice(0,3)));return (m[2]||'2026')+'-'+String(i+1).padStart(2,'0')},
  MFA:['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  idx(chave,mk){DT._ix=DT._ix||{};const c=DT._ix[chave];if(c&&c.k===mk.k)return c.m;const m=new Map();mk.f(m);DT._ix[chave]={k:mk.k,m};return m},
  put(m,k,o){k=DT.nrm(k);if(k&&!m.has(k))m.set(k,o)},
  rot:(tipo,nm)=>DT.nrm(nm).startsWith(DT.nrm(tipo).replace(/S$/,''))?'<b>'+VX.esc(nm)+'</b>':VX.esc(tipo)+' <b>'+VX.esc(nm)+'</b>',
  dsem(l){const t=DT.nrm(l);const i=DT.DS.findIndex(d=>DT.nrm(d)===t||DT.nrm(d)+'-FEIRA'===t);return i<0?null:i}
};

/* ---------- desenho padrão ---------- */
DT.barras=function(it,fmt){if(!it.length)return '';const mx=Math.max(...it.map(x=>x.v))||1;
  return '<div class="dt-ev">'+it.map(x=>'<div class="dt-evc" title="'+VX.esc(x.l+': '+fmt(x.v))+'"><span class="dt-evv">'+(x.v?fmt(x.v).replace('R$ ',''):'')+'</span><i style="height:'+Math.max(x.v?4:0,Math.round(70*x.v/mx))+'px"'+(x.c?' class="'+x.c+'"':'')+'></i><b>'+x.l+'</b></div>').join('')+'</div>'};
DT.top=function(it,fmt,tot){if(!it.length)return '';const mx=it[0].v||1;tot=tot||DT.sum(it,x=>x.v)||1;
  return '<div class="dt-top">'+it.map(x=>'<div class="dt-tr"><span class="dt-tl" title="'+VX.esc(x.k)+'">'+VX.esc(x.k)+'</span><span class="dt-tb"><i style="width:'+Math.max(2,100*x.v/mx)+'%"></i></span><span class="dt-tv">'+fmt(x.v)+'<small>'+VX.pc(x.v/tot)+'</small></span></div>').join('')+'</div>'};
DT.tab=function(cab,lin){if(!lin.length)return '';return '<div class="dt-tw"><table class="dt-tab"><thead><tr>'+cab.map(c=>'<th'+(c[1]?' class="n"':'')+'>'+c[0]+'</th>').join('')+'</tr></thead><tbody>'+lin.map(l=>'<tr>'+l.map((v,i)=>'<td'+(cab[i][1]?' class="n"':'')+'>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'};
DT.abrir=function(o){let el=document.getElementById('dt');if(!el){el=document.createElement('div');el.id='dt';document.body.appendChild(el)}
  const k=(o.kpis||[]).map(x=>'<div class="dt-k'+(x[2]?' '+x[2]:'')+'"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('');
  const sec=(t,h)=>h?'<section class="dt-s"><h4>'+t+'</h4>'+h+'</section>':'';
  el.innerHTML='<div class="dt-ov" data-dtx></div><aside class="dt-p" role="dialog" aria-modal="true" aria-label="'+VX.esc(o.tit)+'"><header class="dt-hd"><div><span class="dt-tag">'+VX.esc(o.tag)+'</span><h3>'+VX.esc(o.tit)+'</h3>'+(o.sub?'<small>'+o.sub+'</small>':'')+'</div><button type="button" class="dt-x" data-dtx aria-label="Fechar">✕</button></header>'+
    '<div class="dt-c">'+(o.frase?'<p class="dt-fr">'+o.frase+'</p>':'')+(k?'<div class="dt-ks">'+k+'</div>':'')+(o.ficha?sec('Ficha',o.ficha):'')+sec(o.evT||'Evolução mês a mês',o.ev)+sec(o.topT||'Onde se concentra',o.top)+sec(o.regT||'Registros',o.reg)+'</div>'+
    '<footer class="dt-f">'+(o.ir?'<a class="btn sm" href="#'+o.ir[0]+'" data-dtx>'+o.ir[1]+' →</a>':'')+'<button type="button" class="btn primary sm" data-dtcp>Copiar resumo</button></footer></aside>';
  el.classList.add('on');document.body.classList.add('dt-aberto');
  el.querySelectorAll('[data-dtx]').forEach(b=>b.addEventListener('click',DT.fechar));
  el.querySelector('[data-dtcp]').onclick=e=>{const t=o.tit+'\n'+(o.frase||'').replace(/<[^>]+>/g,'')+'\n'+(o.kpis||[]).map(x=>'• '+x[0]+': '+String(x[1]).replace(/<[^>]+>/g,'')).join('\n');
    try{navigator.clipboard.writeText(t);e.target.textContent='Copiado ✓'}catch(_){e.target.textContent='Não foi possível copiar'}setTimeout(()=>e.target.textContent='Copiar resumo',1800)};
  setTimeout(()=>{const x=el.querySelector('.dt-x');x&&x.focus()},30)};
DT.fechar=()=>{const el=document.getElementById('dt');if(el){el.classList.remove('on')}document.body.classList.remove('dt-aberto')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')DT.fechar()});


/* Fundo animado em rede (cabeçalho e hero) */
function cgbRede(canvas,opt){opt=opt||{};const cx=canvas.getContext('2d');let W,H,P=[];const dens=opt.densidade||38,cor=opt.cor||'255,210,220';
  function tam(){const r=canvas.getBoundingClientRect(),d=devicePixelRatio||1;W=r.width;H=r.height;canvas.width=W*d;canvas.height=H*d;cx.setTransform(d,0,0,d,0,0);const n=Math.max(14,Math.round(W/dens));P=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.36,vy:(Math.random()-.5)*.24}))}
  function q(){cx.clearRect(0,0,W,H);for(const p of P){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1}
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){cx.strokeStyle='rgba('+cor+','+(.22*(1-d/130))+')';cx.lineWidth=1;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()}}
    for(const p of P){cx.fillStyle='rgba('+cor+',.7)';cx.beginPath();cx.arc(p.x,p.y,1.8,0,6.283);cx.fill()}requestAnimationFrame(q)}
  addEventListener('resize',tam);tam();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)q()}
