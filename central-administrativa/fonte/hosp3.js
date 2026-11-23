/* ===== Hospedagem em 3 pastas ===== */
const H_ORIG={};['inicio','mensal','gerencia','bases','hoteis','tipos','colab','qualidade','banco','metas'].forEach(k=>H_ORIG[k]=PG[k]);
let H_DET='hoteis',H_CTL='pend';
function hDom(id){const d=document.createElement('div');d.innerHTML=H_ORIG[id]();return d}
function hPan(d,tit){const p=[...d.querySelectorAll('.panel')].find(x=>{const h=x.querySelector('.phd h3');return h&&h.textContent.trim()===tit});return p?p.outerHTML:''}
const hFirst=(d,sel)=>{const x=d.querySelector(sel);return x?x.outerHTML:''};
const hSeg=(attr,cur,ops)=>'<div class="tiseg hseg">'+ops.map(([k,t])=>'<button type="button" '+attr+'="'+k+'" class="'+(cur===k?'on':'')+'">'+t+'</button>').join('')+'</div>';
const hSecao=(t,s)=>'<div class="hsec"><h3>'+t+'</h3>'+(s?'<small>'+s+'</small>':'')+'</div>';
function hAcuChart(){const ms=MESES_DADOS(),am=filt('mes');let r=0,mt=0;
  const it=ms.map(m=>{r+=sum(am.filter(x=>x.mes===m),x=>x.tot);const v=F.base?null:metaPer(null,[m]);mt+=v||0;return {m,r,mt:F.base?null:mt,fut:fracMes(m)<1}});
  const W=1100,H=300,pl=56,pr=10,pt=34,pb=34,iw=W-pl-pr,ih=H-pt-pb,mx=(Math.max(0,...it.map(i=>Math.max(i.r,i.mt||0)))||10)*1.12,st=niceStep(mx/4),Y=v=>pt+ih-ih*v/mx;
  const fmt=v=>Rk(v).replace('R$ ','');let g='';for(let y=0;y<=mx;y+=st)g+='<line class="cc-g" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(y)+'" y2="'+Y(y)+'"/><text class="cc-y" x="'+(pl-8)+'" y="'+(Y(y)+4)+'" text-anchor="end">'+fmt(y)+'</text>';
  const bw=iw/it.length,w=Math.min(64,bw*.62);let b='';
  it.forEach((x,i)=>{const cx=pl+bw*i+bw/2,y=Y(x.r),h=pt+ih-y,my=x.mt!=null?Y(x.mt):null;
    const tip='<b>'+mesNome(x.m)+' (acumulado)</b><br>Realizado: <b>'+R(x.r)+'</b>'+(x.mt!=null?'<br>Meta acumulada: '+R(x.mt)+'<br>Consumo: '+P(x.mt?x.r/x.mt:null)+'<br>Saldo: '+R(x.mt-x.r):'');
    const topo=Math.min(y,my??y);
    b+='<g data-tip="'+esc(tip)+'"><rect x="'+(cx-bw/2)+'" y="'+pt+'" width="'+bw+'" height="'+ih+'" fill="transparent"/>'+(h>0?'<path class="cc-bar'+(x.fut?' fut':'')+'" d="M'+(cx-w/2)+','+(pt+ih)+'V'+(y+4)+'q0,-4 4,-4h'+(w-8)+'q4,0 4,4V'+(pt+ih)+'z"/>':'')+
      (my!=null?'<line class="cc-meta" x1="'+(cx-w/2-6)+'" x2="'+(cx+w/2+6)+'" y1="'+my+'" y2="'+my+'"/><text class="hacu-m" x="'+cx+'" y="'+(my-5)+'" text-anchor="middle">'+fmt(x.mt)+'</text>':'')+
      (h>40&&(my==null||my<y-4||my>y+22)?'<text class="cc-vi'+(x.fut?' hacu-fut':'')+'" x="'+cx+'" y="'+(y+16)+'" text-anchor="middle">'+fmt(x.r)+'</text>':'<text class="cc-v" x="'+cx+'" y="'+(topo-(my!=null?18:6))+'" text-anchor="middle">'+fmt(x.r)+'</text>')+
      '<text class="cc-ax" x="'+cx+'" y="'+(H-12)+'" text-anchor="middle">'+MES3[+x.m.slice(5)-1]+'</text>'+
      (x.mt?'<text class="hacu-p '+(x.r>x.mt?'nao':'ate')+'" x="'+cx+'" y="'+(H-0)+'" text-anchor="middle">'+P(x.r/x.mt)+'</text>':'')+'</g>'});
  return '<div class="colc"><svg viewBox="0 0 '+W+' '+(H+6)+'" role="img" aria-label="Acumulado no ano">'+g+'<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+(pt+ih)+'" y2="'+(pt+ih)+'" class="cc-base" stroke-width="1.5"/>'+b+'</svg></div>'+
   '<div class="cc-leg"><span><i style="background:#711424"></i>Realizado acumulado (valor na barra)</span>'+(F.base?'':'<span><i class="m"></i>Meta acumulada (valor acima do traço)</span><span>% = quanto da meta já foi usado</span>')+'</div>'}
/* 1 · Painel geral = visão geral + evolução mensal + centros de custo */
PG.inicio=()=>{const g=hDom('gerencia'),m=hDom('mensal');
  return H_ORIG.inicio().replace('<h2>Visão geral</h2>','<h2>Painel geral</h2>')+
   hSecao('Evolução e metas','mês a mês e cada centro de custo contra a meta')+
   panel('Acumulado no ano',F.base?'realizado acumulado':'realizado acumulado × meta acumulada, com os valores de cada mês',hAcuChart())+hPan(g,'Por gerência')+
   hPan(g,'Tabela de acompanhamento')+hPan(m,'Mês a mês por base')};
/* 2 · Onde se gasta = bases e cidades + hotéis + colaboradores (+ tipos) */
PG.onde=()=>{const b=hDom('bases'),h=hDom('hoteis'),c=hDom('colab'),t=isA()?hDom('tipos'):null;
  const det={base:['Base × gerência',[hPan(b,'Base × gerência')]],cid:['Cidades',[hPan(b,'Todas as cidades')]],hoteis:['Hotéis',[hPan(h,'Ranking de hotéis'),hPan(h,'Hotéis com preço variando')]],
    colab:['Colaboradores',[hPan(c,'Todos os colaboradores'),hPan(c,'Mais de 3 refeições no mesmo dia'),hPan(c,'Permanências longas'),hPan(c,'Quem solicita')]]};
  if(t)det.tipos=['Tipo × base',[hPan(t,'Tipo × base')]];
  if(!det[H_DET])H_DET='hoteis';
  return ubar('Onde se gasta',esc(ctxTxt())+' · bases, cidades, hotéis e colaboradores','pin')+chips()+
   hFirst(b,'.ubases')+hFirst(b,'.xg2')+
   hSecao('Hotéis e colaboradores','quem mais gasta e onde dá para negociar')+hFirst(h,'.xg2')+hFirst(c,'.xg2')+
   (t?hSecao('Tipos de refeição','')+hFirst(t,'.xg2'):'')+
   hSecao('Detalhamento','escolha a tabela completa que quer ver')+hSeg('data-hdet',H_DET,Object.entries(det).map(([k,v])=>[k,v[0]]))+det[H_DET][1].join('')};
/* 3 · Pendências e dados = pendências + banco + metas */
PG.controle=()=>{const q=hDom('qualidade');
  const qps=[...q.querySelectorAll(':scope > .panel')];
  const corpo=H_CTL==='banco'?(()=>{const d=hDom('banco');return [...d.children].filter(x=>!x.classList.contains('ubar')).map(x=>x.outerHTML).join('')})():
    H_CTL==='metas'?(()=>{const d=hDom('metas');return [...d.children].filter(x=>!x.classList.contains('ubar')).map(x=>x.outerHTML).join('')})():
    (qps[qps.length-1]?qps[qps.length-1].outerHTML:'');
  return ubar('Pendências da base',esc(ctxTxt())+' · correções e lançamentos a revisar','alerta')+chips()+
   hFirst(q,'.qcards')+hPan(q,'Pendências por base')+(qps[qps.length-1]?qps[qps.length-1].outerHTML:'')+
   '<p class="tnota">Para enviar planilhas e atualizar os dados, use o grupo <a href="#dados">Banco de dados</a>, no fim do menu.</p>'};
/* páginas antigas levam para a nova pasta */
const hVai=(dest,f)=>()=>{f&&f();location.replace('#'+dest);return ''};
PG.mensal=hVai('inicio');PG.gerencia=hVai('inicio');
PG.bases=hVai('onde',()=>{H_DET='base'});PG.hoteis=hVai('onde',()=>{H_DET='hoteis'});PG.colab=hVai('onde',()=>{H_DET='colab'});PG.tipos=hVai('onde',()=>{H_DET='tipos'});
PG.qualidade=hVai('controle',()=>{H_CTL='pend'});
document.addEventListener('click',e=>{const b=e.target.closest('[data-hdet],[data-hctl]');if(!b)return;if(b.dataset.hdet)H_DET=b.dataset.hdet;else H_CTL=b.dataset.hctl;render()});
