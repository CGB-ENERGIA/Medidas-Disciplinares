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
  return '<div class="dt-ev">'+it.map(x=>'<div class="dt-evc" title="'+VX.esc(x.l+': '+fmt(x.v))+'"><span class="dt-evv">'+(x.v?fmt(x.v).replace('R$ ',''):'')+'</span><i style="height:'+Math.max(x.v?4:0,Math.round(96*x.v/mx))+'px"'+(x.c?' class="'+x.c+'"':'')+'></i><b>'+x.l+'</b></div>').join('')+'</div>'};
DT.top=function(it,fmt,tot){if(!it.length)return '';const mx=it[0].v||1;tot=tot||DT.sum(it,x=>x.v)||1;
  return '<div class="dt-top">'+it.map(x=>'<div class="dt-tr"><span class="dt-tl" title="'+VX.esc(x.k)+'">'+VX.esc(x.k)+'</span><span class="dt-tb"><i style="width:'+Math.max(2,100*x.v/mx)+'%"></i></span><span class="dt-tv">'+fmt(x.v)+'<small>'+VX.pc(x.v/tot)+'</small></span></div>').join('')+'</div>'};
DT.tab=function(cab,lin){if(!lin.length)return '';return '<div class="dt-tw"><table class="dt-tab"><thead><tr>'+cab.map(c=>'<th'+(c[1]?' class="n"':'')+'>'+c[0]+'</th>').join('')+'</tr></thead><tbody>'+lin.map(l=>'<tr>'+l.map((v,i)=>'<td'+(cab[i][1]?' class="n"':'')+'>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'};
DT.abrir=function(o){let el=document.getElementById('dt');if(!el){el=document.createElement('div');el.id='dt';document.body.appendChild(el)}
  const k=(o.kpis||[]).map(x=>'<div class="dt-k'+(x[2]?' '+x[2]:'')+'"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('');
  const sec=(t,h)=>h?'<section class="dt-s"><h4>'+t+'</h4>'+h+'</section>':'';
  el.innerHTML='<div class="dt-ov" data-dtx></div><aside class="dt-p" role="dialog" aria-modal="true" aria-label="'+VX.esc(o.tit)+'"><header class="dt-hd"><div><span class="dt-tag">'+VX.esc(o.tag)+'</span><h3>'+VX.esc(o.tit)+'</h3>'+(o.sub?'<small>'+o.sub+'</small>':'')+'</div><button type="button" class="dt-x" data-dtx aria-label="Fechar">✕</button></header>'+
    '<div class="dt-c">'+(o.frase?'<p class="dt-fr">'+o.frase+'</p>':'')+(k?'<div class="dt-ks" style="--dtc:'+((n=>n<=5?n:n===6?3:4)((o.kpis||[]).length))+'">'+k+'</div>':'')+(o.ficha?sec('Ficha',o.ficha):'')+sec(o.evT||'Evolução mês a mês',o.ev)+sec(o.topT||'Onde se concentra',o.top)+sec(o.regT||'Registros',o.reg)+'</div>'+
    '<footer class="dt-f">'+(o.ir?'<a class="btn sm" href="#'+o.ir[0]+'" data-dtx>'+o.ir[1]+' →</a>':'')+'<button type="button" class="btn primary sm" data-dtcp>Copiar resumo</button></footer></aside>';
  el.classList.add('on');document.body.classList.add('dt-aberto');
  el.querySelectorAll('[data-dtx]').forEach(b=>b.addEventListener('click',DT.fechar));
  el.querySelector('[data-dtcp]').onclick=e=>{const t=o.tit+'\n'+(o.frase||'').replace(/<[^>]+>/g,'')+'\n'+(o.kpis||[]).map(x=>'• '+x[0]+': '+String(x[1]).replace(/<[^>]+>/g,'')).join('\n');
    try{navigator.clipboard.writeText(t);e.target.textContent='Copiado ✓'}catch(_){e.target.textContent='Não foi possível copiar'}setTimeout(()=>e.target.textContent='Copiar resumo',1800)};
  setTimeout(()=>{const x=el.querySelector('.dt-x');x&&x.focus()},30)};
DT.fechar=()=>{const el=document.getElementById('dt');if(el){el.classList.remove('on')}document.body.classList.remove('dt-aberto')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')DT.fechar()});

/* ---------- HOSPEDAGEM / ALIMENTAÇÃO ---------- */
DT.hosp={
  base(){let a=[];try{a=filt()}catch(e){}return a.length?a:ROWS},
  achar(l,pista){const t=DT.nrm(l);if(!t)return null;const A=DT.hosp.base(),m=DT.mes(l);if(m)return {c:'mes',v:m,nm:mesNome?mesNome(m):l};
    if(pista){const x=A.find(r=>DT.nrm(r[pista])===t);if(x)return {c:pista,v:x[pista],nm:VX.cap(x[pista])}}
    for(const b of Object.keys(BASES)){if(t===b||t===DT.nrm(bnome(b)))return {c:'b',v:b,nm:bnome(b)}}
    const ix=DT.idx('hosp',{k:A.length+'|'+(A[0]&&A[0].tot)+'|'+(typeof MODO!=='undefined'?MODO:''),f:m=>{for(const c of ['area','ger','cid','est','col','mot','sol','aut','cc'])for(const x of A)DT.put(m,x[c],{c,v:x[c],nm:VX.cap(x[c])})}});
    return ix.get(t)||null},
  NM:{b:'Base',cid:'Cidade',est:'Hotel / restaurante',tipo:'Refeição',col:'Colaborador',area:'Área',ger:'Gerência',mot:'Motivo',sol:'Solicitante',aut:'Autorizador',cc:'Centro de custo',mes:'Mês',tudo:'Visão geral'},
  COMP:{b:'cid',cid:'est',est:'area',col:'est',area:'b',ger:'area',mot:'b',sol:'col',aut:'b',cc:'b',mes:'b',tudo:'b'},
  COMP_A:{b:'cid',cid:'est',est:'tipo',col:'est',area:'b',ger:'area',mot:'b',sol:'col',aut:'b',cc:'b',mes:'b',tudo:'b',tipo:'b'},
  /* o filtro da própria coisa clicada não vale (ex.: filtro em novembro e clique em "Janeiro" mostrava R$ 0) */
  baseSem(c){const K={mes:'mes',b:'base',ger:'ger',area:'area'}[c];if(!K||typeof F==='undefined'||!F[K])return DT.hosp.base();const v=F[K];F[K]='';try{return DT.hosp.base()}finally{F[K]=v}},
  abrir(q,extra){const A=DT.hosp.baseSem(q.c),S=q.c==='tudo'?A:A.filter(r=>r[q.c]===q.v),isA=typeof MODO!=='undefined'&&MODO==='alim';
    const tot=DT.sum(S,r=>r.tot),di=DT.sum(S,r=>r.dia),cols=new Set(S.map(r=>r.col)).size,med=di?tot/di:0;
    let meta=null;try{if(q.c==='area')meta=metaPer([q.v]);else if(q.c==='tudo'&&!F.base)meta=metaPer()}catch(e){}
    const ms=(typeof MESES_DADOS==='function'?MESES_DADOS():[...new Set(S.map(r=>r.mes))].sort()).filter(m=>/^\d{4}-\d{2}$/.test(m));
    const ev=DT.barras(ms.map(m=>({l:VX.M3[+m.slice(5)-1],v:DT.sum(S.filter(r=>r.mes===m),r=>r.tot)})),VX.brl);
    const cc=(isA?DT.hosp.COMP_A:DT.hosp.COMP)[q.c]||'b',gs=DT.grp(S,r=>cc==='b'?bnome(r.b):r[cc]).map(g=>({k:VX.cap(g.k),v:DT.sum(g.rows,r=>r.tot)})).sort((a,b)=>b.v-a.v);
    const top=DT.top(gs.slice(0,6),VX.brl,tot);
    const reg=DT.tab([[isA?'Data':'Entrada'],['Colaborador'],[isA?'Restaurante':'Hotel'],['Base'],['Valor',1]],S.slice().sort((a,b)=>(b.ent||0)-(a.ent||0)).slice(0,8).map(r=>[DT.dia(r.ent),VX.esc(VX.cap(r.col)),VX.esc(VX.cap(r.est)),r.b,VX.brl(r.tot)]));
    const NMq=q.c==='est'?(isA?'Restaurante':'Hotel'):DT.hosp.NM[q.c];
    const maior=gs[0];const UN=isA?'refeições':'diárias';const frase=(q.c==='tudo'?'No período filtrado':DT.rot(NMq,q.nm))+(q.c==='aut'?' autorizou <b>'+VX.brl(tot)+'</b> em '+DT.num(di)+' '+UN:q.c==='sol'?' solicitou <b>'+VX.brl(tot)+'</b> em '+DT.num(di)+' '+UN:' soma <b>'+VX.brl(tot)+'</b> em '+DT.num(di)+' '+UN)+(meta?', <b>'+VX.pc(tot/meta)+'</b> da meta até hoje':'')+'.'+(maior&&gs.length>1?(maior.v/(tot||1)>=.5?' A maior parte vem de <b>':' O maior peso é <b>')+VX.esc(maior.k)+'</b> ('+VX.pc(maior.v/(tot||1))+').':'');
    DT.abrir({tag:(isA?'Alimentação':'Hospedagem')+' · '+NMq,tit:extra&&extra.tit||q.nm,sub:S.length+' lançamentos no período filtrado',frase,
      kpis:[[q.c==='aut'?'Gasto autorizado':q.c==='sol'?'Gasto solicitado':'Gasto',VX.brl(tot)],[isA?'Refeições':'Diárias',DT.num(di)],q.c==='col'?[isA?'Restaurantes':'Hotéis',DT.num(new Set(S.map(r=>r.est)).size)]:['Colaboradores',DT.num(cols)],[isA?'Custo médio por refeição':'Custo médio por diária',VX.brl(med)]].concat(meta?[['Meta até hoje',VX.brl(meta)],['Consumo da meta',VX.pc(tot/meta),tot>meta?'bad':'ok']]:[]),
      ev,top,topT:'Onde se concentra · por '+DT.hosp.NM[cc].toLowerCase(),reg,regT:'Últimos lançamentos',ir:q.c==='tudo'?null:['onde','Ver em Onde se gasta']})}
};

/* ---------- CONTROLE DE LOCAÇÃO ---------- */
DT.loc={
  I:()=>VX.locI(),
  achar(l,p){const t=DT.nrm(l);if(!t)return null;const I=DT.loc.I();
    for(const b of [...new Set(I.map(i=>i.b))]){let nb=b;try{nb=typeof lbn==='function'?lbn(b):bnome(b)}catch(e){}if(t===b||t===DT.nrm(nb))return {c:'b',v:b,nm:nb}}
    if(p&&p!=='b'){const x=I.find(x=>DT.nrm(x[p])===t||(p==='ct'&&DT.nrm('Contrato '+x.ct)===t));if(x)return {c:p,v:x[p],nm:p==='ct'?'Contrato '+x.ct:VX.cap(x[p])}}
    const ix=DT.idx('loc',{k:I.length,f:m=>{for(const c of ['im','loc','lo','ct','end'])for(const x of I){DT.put(m,x[c],{c,v:x[c],nm:c==='ct'?'Contrato '+x[c]:VX.cap(x[c])});if(c==='ct')DT.put(m,'CONTRATO '+x.ct,{c,v:x.ct,nm:'Contrato '+x.ct})}}});
    return ix.get(t)||null},
  NM:{b:'Base',loc:'Localidade',im:'Imóvel',lo:'Locador',ct:'Contrato',end:'Endereço',id:'Imóvel',tudo:'Visão geral'},
  /* "Contrato 169/170" (filtro agrupado) */
  modo(){let p='';try{p=pag().id}catch(e){}return p==='loc-agua'?'agua':p==='loc-energia'?'ener':(typeof LTIPO!=='undefined'&&p==='locacao'&&LTIPO!=='loc'?LTIPO:'loc')},
  /* Água / Energia: os mesmos números das telas (planilha de locação = valor de cada imóvel; Contas a Pagar = pago por contrato) */
  util(q,extra,ag){const ki=ag?0:1,kt=ag?2:1,nome=ag?'Água':'Energia',st=ag?'ag':'en';
    let I=[];try{I=lFiltra(lCalc().I)}catch(e){I=DT.loc.I()}
    const ref=lMesRef(),ms=L_MESES.filter(m=>m<='2026-11'),mf=ms.filter(m=>m<=ref);
    const S=q.c==='tudo'?I:I.filter(i=>q.c==='ct'?String(i.ct)===String(q.v):String(i[q.c])===String(q.v));
    const val=(i,m)=>+((i.cons[m]||[0,0])[ki])||0,soma=m=>S.reduce((a,i)=>a+val(i,m),0);
    const ano=mf.reduce((a,m)=>a+soma(m),0),com=S.filter(i=>mf.some(m=>val(i,m)>0));
    const mCom=mf.filter(m=>soma(m)>0),ultM=mCom[mCom.length-1],ult=ultM?soma(ultM):0,media=mCom.length?ano/mCom.length:0;
    const cp=q.c==='ct'?ms.reduce((a,m)=>a+(+(((LOC.tot[q.v]||{})[m]||[0,0,0])[kt])||0),0):null;
    const pend=S.filter(i=>i.st==='ATIVO'&&['NÃO SAIU','LANÇAR'].includes((i[st]||[])[2])).length;
    const um=S.length===1?S[0]:null;
    const ev=DT.barras(ms.map(m=>({l:VX.M3[+m.slice(5)-1],v:soma(m),c:m>ref?'vx-fut':''})),VX.brl);
    const tops=com.map(i=>({k:VX.cap(i.im)+' · '+i.b,v:mf.reduce((a,m)=>a+val(i,m),0)})).sort((a,b)=>b.v-a.v);
    const reg=um?'':DT.tab([['Imóvel'],['Base'],['Último valor',1],['Situação · '+VX.M3[10].toLowerCase()]],com.slice().sort((a,b)=>mf.reduce((s,m)=>s+val(b,m),0)-mf.reduce((s,m)=>s+val(a,m),0)).slice(0,10).map(i=>{const m=mf.slice().reverse().find(m=>val(i,m)>0);return [VX.esc(VX.cap(i.im)),i.b,m?VX.brl(val(i,m))+' <small>('+VX.M3[+m.slice(5)-1].toLowerCase()+')</small>':'–',VX.esc((i[st]||[])[2]||'–')]}));
    let ficha='';if(um)ficha='<dl class="dt-dl"><dt>Imóvel</dt><dd>'+VX.esc(VX.cap(um.im))+' · '+VX.esc(VX.cap(um.loc))+' · '+um.b+'</dd><dt>Contrato</dt><dd>'+VX.esc(um.ct||'–')+(um.st!=='ATIVO'?' · distratado':'')+'</dd><dt>'+(ag?'UC água':'UC energia')+'</dt><dd>'+VX.esc((ag?um.ucag:(um.ucn||um.uca))||'–')+'</dd><dt>Titular</dt><dd>'+VX.esc(um.tit||'–')+'</dd><dt>Situação (set/out/nov)</dt><dd>'+VX.esc(((um[st]||[]).map(x=>x||'–')).join(' · '))+'</dd></dl>';
    const nm=q.c==='tudo'?'No período':DT.rot(DT.loc.NM[q.c]||'Imóvel',q.nm);
    const frase=nm+': <b>'+VX.brl(ano)+'</b> de '+nome.toLowerCase()+' nos meses fechados (planilha de locação)'+(cp!=null?'; na Contas a Pagar foram pagos <b>'+VX.brl(cp)+'</b> no ano':'')+'. '+
      (um?'':'<b>'+com.length+'</b> imóve'+(com.length===1?'l':'is')+' com conta. ')+(ultM?'Último mês com conta: '+DT.MF[+ultM.slice(5)-1].toLowerCase()+', '+VX.brl(ult)+(media&&mCom.length>1?' ('+(ult>=media?'+':'')+VX.pc(ult/media-1)+' vs a média de '+VX.brl(media)+')':'')+'.':'Nenhuma conta lançada na planilha.')+(pend?' <b class="dt-bad">'+pend+'</b> conta'+(pend>1?'s':'')+' de novembro pendente'+(pend>1?'s':'')+'.':'');
    const kpis=(cp!=null?[['Pago no ano (Contas a Pagar)',VX.brl(cp)]]:[]).concat([['No ano (planilha, meses fechados)',VX.brl(ano)],['Último mês com conta'+(ultM?' ('+VX.M3[+ultM.slice(5)-1].toLowerCase()+')':''),VX.brl(ult)],['Média por mês',VX.brl(media)]]).concat(um?[]:[['Imóveis com conta',DT.num(com.length)]]).concat([['Pendentes em nov',DT.num(pend),pend?'par':'ok']]);
    DT.abrir({tag:'Controle de Locação · '+nome+' · '+(DT.loc.NM[q.c]||'Imóvel'),tit:extra&&extra.tit||q.nm,sub:um?VX.esc(VX.cap(um.loc)+' · '+um.b):S.length+' imóve'+(S.length===1?'l':'is')+' (ativos e distratados)',frase,kpis,ficha,
      ev,evT:nome+' mês a mês (planilha de locação)',top:um?'':DT.top(tops.slice(0,6),VX.brl,ano),topT:'Onde se concentra · por imóvel',reg,regT:'Imóveis com conta (maior gasto primeiro)',ir:[ag?'loc-agua':'loc-energia','Ver '+nome]})},
  abrir(q,extra){const md=DT.loc.modo();if(md==='agua'||md==='ener')return DT.loc.util(q,extra,md==='agua');
    const I=DT.loc.I(),S=q.c==='tudo'?I:I.filter(i=>i[q.c]===q.v);const hoje=Date.now(),d=new Date();
    const M=[];for(let k=5;k>=0;k--){const x=new Date(d.getFullYear(),d.getMonth()-k,1);M.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'))}
    let ant=M[4];try{ant=lMesRef()}catch(e){}const alu=DT.sum(S,i=>i.v),v90=S.filter(i=>i.fim&&(Date.parse(i.fim)-hoje)/864e5<=90&&Date.parse(i.fim)>=hoje).length;
    const pend=S.filter(i=>/aber|parc/.test(i.sm&&i.sm[ant])).length,pagos=S.filter(i=>i.sm&&i.sm[ant]==='pago').length;
    const cons=k=>{const t={};S.forEach(i=>Object.entries(i.cons||{}).forEach(([m,v])=>{t[m]=(t[m]||0)+(+(v||[])[k]||0)}));return t};
    const en=cons(1),ag=cons(0);
    const mP=M.filter(m=>m<=ant),pagoM=m=>S.reduce((a,i)=>a+(+((i.pm||{})[m]||[0,0])[0]||0),0);
    const ev=DT.barras(mP.map(m=>({l:VX.M3[+m.slice(5)-1],v:pagoM(m)})),VX.brl);
    const um=S.length===1?S[0]:null;
    let ficha='';if(um){const dd=um.fim?Math.round((Date.parse(um.fim)-hoje)/864e5):null;
      ficha='<dl class="dt-dl"><dt>Locador</dt><dd>'+VX.esc(VX.cap(um.lo)||'–')+'</dd><dt>Endereço</dt><dd>'+VX.esc(VX.cap(um.end)||'–')+'</dd><dt>Localidade</dt><dd>'+VX.esc(VX.cap(um.loc))+' · '+um.b+'</dd><dt>Contrato</dt><dd>'+VX.esc(um.ct||'–')+' · '+DT.dia(um.ini)+' a '+DT.dia(um.fim)+(dd!=null?' <b class="'+(dd<=90?'dt-bad':'')+'">('+(dd>=0?'faltam '+dd+' dias':'vencido')+')</b>':'')+'</dd><dt>UC energia</dt><dd>'+VX.esc(um.ucn||um.uca||'–')+'</dd><dt>UC água</dt><dd>'+VX.esc(um.ucag||'–')+'</dd></dl>'+
        '<div class="dt-sm">'+M.map(m=>{const g=VX.GST[um.sm&&um.sm[m]]||VX.GST.sem;return '<span><i class="'+g[0]+'"></i>'+VX.M3[+m.slice(5)-1]+'<small>'+g[1]+'</small></span>'}).join('')+'</div>'}
    const gs=um?[]:DT.grp(S,i=>q.c==='b'?VX.cap(i.loc):(()=>{try{return bnome(i.b)}catch(e){return i.b}})()).map(g=>({k:VX.cap(g.k),v:DT.sum(g.rows,i=>i.v)})).sort((a,b)=>b.v-a.v);
    const reg=um?'':DT.tab([['Imóvel'],['Base'],['Vence em',1],['Aluguel',1],[VX.M3[+ant.slice(5)-1]]],S.slice().sort((a,b)=>(a.fim||'9')<(b.fim||'9')?-1:1).slice(0,10).map(i=>{const dd=i.fim?Math.round((Date.parse(i.fim)-hoje)/864e5):null,g=VX.GST[i.sm&&i.sm[ant]]||VX.GST.sem;return [VX.esc(VX.cap(i.im)),i.b,dd==null?'–':(dd<0?'vencido':dd+' dias'),VX.brl(i.v),'<span class="dt-st"><i class="'+g[0]+'"></i>'+g[1]+'</span>']}));
    const frase=(q.c==='tudo'?'Ao todo,':DT.rot(DT.loc.NM[q.c],q.nm)+':')+' <b>'+S.length+'</b> imóve'+(S.length===1?'l':'is')+' ativo'+(S.length===1?'':'s')+', <b>'+VX.brl(alu)+'</b> de aluguel por mês. Em '+DT.MF[+ant.slice(5)-1].toLowerCase()+': '+pagos+' pago'+(pagos===1?'':'s')+(pend?', <b class="dt-bad">'+pend+' com pendência</b>':', nenhuma pendência')+'.'+(v90?' <b>'+v90+'</b> contrato'+(v90>1?'s vencem':' vence')+' em até 90 dias.':'');
    const prev=S.filter(i=>i.sm&&i.sm[ant]&&i.sm[ant]!=='fora').reduce((a,i)=>a+(+i.v||0),0),pg=pagoM(ant);
    DT.abrir({tag:'Controle de Locação · '+(DT.loc.NM[q.c]||'Imóvel'),tit:extra&&extra.tit||q.nm,sub:um?VX.esc(VX.cap(um.loc)+' · '+um.b):S.length+' imóveis',frase,
      kpis:[['Imóveis ativos',DT.num(S.length)],['Aluguel por mês (contratos)',VX.brl(alu)],['Pago em '+VX.M3[+ant.slice(5)-1].toLowerCase(),VX.brl(pg)],['Previsto em '+VX.M3[+ant.slice(5)-1].toLowerCase(),VX.brl(prev)],['Pendências ('+VX.M3[+ant.slice(5)-1].toLowerCase()+')',DT.num(pend),pend?'bad':'ok'],['Vencem em 90 dias',DT.num(v90),v90?'bad':'']],
      ficha,ev,evT:'Aluguel pago mês a mês (Contas a Pagar)',top:um?'':DT.top(gs.slice(0,6),VX.brl,alu),topT:'Aluguel por '+(q.c==='b'?'localidade':'base'),reg,regT:'Imóveis (vencimento mais próximo primeiro)',ir:['loc-busca','Consultar imóvel']})}
};

/* ---------- PATRIMÔNIO ---------- */
DT.pat={
  achar(l,pista){const t=DT.nrm(l);if(!t)return null;
    if(pista==='obs'){const t2=t.replace(/…$/,'');const x=pInv(true).find(r=>r.obs&&DT.nrm(r.obs).startsWith(t2));if(x)return {c:'obs',v:String(x.obs).toUpperCase(),nm:'“'+String(x.obs).toUpperCase().slice(0,60)+'”'}}
    if(pista){const inv0=pInv(true),x=PAT.cad.concat(inv0).find(r=>DT.nrm(r[pista])===t);if(x)return {c:pista,v:x[pista],nm:pista==='pl'?'Plaqueta '+x.pl:VX.cap(x[pista])}}
    const m=DT.mes(l);if(m)return {c:'m',v:+m.slice(5),nm:DT.MFA[+m.slice(5)-1]};
    const inv=pInv(true);for(const b of [...new Set(inv.map(x=>x.b))]){let nb=b;try{nb=pbn(b)}catch(e){}if(t===b||t===DT.nrm(nb))return {c:'b',v:b,nm:nb}}
    const ix=DT.idx('pat',{k:inv.length+'|'+PAT.cad.length,f:m=>{for(const c of ['pl','gr','loc','nm','ds'])for(const x of PAT.cad.concat(inv))DT.put(m,x[c],{c,v:x[c],nm:c==='pl'?'Plaqueta '+x.pl:VX.cap(x[c])})}});
    if(ix.get(t))return ix.get(t);
    for(const [k,n] of Object.entries(STN))if(DT.nrm(n)===t)return {c:'st',v:k,nm:n};
    return null},
  NM:{b:'Base',gr:'Grupo de bem',loc:'Local',nm:'Responsável',ds:'Bem',pl:'Bem',m:'Mês',st:'Situação',obs:'Observação',tudo:'Visão geral'},
  abrir(q,extra){const inv=pInv(true),cad=PAT.cad;const fx=x=>q.c==='tudo'||(q.c==='m'?true:q.c==='st'?true:q.c==='obs'?String(x.obs||'').toUpperCase()===q.v:x[q.c]===q.v);
    const C=cad.filter(fx),I=q.c==='m'?inv.filter(x=>x.m===q.v):inv.filter(fx),at=[...atual(I).values()].filter(x=>q.c!=='st'||x.st===q.v),c=contSt(at);
    const ms=[...new Set(inv.map(x=>x.m))].sort((a,b)=>a-b);
    const ev=DT.barras(ms.map(m=>{const cc=contSt(inv.filter(x=>x.m===m&&(q.c==='m'||q.c==='st'?true:fx(x))));return {l:VX.M3[m-1],v:cc.pc==null?0:cc.pc}}),v=>VX.pc(v));
    const cc=q.c==='b'?'gr':'b',gs=DT.grp(at.filter(x=>x.st==='NC'||x.st==='NE'),x=>cc==='b'?(()=>{try{return pbn(x.b)}catch(e){return x.b}})():x.gr).map(g=>({k:VX.cap(g.k),v:g.n})).sort((a,b)=>b.v-a.v);
    const prob=at.filter(x=>x.st==='NC'||x.st==='NE').sort((a,b)=>b.m-a.m);
    const reg=DT.tab([['Plaqueta'],['Bem'],['Local'],['Situação']],prob.slice(0,10).map(x=>[VX.esc(x.pl),VX.esc(VX.cap(x.ds).slice(0,34)),VX.esc(VX.cap(x.loc).slice(0,28)),'<span class="dt-st"><i class="'+(x.st==='NE'?'vx-bad':'vx-par')+'"></i>'+STN[x.st]+'</span>']));
    const oNC=I.filter(x=>x.st==='NC').length,oNE=I.filter(x=>x.st==='NE').length;
    const plC=new Set(C.map(x=>x.pl)),fora=q.c==='m'||q.c==='st'||q.c==='tudo'?0:at.filter(x=>!plC.has(x.pl)).length;
    const frase=(q.c==='tudo'?'No inventário,':DT.rot(DT.pat.NM[q.c],q.nm)+':')+' <b>'+DT.num(at.length)+'</b> '+(at.length===1?'bem conferido':'bens conferidos')+(q.c==='m'?' no mês':'')+', <b>'+VX.pc(c.pc)+'</b> em conformidade'+(q.c==='m'?'':' (situação no último inventário de cada bem)')+'. '+(c.NC+c.NE?'<b class="dt-bad">'+DT.num(c.NC+c.NE)+'</b> com problema hoje ('+DT.num(c.NC)+' não conformes, '+DT.num(c.NE)+' não encontrados).':'Nenhum bem com problema.')+
      (q.c!=='m'&&(oNC+oNE)>(c.NC+c.NE)?' Somando todos os meses, foram <b>'+DT.num(oNC+oNE)+'</b> ocorrências ('+DT.num(oNC)+' não conformes, '+DT.num(oNE)+' não encontrados), porque o mesmo bem aparece em vários inventários.':'')+
      (fora?' <b>'+DT.num(fora)+'</b> dos bens conferidos não estão no cadastro desta '+DT.pat.NM[q.c].toLowerCase()+'.':'');
    let ficha='';if(q.c==='pl'){const b=cad.find(x=>x.pl===q.v)||I[0]||{},h=inv.filter(x=>x.pl===q.v).sort((a,b)=>a.m-b.m);
      ficha='<dl class="dt-dl"><dt>Bem</dt><dd>'+VX.esc(VX.cap(b.ds))+'</dd><dt>Grupo</dt><dd>'+VX.esc(VX.cap(b.gr))+'</dd><dt>Local</dt><dd>'+VX.esc(VX.cap(b.loc))+'</dd><dt>Responsável</dt><dd>'+VX.esc(VX.cap(b.nm)||'–')+'</dd></dl>'+(h.length?'<div class="dt-sm">'+h.slice(-6).map(x=>'<span><i class="'+({C:'vx-ok',NC:'vx-par',NE:'vx-bad'}[x.st]||'vx-sem')+'"></i>'+VX.M3[x.m-1]+'<small>'+STN[x.st]+'</small></span>').join('')+'</div>':'')}
    if(q.c==='pl'){const u=at[0];DT.abrir({ficha,tag:'Patrimônio · Bem',tit:q.nm,sub:'Histórico do bem nos inventários',frase:u?'Último inventário ('+DT.MFA[u.m-1]+'): <b'+(u.st==='C'?'':' class="dt-bad"')+'>'+STN[u.st]+'</b>.'+(u.obs?' Observação: '+VX.esc(u.obs):''):'Bem ainda não conferido em nenhum inventário.',ir:['pat-bens','Ver bens']});return}
    DT.abrir({ficha,tag:'Patrimônio · '+DT.pat.NM[q.c],tit:extra&&extra.tit||q.nm,sub:q.c==='m'?'Inventário do mês':'Último registro de cada bem',frase,
      kpis:(q.c==='obs'?[]:[['Bens no cadastro',DT.num(q.c==='m'||q.c==='st'?cad.length:C.length)]]).concat([[q.c==='m'?'Conferidos no mês':'Bens conferidos',DT.num(at.length)],['Em conformidade',VX.pc(c.pc),c.pc!=null&&c.pc<.85?'bad':'ok'],['Não conformes',DT.num(c.NC),c.NC?'par':''],['Não encontrados',DT.num(c.NE),c.NE?'bad':''],['Sem status',DT.num(c.SS)]]),
      ev,evT:'Conformidade mês a mês',top:DT.top(gs.slice(0,6),v=>DT.num(v)),topT:'Onde estão os problemas · por '+(cc==='b'?'base':'grupo'),reg,regT:'Bens com problema',ir:['pat-bens','Ver bens']})}
};

/* ---------- FALE CONOSCO ---------- */
DT.fc={
  base(){try{return fcRows()}catch(e){return FC.at}},
  achar(l,pista){const t=DT.nrm(l);if(!t)return null;const A=FC.at,m=DT.mes(l);if(m)return {c:'mes',v:m,nm:l};
    if(pista){const x=A.find(r=>DT.nrm(r[pista])===t);if(x)return {c:pista,v:x[pista],nm:VX.cap(x[pista])}}
    const w=DT.dsem(l);if(w!=null)return {c:'dow',v:w,nm:DT.DS[w]};
    for(const b of [...new Set(A.map(x=>x.b))]){let nb=b;try{nb=fcb(b)}catch(e){}if(t===b||t===DT.nrm(nb))return {c:'b',v:b,nm:nb}}
    const ix=DT.idx('fc',{k:A.length,f:m=>{for(const c of ['as','co','ar','fn','sup','st','nm'])for(const x of A)DT.put(m,x[c],{c,v:x[c],nm:VX.cap(x[c])})}});
    return ix.get(t)||null},
  NM:{b:'Base',nm:'Colaborador',as:'Assunto',co:'Coordenador',ar:'Área',fn:'Função',sup:'Supervisor',st:'Situação',mes:'Mês',dow:'Dia da semana',tudo:'Visão geral'},
  abrir(q,extra){const A=q.c==='mes'?FC.at:DT.fc.base(),ok=x=>q.c==='tudo'||(q.c==='mes'?ymd(x.d)===q.v:q.c==='dow'?new Date(x.d*864e5).getUTCDay()===q.v:x[q.c]===q.v),S=A.filter(ok).filter(x=>!q.as||x.as===q.as).filter(x=>!q.mes2||ymd(x.d)===q.mes2);
    const res=S.filter(x=>x.st==='RESOLVIDO').length,and=S.filter(x=>x.st==='ANDAMENTO').length,col=new Set(S.map(x=>x.mat||x.nm)).size,vol=DT.grp(S,x=>x.mat||x.nm).filter(g=>g.n>=2).length;
    const ms=[...new Set(FC.at.map(x=>ymd(x.d)))].sort();
    const ev=DT.barras(ms.map(m=>({l:VX.M3[+m.slice(5)-1],v:S.filter(x=>ymd(x.d)===m).length})),v=>DT.num(v));
    const cc=q.c==='as'?'b':'as',gs=DT.grp(S,x=>cc==='b'?(()=>{try{return fcb(x.b)}catch(e){return x.b}})():x.as).map(g=>({k:VX.cap(g.k),v:g.n})).sort((a,b)=>b.v-a.v);
    const reg=DT.tab([['Data'],['Assunto'],['Base'],['Situação']],S.slice().sort((a,b)=>b.d-a.d).slice(0,10).map(x=>[DT.dia(new Date(x.d*864e5).toISOString()),VX.esc(VX.cap(x.as)),x.b,'<span class="dt-st"><i class="'+(x.st==='RESOLVIDO'?'vx-ok':x.st==='ANDAMENTO'?'vx-par':'vx-bad')+'"></i>'+VX.cap(x.st)+'</span>']));
    const frase=(q.c==='tudo'?'No período,':DT.rot(DT.fc.NM[q.c],q.nm)+(q.as?' · '+VX.esc(VX.cap(q.as)):'')+':')+' <b>'+DT.num(S.length)+'</b> '+(S.length===1?'atendimento':'atendimentos')+(q.c==='nm'?'':' de '+DT.num(col)+' '+(col===1?'colaborador':'colaboradores'))+'; <b>'+VX.pc(S.length?res/S.length:null)+'</b> '+(S.length===1?'resolvido':'resolvidos')+'.'+(vol&&q.c!=='nm'?' <b>'+vol+'</b> '+(vol===1?'colaborador voltou':'colaboradores voltaram')+' mais de uma vez.':'')+(gs[0]?' Mais comum: <b>'+VX.esc(gs[0].k)+'</b>.':'');
    DT.abrir({tag:'Fale Conosco · '+DT.fc.NM[q.c],tit:extra&&extra.tit||q.nm,sub:'Atendimentos registrados',frase,
      kpis:[['Atendimentos',DT.num(S.length)],['Resolvidos',DT.num(res),'ok'],['Em andamento',DT.num(and),and?'par':''],['Taxa de resolução',VX.pc(S.length?res/S.length:null)],].concat(q.c==='nm'?[['Assuntos diferentes',DT.num(new Set(S.map(x=>x.as)).size)]]:[['Colaboradores',DT.num(col)],['Voltaram 2+ vezes',DT.num(vol),vol?'par':'']]),
      ev,evT:'Atendimentos por mês',top:DT.top(gs.slice(0,6),v=>DT.num(v)),topT:'Onde se concentra · por '+(cc==='b'?'base':'assunto'),reg,regT:'Últimos atendimentos',ir:['fc-lista','Ver lista de atendimentos']})}
};

/* ---------- SETOR DE TI ---------- */
DT.ti={
  L(){try{return tiFiltra(tiNotas())}catch(e){return []}},
  achar(l){const t=DT.nrm(l).replace(/^CONTRATOS? /,'');if(!t)return null;const L=DT.ti.L();
    const d=L.flatMap(n=>n.itens.flatMap(i=>i.dest||[]));
    for(const c of ['base','setor','ct']){const r=d.find(x=>DT.nrm(x[c])===t);if(r)return {c,v:r[c],nm:c==='ct'?'Contrato '+r[c]:VX.cap(r[c])}}
    for(const c of ['fornN','ger']){const r=L.find(x=>DT.nrm(x[c])===t);if(r)return {c,v:r[c],nm:VX.cap(r[c])}}
    if(t==='SEM SETOR')return {c:'setor',v:'',nm:'Sem setor'};
    const g=(TI_CFG.grupos||[]).find(g=>DT.nrm(g.nome)===DT.nrm(l));if(g)return {c:'grp',v:g.cts,nm:g.nome};
    return null},
  NM:{base:'Base',setor:'Setor',ct:'Contrato',fornN:'Fornecedor',ger:'Gerencial',grp:'Contratos',tudo:'Visão geral'},
  abrir(q,extra){const L=DT.ti.L(),por=[];let tot=0;
    for(const n of L){let v=0,itens=[];if(q.c==='tudo'||q.c==='fornN'||q.c==='ger'){if(q.c==='tudo'||n[q.c]===q.v){v=+n.total||0;itens=n.itens.map(i=>({d:i.desc,v:+i.vt||0}))}}
      else for(const i of n.itens){const vu=i.qtd?i.vt/i.qtd:0;for(const x of (i.dest||[])){const hit=q.c==='grp'?q.v.includes(x.ct):String(x[q.c]||'')===String(q.v);if(hit){v+=vu*(+x.q||0);itens.push({d:i.desc,v:vu*(+x.q||0)})}}}
      if(v>0.009){por.push({n,v,itens});tot+=v}}
    const ms={};por.forEach(p=>{const m=(p.n.emissao||'').slice(0,7);if(m)ms[m]=(ms[m]||0)+p.v});const mk=Object.keys(ms).sort().slice(-10);
    const ev=DT.barras(mk.map(m=>({l:VX.M3[+m.slice(5)-1],v:ms[m]})),VX.brl);
    const it={};por.forEach(p=>p.itens.forEach(i=>{const k=VX.cap(i.d).slice(0,40);it[k]=(it[k]||0)+i.v}));const gs=Object.entries(it).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
    const forn=new Set(por.map(p=>p.n.fornN)).size;
    const reg=DT.tab([['Emissão'],['Fornecedor'],['Nota'],['Valor',1]],por.slice().sort((a,b)=>(b.n.emissao||'')<(a.n.emissao||'')?-1:1).slice(0,10).map(p=>[DT.dia(p.n.emissao),VX.esc(VX.cap(p.n.fornN)),VX.esc(p.n.num||p.n.id),VX.brl(p.v)]));
    let meta=null;if(q.c==='grp'){const g=(TI_CFG.grupos||[]).find(g=>g.cts===q.v);meta=g&&g.meta}else if(q.c==='tudo'){try{meta=tiMetaMes()}catch(e){}}
    const frase=(q.c==='tudo'?'No período filtrado,':DT.rot(DT.ti.NM[q.c],q.nm)+':')+' <b>'+VX.brl(tot)+'</b> em '+por.length+' compra'+(por.length===1?'':'s')+(q.c==='fornN'?'':' de '+forn+' fornecedor'+(forn===1?'':'es'))+'.'+(gs[0]?' Maior item: <b>'+VX.esc(gs[0].k)+'</b> ('+VX.brl(gs[0].v)+').':'');
    DT.abrir({tag:'Setor de TI · '+DT.ti.NM[q.c],tit:extra&&extra.tit||q.nm,sub:'Compras registradas',frase,
      kpis:[['Gasto',VX.brl(tot)],['Compras',DT.num(por.length)],q.c==='fornN'?['Notas',DT.num(new Set(por.map(p=>p.n.num||p.n.id)).size)]:['Fornecedores',DT.num(forn)],['Ticket médio',VX.brl(por.length?tot/por.length:0)]].concat(meta?[['Meta mensal',VX.brl(meta)]]:[]),
      ev,evT:'Gasto por mês de emissão',top:DT.top(gs.slice(0,6),VX.brl,tot),topT:'Itens que mais pesaram',reg,regT:'Compras',ir:['ti-notas','Ver notas e prestação de contas']})}
};

/* ---------- quem atende cada página ---------- */
DT.dom=()=>{const p=typeof pag==='function'?pag():{};const g=p.g||'';
  if(/Hospedagem/.test(g))return 'hosp';if(/Locação/.test(g))return 'loc';if(/Patrimônio/.test(g))return 'pat';if(/Fale/.test(g))return 'fc';if(/Setor de TI/.test(g))return 'ti';return null};
DT.SEM=['lancar','loc-cad','fc-novo','ti-aquis','ti-nota','ti-seg','dados','entrada','catalogo','ficha','portal','controle'];
DT.ALVO='.mb-r,.tirank-r,.bk,.msr,.timb,tbody tr,div.icard,.vgg-card,[data-vxd]';
/* De que campo é o nome clicado? O título do quadro ("Quem autoriza", "Quem solicita"...) ou o cabeçalho da coluna decide.
   Sem isso, um nome que é ao mesmo tempo colaborador e autorizador abria sempre como colaborador. */
DT.PISTA={
  hosp:[[/autoriz/,'aut'],[/solicit/,'sol'],[/motivo/,'mot'],[/hot|restaurante|estabelec|onde (se )?(hosped|come)/,'est'],[/cidade/,'cid'],[/ger[êe]ncia/,'ger'],[/centro de custo|[áa]rea/,'area'],[/colaborador|quem mais|pessoa/,'col']],
  fc:[[/coordenador/,'co'],[/supervisor/,'sup'],[/assunto/,'as'],[/fun[çc][ãa]o/,'fn'],[/[áa]rea/,'ar'],[/colaborador/,'nm']],
  pat:[[/observa/,'obs'],[/placa|plaqueta/,'pl'],[/respons|colaborador/,'nm'],[/grupo|categoria/,'gr'],[/^local|local$/,'loc']],
  loc:[[/locador/,'lo'],[/endere/,'end'],[/localidade|cidade/,'loc'],[/im[óo]vel/,'im'],[/contrato/,'ct']]
};
DT.pista=(dom,txt)=>{const t=String(txt||'').toLowerCase();for(const [re,c] of (DT.PISTA[dom]||[]))if(re.test(t))return c;return null};
DT.pistas=(el,dom)=>{const out=[];
  if(el.matches('tr')){const tb=el.closest('table'),hs=tb?[...tb.querySelectorAll('thead th')].map(h=>h.innerText||''):[];return [...el.cells].slice(0,6).map((c,i)=>DT.pista(dom,hs[i]))}
  const p=el.closest('.panel,.vgp,section');const h=p&&p.querySelector('.phd h3,h3,h2');const c=DT.pista(dom,h&&h.innerText);return [c,c,c]};
DT.textos=el=>{const t=(el.innerText||'').split('\n').map(s=>s.trim()).filter(Boolean);if(el.matches('tr'))return [...el.cells].slice(0,6).map(c=>(c.innerText||'').split('\n')[0].trim()).filter(Boolean);return t.slice(0,3)};
DT.clique=function(e){const pid=typeof pag==='function'?pag().id:'';if(DT.SEM.includes(pid))return;const dom=DT.dom();if(!dom)return;
  if(e.target.closest('button,a[href],input,select,textarea,label,summary,[data-tie],[data-fce],[data-fcedita],[data-hle],[data-lce],[data-tid],[data-tii],[data-tiver],[data-lsel]'))return;
  const el=e.target.closest(DT.ALVO);if(!el||!el.closest('#main'))return;const R=DT[dom];
  if(el.matches('[data-vxd]')){const [c,v,nm,as,m2]=el.getAttribute('data-vxd').split('|');e.preventDefault();
    if(c==='tudo'){R.abrir({c:'tudo',v:null,nm:nm},{tit:nm});return}const val=c==='m'||c==='dow'?+v:c==='grp'?(TI_CFG.grupos||[]).find(g=>g.nome===v).cts:v;R.abrir({c,v:val,nm:nm||v,as:as||'',mes2:m2||''});return}
  if(el.matches('div.icard,.vgg-card')){const t=DT.textos(el);e.preventDefault();R.abrir({c:'tudo',v:null,nm:VX.cap(t[0]||'Resumo')},{tit:VX.cap(t[0]||'Resumo')});return}
  /* linha de um imóvel específico (tem o id): abre aquele imóvel, não o primeiro com o mesmo nome */
  if(dom==='ti'){const a=el.querySelector('a[href^="#ti-nota-"]');if(a){e.preventDefault();location.hash=a.getAttribute('href').slice(1);return}}
  if(dom==='loc'){const li=el.querySelector('[data-lid]');if(li){const im=DT.loc.I().find(i=>i.id===li.dataset.lid);if(im){e.preventDefault();R.abrir({c:'id',v:im.id,nm:VX.cap(im.im)+(im.loc?' · '+VX.cap(im.loc):'')});return}}}
  if(dom==='loc'){const sl=el.querySelector('[data-lsel]');if(sl){const im=DT.loc.I().find(i=>i.id===sl.dataset.lsel);e.preventDefault();if(im)R.abrir({c:'id',v:im.id,nm:VX.cap(im.im)+(im.loc?' · '+VX.cap(im.loc):'')});else if(typeof toast==='function')toast('Contrato distratado: use Consultar imóvel para ver o histórico.');return}}
  const ps=DT.pistas(el,dom);const ts=DT.textos(el);const ord=[...ts.keys()].sort((a,b)=>(ps[b]?1:0)-(ps[a]?1:0));
  for(const i of ord){const q=R.achar(ts[i],ps[i]);if(q){e.preventDefault();R.abrir(q);return}}};
document.addEventListener('click',DT.clique,true);
function dtMarca(){try{const pid=typeof pag==='function'?pag().id:'';const dom=DT.dom();document.body.classList.toggle('dt-pode',!!dom&&!DT.SEM.includes(pid));
  if(!dom||DT.SEM.includes(pid))return;const R=DT[dom];document.querySelectorAll('#main '+DT.ALVO.split(',').join(',#main ')).forEach(el=>{if(el.closest('.vx')&&!el.matches('[data-vxd]'))return;const ok=el.matches('[data-vxd],div.icard,.vgg-card')||DT.textos(el).some(l=>R.achar(l));el.classList.toggle('dt-ok',ok);if(ok&&!el.title)el.title='Clique para ver o resumo'})}catch(e){}}
{const _r=render;render=function(){const x=_r.apply(this,arguments);dtMarca();return x}}
