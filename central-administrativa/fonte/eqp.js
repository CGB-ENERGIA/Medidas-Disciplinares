/* administrador de verdade (no site principal vem do login; no Artifact, quem edita) */
function caAdm(){return window.CA_ACESSO?!!window.CA_ACESSO.admin:CAN_EDIT}
/* Produtividade da equipe: o administrador e quem tem a chave "Ver Produtividade da equipe" em Usuários */
function caEqp(){const A=window.CA_ACESSO;return A?(!!A.admin||(A.area==='financeiro'&&!!A.eqp)):CAN_EDIT}
/* ===== PRODUTIVIDADE DA EQUIPE (lançamentos no Contas a Pagar) · só administrador ===== */
Object.assign(ICON,{equipe:'<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2c2.6-.3 4.6 1.3 5.3 4.3"/>'});
PAGINAS.push({id:'eqp',nm:'Produtividade da equipe',sub:'Lançamentos no Contas a Pagar',ic:'equipe',g:'Equipe'});
GRUPO_ICO['Equipe']='equipe';GRUPO_SUB['Equipe']='Lançamentos da equipe';
const EQP={d:null,ok:false,carregando:true,f:{mes:'',u:''},erro:''};
EQP.nome=u=>{const s=String(u||'').split('.');return s.map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ')};
EQP.curto=u=>{const n=EQP.nome(u).split(' ');return n[0]};
EQP.carregar=async function(){try{if(!DBX||!caEqp()){EQP.carregando=false;return}const m=(await DBX.doc('eqp/dados').get()).data();if(m&&m.j){EQP.d=JSON.parse(m.j)}}catch(e){EQP.erro=String(e.message||e)}EQP.carregando=false;EQP.ok=true;try{renderRail()}catch(e){}if(pag().id==='eqp')render()};
setTimeout(function esp(n){n=n||0;let ok=false;try{ok=!!DBX}catch(e){}if(ok){setTimeout(EQP.carregar,600);return}if(n>40){EQP.carregando=false;return}setTimeout(()=>esp(n+1),500)},400);

/* agrega o BD Contas a Pagar e Baixados (mesma regra do script do Claude) */
EQP.agregar=function(rows,EQ){const H=rows[1].map(x=>String(x||'').trim()),ix=k=>H.indexOf(k);
  const cU=ix('USUARIOCRIACAO'),cR=ix('REFERENCIA'),cY=ix('ANOMES'),cN=ix('DESC_GER_ANALI'),cO=ix('VALOR_ORIG'),cB=ix('VALOR_BX'),cD=ix('DATACRIACAO_MOV'),cV=ix('VENCIMENTO'),cX=ix('BAIXA');
  if(cU<0||cR<0||cY<0)throw new Error('Este arquivo não parece o BD Contas a Pagar e Baixados (faltam colunas USUARIOCRIACAO, REFERENCIA ou ANOMES).');
  const set=new Set(EQ),docs=new Map();
  for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;const u=String(r[cU]||'').toLowerCase().trim();if(!set.has(u)||r[cR]==null||r[cR]==='')continue;const ref=+r[cR];
    let g=docs.get(ref);if(!g){g={u,ym:String(r[cY]||''),nat:String(r[cN]||'').replace(/^[\d.]+-/,'').trim(),vo:0,bx:0,dc:'',venc:cV>=0&&r[cV]?String(r[cV]).slice(0,10):'',baixa:cX>=0&&r[cX]?1:0};docs.set(ref,g)}
    g.vo+=+r[cO]||0;g.bx+=+r[cB]||0;if(cD>=0&&r[cD]){let s=r[cD];if(s instanceof Date)s=s.toISOString();s=String(s).slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(s)&&(!g.dc||s<g.dc))g.dc=s}}
  const M={},N={},D={},R={};
  for(const [ref,g] of docs){const v=Math.round((g.vo>0?g.vo:-g.bx)*100)/100,p=g.bx!==0||!!g.baixa;
    const m=((M[g.u]=M[g.u]||{})[g.ym]=M[g.u][g.ym]||[0,0,0,0]);m[0]++;m[1]+=v;if(p){m[2]++;m[3]+=v}
    const n=((N[g.u]=N[g.u]||{})[g.nat]=N[g.u][g.nat]||[0,0]);n[0]++;n[1]+=v;
    if(g.dc&&g.dc>='2026-01-01'){(D[g.u]=D[g.u]||{})[g.dc]=(D[g.u][g.dc]||0)+1}
    (R[g.u]=R[g.u]||[]).push([ref,g.dc,g.venc,g.ym,g.nat,v,p])}
  for(const u in R)R[u]=R[u].sort((a,b)=>(b[1]||'0')<(a[1]||'0')?-1:(b[1]||'0')>(a[1]||'0')?1:(b[3]<a[3]?-1:1)).slice(0,12);
  for(const u in M)for(const k in M[u])M[u][k]=M[u][k].map(x=>Math.round(x*100)/100);
  return {at:new Date().toISOString().slice(0,10),fonte:'BD Contas a Pagar e Baixados',eq:EQ,M,N,D,R,n:docs.size}};
EQP.enviar=async function(file){try{toast('Lendo a planilha... (arquivo grande, pode levar alguns segundos)');if(typeof XLSX==='undefined'){try{await lib(XLSX_URL)}catch(e){}}if(typeof XLSX==='undefined')throw new Error('não consegui carregar o leitor de Excel; verifique a conexão');
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true});
  const d=EQP.agregar(rows,(EQP.d&&EQP.d.eq)||['silas.pereira','jhennifer.santos','antonia.reis','deyvid.henrique','hugo.vitor','heloyse.medeiros','jayna.queiroz','berenice.franca']);
  d.rows=rows;EQP.bruto=rows;delete d.rows;EQP.d=d;
  if(DBX&&caEqp()){await DBX.doc('eqp/dados').set({j:JSON.stringify(d),at:Date.now()});toast('Pronto! '+d.n.toLocaleString('pt-BR')+' documentos da equipe atualizados.')}else toast('Modo de teste: atualizado só nesta tela.');render()}
  catch(e){toast('Não foi possível ler: '+(e.message||e))}};
EQP.salvarEquipe=async function(eq){if(!EQP.d)return;EQP.d.eq=eq;if(EQP.bruto){const d=EQP.agregar(EQP.bruto,eq);EQP.d=d}
  try{if(DBX&&caEqp())await DBX.doc('eqp/dados').set({j:JSON.stringify(EQP.d),at:Date.now()})}catch(e){toast('Não foi possível salvar a equipe.')}render()};

/* números de uma pessoa no filtro atual */
EQP.soma=function(u,mes){const m=(EQP.d.M[u]||{});let r=[0,0,0,0];for(const k in m){if(mes&&k!==mes)continue;r=r.map((x,i)=>x+m[k][i])}return r};
EQP.meses=()=>{const s=new Set();Object.values(EQP.d.M).forEach(o=>Object.keys(o).forEach(k=>s.add(k)));return [...s].filter(k=>/^\d{4}-\d{2}$/.test(k)).sort()};
EQP.mesAtual=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};

PG.eqp=()=>{
  if(!caEqp())return '<div class="aj"><div class="sg-aviso">Esta área é liberada só para quem o administrador autorizar.</div></div>';
  if(EQP.carregando)return '<div class="aj"><p class="sg-vz">Carregando os dados da equipe...</p></div>';
  const up='<label class="aj-bt claro eqp-up">'+ico('db')+' Atualizar com o BD Contas a Pagar<input type="file" accept=".xlsx,.xls" data-eqpup hidden></label>';
  if(!EQP.d)return '<div class="aj"><div class="aj-hero"><div class="aj-hl"><span class="aj-tag">'+ico('equipe')+' Produtividade da equipe</span><h2>Ainda não há dados</h2><p>Envie o arquivo BD Contas a Pagar e Baixados (com a coluna DATACRIACAO_MOV) para montar os números da equipe.</p><div class="aj-hb">'+up+'</div></div></div></div>';
  const D=EQP.d,EQ=D.eq.filter(u=>D.M[u]),ms=EQP.meses(),cur=EQP.mesAtual(),mes=EQP.f.mes,MN=typeof MESES!=='undefined'?MESES:VX.M3;
  const mesNm=k=>MN[+k.slice(5)-1]+'/'+k.slice(2,4),mesC=k=>VX.M3[+k.slice(5)-1];
  const P=EQ.map(u=>{const s=EQP.soma(u,mes);return {u,docs:s[0],valor:s[1],pagos:s[2],vp:s[3]}}).sort((a,b)=>b.docs-a.docs);
  const T=P.reduce((a,p)=>[a[0]+p.docs,a[1]+p.valor,a[2]+p.pagos],[0,0,0]),ativos=P.filter(p=>p.docs>0).length||1,top=P[0];
  const passados=ms.filter(k=>k<cur),ult=passados[passados.length-1],pen=passados[passados.length-2];
  const var_=ult&&pen?(()=>{const a=EQ.reduce((s,u)=>s+((D.M[u]||{})[ult]||[0])[0],0),b=EQ.reduce((s,u)=>s+((D.M[u]||{})[pen]||[0])[0],0);return b?a/b-1:null})():null;
  let h='<div class="aj eqp">';
  h+='<div class="aj-hero"><div class="aj-hl"><span class="aj-tag">'+ico('equipe')+' Produtividade da equipe · acesso autorizado</span><h2>Lançamentos no Contas a Pagar</h2><p>Quantos documentos cada pessoa da equipe lançou, de quais tipos e quanto já foi pago. Fonte: '+VX.esc(D.fonte)+', atualizado em '+D.at.split('-').reverse().join('/')+'.</p>'+
    '<div class="aj-hb"><label class="eqp-sel"><span>Mês</span><select data-eqpmes><option value="">Ano todo</option>'+ms.map(k=>'<option value="'+k+'"'+(k===mes?' selected':'')+'>'+mesNm(k)+(k>cur?' (a vencer)':k===cur?' (em andamento)':'')+'</option>').join('')+'</select></label>'+up+'</div></div>'+
    '<div class="aj-hr"><div class="aj-hk"><b>'+T[0].toLocaleString('pt-BR')+'</b><span>documentos'+(mes?' em '+mesNm(mes):' no ano')+'</span></div><div class="aj-hk"><b>'+VX.brl(T[1])+'</b><span>valor lançado</span></div><div class="aj-hk"><b>'+Math.round(T[0]/ativos).toLocaleString('pt-BR')+'</b><span>média por pessoa</span></div></div></div>';
  h+='<div class="eqp-k">'+[['Pessoas na equipe',EQ.length,'com lançamentos no período: '+P.filter(p=>p.docs>0).length],['Quem mais lançou',top?EQP.curto(top.u):'–',top?top.docs.toLocaleString('pt-BR')+' documentos · '+VX.pc(top.docs/(T[0]||1))+' do total':''],['Já pagos',VX.pc(T[0]?T[2]/T[0]:null),T[2].toLocaleString('pt-BR')+' de '+T[0].toLocaleString('pt-BR')+' documentos'],['Último mês fechado',ult?EQ.reduce((s,u)=>s+((D.M[u]||{})[ult]||[0])[0],0).toLocaleString('pt-BR'):'–',ult?mesNm(ult)+(var_!=null?' · '+(var_>=0?'▲ +':'▼ ')+Math.round(var_*100)+'% vs '+mesC(pen):''):'']].map(k=>'<div class="eqp-kc"><span>'+k[0]+'</span><b>'+k[1]+'</b><small>'+k[2]+'</small></div>').join('')+'</div>';
  // ranking
  const mx=Math.max(...P.map(p=>p.docs),1);
  h+='<div class="vx vx2 eqp-g"><div class="vx-card"><div class="vx-h"><span class="vx-tag">Ranking</span><h3>Documentos lançados por pessoa'+(mes?' · '+mesNm(mes):'')+'</h3><small>Barra = documentos; ao lado, o valor e a participação no total. Clique numa pessoa para o resumo.</small></div><div class="eqp-rk">'+
    P.map((p,i)=>'<div class="eqp-r vx-clk" data-eqpu="'+p.u+'"><span class="eqp-pos">'+(i+1)+'</span><span class="eqp-av">'+EQP.nome(p.u).split(' ').map(x=>x[0]).join('').slice(0,2)+'</span><div class="eqp-rn"><b>'+EQP.nome(p.u)+'</b><span class="eqp-bar"><i style="width:'+Math.max(p.docs?2:0,100*p.docs/mx)+'%"></i></span></div><div class="eqp-rv"><b>'+p.docs.toLocaleString('pt-BR')+'</b><small>'+VX.brl(p.valor)+' · '+VX.pc(p.docs/(T[0]||1))+'</small></div></div>').join('')+'</div></div>';
  // heatmap pessoa x mês
  const mm=ms.filter(k=>k<=cur||mes===k);let mxc=0;EQ.forEach(u=>mm.forEach(k=>mxc=Math.max(mxc,((D.M[u]||{})[k]||[0])[0])));
  h+='<div class="vx-card"><div class="vx-h"><span class="vx-tag">Mapa de calor</span><h3>Documentos por pessoa, mês a mês</h3><small>Quanto mais escuro, mais documentos. Mês = mês de pagamento ou vencimento do documento (em média, 15 dias depois do lançamento).</small></div><div class="eqp-hm"><table><thead><tr><th></th>'+mm.map(k=>'<th'+(k===mes?' class="on"':'')+'>'+mesC(k)+(k===cur?'*':'')+'</th>').join('')+'<th>Total</th></tr></thead><tbody>'+
    EQ.map(u=>{let t=0;return '<tr><th class="vx-clk" data-eqpu="'+u+'">'+EQP.curto(u)+'</th>'+mm.map(k=>{const v=((D.M[u]||{})[k]||[0])[0];t+=v;const lv=v?Math.min(5,Math.ceil(5*v/mxc)):0;return '<td class="eqp-c'+lv+(k===cur?' cur':'')+'" title="'+EQP.nome(u)+' · '+mesNm(k)+': '+v+' documentos">'+(v||'')+'</td>'}).join('')+'<td class="eqp-t">'+t.toLocaleString('pt-BR')+'</td></tr>'}).join('')+
    '</tbody></table></div><div class="vx-leg"><span>menos</span>'+[1,2,3,4,5].map(i=>'<i class="vx-h'+i+'"></i>').join('')+'<span>mais</span><span>· * mês em andamento</span></div></div></div>';
  // mini gráficos por pessoa
  const ms2=mm.slice(-8);
  h+='<div class="vx"><div class="vx-card"><div class="vx-h"><span class="vx-tag">Um gráfico por pessoa</span><h3>Evolução de cada pessoa</h3><small>Colunas = documentos por mês; tracejado = média da pessoa nos meses fechados. A última coluna fechada fica vermelha se caiu e verde se subiu em relação à média.</small></div><div class="vx-minis">'+
    EQ.map(u=>{const v=ms2.map(k=>((D.M[u]||{})[k]||[0])[0]),fe=ms2.map((k,i)=>k<cur?i:-1).filter(i=>i>=0),li=fe[fe.length-1],ant=fe.slice(0,-1).map(i=>v[i]).filter(x=>x>0),med=ant.length?ant.reduce((a,b)=>a+b,0)/ant.length:0,u2=li!=null?v[li]:0,up=u2>=med,w=280,hh=96,n=v.length,bw=(w-8)/n,mx3=Math.max(...v,med,1),yv=x=>hh-16-(hh-30)*x/mx3;
      let g='<svg viewBox="0 0 '+w+' '+hh+'" class="vx-svg">';v.forEach((x,k)=>{const y=yv(x);g+='<rect class="'+(k===li?(up?'vx-ok':'vx-bad'):ms2[k]>=cur?'vx-fora':'vx-media')+'" x="'+(4+k*bw+bw*.18)+'" y="'+y+'" width="'+(bw*.64)+'" height="'+Math.max(x?2:0,hh-16-y)+'" rx="3"><title>'+mesNm(ms2[k])+': '+x+'</title></rect><text class="vx-m" x="'+(4+k*bw+bw/2)+'" y="'+(hh-3)+'" font-size="9.5" text-anchor="middle">'+mesC(ms2[k])+'</text>'});
      if(med)g+='<line class="vx-sk" x1="2" x2="'+(w-2)+'" y1="'+yv(med)+'" y2="'+yv(med)+'" stroke-width="1.3" stroke-dasharray="4 3"/>';g+='</svg>';
      const p=med?u2/med-1:null;return '<div class="vx-mini vx-clk" data-eqpu="'+u+'"><b>'+EQP.nome(u)+'</b><div class="vx-mv"><strong>'+u2+'</strong><em class="'+(up?'dn':'up')+'">'+(p==null?'sem histórico':p>=9?'▲ mais de 10x a média':(up?'▲ +':'▼ ')+Math.round(p*100)+'% vs média')+'</em></div><small>'+(li!=null?mesNm(ms2[li]):'')+' · média '+Math.round(med)+'/mês</small>'+g+'</div>'}).join('')+'</div></div></div>';
  // o que cada um lança
  const nt={};EQ.forEach(u=>Object.entries(D.N[u]||{}).forEach(([k,v])=>{nt[k]=(nt[k]||0)+v[0]}));const tn=Object.keys(nt).sort((a,b)=>nt[b]-nt[a]).slice(0,8);let mxn=0;EQ.forEach(u=>tn.forEach(k=>mxn=Math.max(mxn,((D.N[u]||{})[k]||[0])[0])));
  h+='<div class="vx"><div class="vx-card"><div class="vx-h"><span class="vx-tag">Especialidades</span><h3>O que cada pessoa lança (ano todo)</h3><small>As 8 naturezas com mais documentos. Mostra quem cuida de cada tipo de despesa.</small></div><div class="eqp-hm"><table><thead><tr><th></th>'+tn.map(k=>'<th class="eqp-nat" title="'+VX.esc(k)+'">'+VX.esc(VX.cap(k).slice(0,18))+'</th>').join('')+'</tr></thead><tbody>'+
    EQ.map(u=>'<tr><th class="vx-clk" data-eqpu="'+u+'">'+EQP.curto(u)+'</th>'+tn.map(k=>{const v=((D.N[u]||{})[k]||[0])[0],lv=v?Math.min(5,Math.ceil(5*v/mxn)):0;return '<td class="eqp-c'+lv+'" title="'+EQP.nome(u)+' · '+VX.esc(k)+': '+v+'">'+(v||'')+'</td>'}).join('')+'</tr>').join('')+'</tbody></table></div></div></div>';
  // por dia (docs com data de criação)
  const dias=[];for(let i=20;i>=0;i--){const x=new Date(Date.now()-i*864e5);if(x.getDay()!==0)dias.push(x.toISOString().slice(0,10))}
  const temDia=EQ.some(u=>Object.keys(D.D[u]||{}).length);
  if(temDia){let mxd=0;EQ.forEach(u=>dias.forEach(k=>mxd=Math.max(mxd,(D.D[u]||{})[k]||0)));
    h+='<div class="vx"><div class="vx-card"><div class="vx-h"><span class="vx-tag">Dia a dia</span><h3>Lançamentos por dia · últimas 3 semanas</h3><small>Conta os documentos <b>ainda em aberto</b> pela data em que foram lançados (o BD só traz a data de criação de quem ainda não foi pago).</small></div><div class="eqp-hm"><table><thead><tr><th></th>'+dias.map(k=>{const x=new Date(k+'T12:00');return '<th>'+['D','S','T','Q','Q','S','S'][x.getDay()]+'<br>'+k.slice(8)+'</th>'}).join('')+'<th>Total</th></tr></thead><tbody>'+
      EQ.map(u=>{let t=0;return '<tr><th class="vx-clk" data-eqpu="'+u+'">'+EQP.curto(u)+'</th>'+dias.map(k=>{const v=(D.D[u]||{})[k]||0;t+=v;const lv=v?Math.min(5,Math.ceil(5*v/mxd)):0;return '<td class="eqp-c'+lv+'" title="'+EQP.nome(u)+' · '+k.split('-').reverse().join('/')+': '+v+'">'+(v||'')+'</td>'}).join('')+'<td class="eqp-t">'+t+'</td></tr>'}).join('')+'</tbody></table></div></div></div>'}
  // equipe
  h+='<section class="aj-sec"><div class="aj-sh"><span class="aj-sn">'+ico('equipe')+'</span><div><h3>Quem faz parte da equipe</h3><small>use o login do sistema (ex.: nome.sobrenome). Para incluir alguém novo, envie o BD de novo depois de adicionar.</small></div></div><div class="eqp-eq">'+
    D.eq.map(u=>'<span class="eqp-ch">'+EQP.nome(u)+'<button type="button" data-eqprm="'+u+'" title="Tirar da equipe">✕</button></span>').join('')+'<form data-eqpadd class="eqp-add"><input name="u" placeholder="login, ex.: maria.silva" required><button class="btn sm" type="submit">Adicionar</button></form></div></section>';
  return h+'</div>'};

/* resumo de uma pessoa */
EQP.abrir=function(u){const D=EQP.d,ms=EQP.meses(),cur=EQP.mesAtual(),s=EQP.soma(u,EQP.f.mes),tot=D.eq.reduce((a,x)=>a+EQP.soma(x,EQP.f.mes)[0],0);
  const nat=Object.entries(D.N[u]||{}).map(([k,v])=>({k:VX.cap(k),v:v[0]})).sort((a,b)=>b.v-a.v),fe=ms.filter(k=>k<cur),vals=fe.map(k=>((D.M[u]||{})[k]||[0])[0]).filter(x=>x>0),med=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
  const melhor=fe.slice().sort((a,b)=>((D.M[u]||{})[b]||[0])[0]-((D.M[u]||{})[a]||[0])[0])[0];
  DT.abrir({tag:'Produtividade da equipe',tit:EQP.nome(u),sub:(EQP.f.mes?'Mês '+EQP.f.mes.split('-').reverse().join('/'):'Ano todo')+' · '+D.fonte,
    frase:'<b>'+EQP.nome(u)+'</b> lançou <b>'+s[0].toLocaleString('pt-BR')+'</b> documentos ('+VX.pc(s[0]/(tot||1))+' da equipe), somando <b>'+VX.brl(s[1])+'</b>. Média de <b>'+Math.round(med)+'</b> por mês'+(melhor?'; o melhor mês foi '+VX.M3[+melhor.slice(5)-1]+'/'+melhor.slice(2,4):'')+'.'+(nat[0]?' Lança principalmente <b>'+VX.esc(nat[0].k)+'</b>.':''),
    kpis:[['Documentos',s[0].toLocaleString('pt-BR')],['Valor lançado',VX.brl(s[1])],['Participação na equipe',VX.pc(s[0]/(tot||1))],['Média por mês',Math.round(med).toLocaleString('pt-BR')],['Já pagos',VX.pc(s[0]?s[2]/s[0]:null),'ok'],['Tipos de despesa',nat.length]],
    ev:DT.barras(ms.filter(k=>k<=cur).slice(-10).map(k=>({l:VX.M3[+k.slice(5)-1],v:((D.M[u]||{})[k]||[0])[0]})),v=>v.toLocaleString('pt-BR')),evT:'Documentos por mês',
    top:DT.top(nat.slice(0,6),v=>v.toLocaleString('pt-BR')),topT:'O que mais lança',
    reg:DT.tab([['Documento'],['Lançado em'],['Natureza'],['Valor',1],['Situação']],(D.R[u]||[]).slice(0,10).map(r=>[r[0],r[1]?r[1].split('-').reverse().join('/'):'–',VX.esc(VX.cap(r[4]).slice(0,30)),VX.brl(r[5]),'<span class="dt-st"><i class="'+(r[6]?'vx-ok':'vx-par')+'"></i>'+(r[6]?'Pago':'A pagar')+'</span>'])),regT:'Últimos documentos'})};

document.addEventListener('click',async e=>{const b=e.target.closest('[data-eqpu],[data-eqprm]');if(!b||!document.querySelector('.eqp'))return;
  if(b.dataset.eqpu){e.preventDefault();EQP.abrir(b.dataset.eqpu);return}
  if(b.dataset.eqprm){if(!confirm('Tirar '+EQP.nome(b.dataset.eqprm)+' da equipe?'))return;await EQP.salvarEquipe(EQP.d.eq.filter(x=>x!==b.dataset.eqprm))}});
document.addEventListener('change',e=>{const s=e.target;if(s.matches('[data-eqpmes]')){EQP.f.mes=s.value;render()}else if(s.matches('[data-eqpup]')&&s.files[0])EQP.enviar(s.files[0])});
document.addEventListener('submit',async e=>{const f=e.target;if(!f.matches('[data-eqpadd]'))return;e.preventDefault();const u=String(new FormData(f).get('u')||'').toLowerCase().trim();if(!/^[a-z0-9._-]+$/.test(u)){toast('Use o login do sistema, ex.: maria.silva');return}
  if(EQP.d.eq.includes(u))return;await EQP.salvarEquipe(EQP.d.eq.concat(u));if(!EQP.bruto)toast('Adicionado. Envie o BD de novo para calcular os números dessa pessoa.')});
