s=open('app.html',encoding='utf-8').read()
def rep(a,b,c=1):
    global s
    assert s.count(a)==c,(s.count(a),a[:100]); s=s.replace(a,b)
# icons
rep("caixa:'<path d=\"M3 7l9-4 9 4v10l-9 4-9-4z\"/><path d=\"M3 7l9 4 9-4M12 11v10\"/>'};",
    "caixa:'<path d=\"M3 7l9-4 9 4v10l-9 4-9-4z\"/><path d=\"M3 7l9 4 9-4M12 11v10\"/>',pc:'<rect x=\"3\" y=\"4\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M8 20h8M12 16v4\"/>',escudo:'<path d=\"M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z\"/><path d=\"M9 12l2 2 4-4\"/>',relogio:'<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>',olho:'<path d=\"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>'};")
# pages
rep("const GRUPO_ICO={","PAGINAS.push(\n {id:'ti-custos',nm:'Painel de custos',sub:'Gasto, meta e destino do material',ic:'moeda',g:'Setor de TI',sec:'Controle de Custos'},\n {id:'ti-fin',nm:'Painel do financeiro',sub:'Notas, parcelas e rateio',ic:'olho',g:'Setor de TI',sec:'Controle de Custos'},\n {id:'ti-notas',nm:'Notas e prestação de contas',sub:'Compras, notas e financeiro',ic:'cad',g:'Setor de TI',sec:'Controle de Custos'},\n {id:'ti-destinos',nm:'Para onde foi',sub:'',ic:'pin',g:'Setor de TI',sec:'Controle de Custos',hide:1},\n {id:'ti-aquis',nm:'Novas aquisições',sub:'Pedidos futuros e orçamento',ic:'lista',g:'Setor de TI',sec:'Controle de Custos',get hide(){return typeof tiPerfil==='function'&&tiPerfil()!=='compras'}},\n {id:'ti-precos',nm:'Preços dos produtos',sub:'',ic:'moeda',g:'Setor de TI',sec:'Controle de Custos',hide:1},\n {id:'ti-prestacao',nm:'Prestação de contas',sub:'',ic:'lista',g:'Setor de TI',sec:'Controle de Custos',hide:1},\n {id:'ti-nota',nm:'Compra',sub:'',ic:'cad',g:'Setor de TI',sec:'Controle de Custos',hide:1},\n {id:'ti-seg',nm:'Painel de segurança',sub:'Em construção',ic:'escudo',g:'Setor de TI',sec:'Controle de Segurança'});\nconst GRUPO_ICO={'Setor de TI':'pc',")
rep("GRUPO_SUB={","GRUPO_SUB={'Setor de TI':'Controle de custos e de segurança',")
rep("if(/^ind-\\d+$/.test(h))return PAGINAS.find(p=>p.id==='ficha');","if(/^ind-\\d+$/.test(h))return PAGINAS.find(p=>p.id==='ficha');if(/^ti-nota-/.test(h))return PAGINAS.find(p=>p.id==='ti-nota');")
# rail sections
rep("(g.g!=='Hospedagem / Alimentação'?g.ps.map(item).join('')","(g.g!=='Hospedagem / Alimentação'?g.ps.map(p=>(p.sec&&g.ps.find(x=>x.sec===p.sec)===p?'<div class=\"mg-sec\">'+p.sec+'</div>':'')+item(p)).join('')")
rep("const item=p=>'<a href=\"#'+p.id+'\"","const item=p=>'<a href=\"#'+p.id+'\"",1)
# render
rep("$('tituloTop').textContent=p.g==='Administrativo'?","$('tituloTop').textContent=p.g==='Setor de TI'?'Setor de TI':p.g==='Administrativo'?")
rep("$('topAte').textContent=p.g==='Administrativo'?","$('topAte').textContent=p.g==='Setor de TI'?tiD((tiNotas()[0]||{}).emissao):p.g==='Administrativo'?")
rep("ligarPortal();renderRail();","ligarPortal();ligarTI();renderRail();")
# alerts
rep("  if(p.g==='Administrativo'){","  if(p.g==='Setor de TI'){const T=tiNotas(),c=s=>T.filter(n=>n.st===s).length,gm=tiGastoMes(T),mt=tiMetaMes(),ma=tiMesAtual();\n    if(mt&&(gm[ma]||0)>mt)L.push({h:'#ti-custos',b:R((gm[ma]||0)-mt),t:'acima da meta em '+tiMesN(ma),c:'var(--nao)'});else if(!mt)L.push({h:'#ti-custos',b:'Meta mensal',t:'ainda não definida',c:'var(--par)'});\n    if(c('comigo'))L.push({h:'#ti-notas',b:N(c('comigo'))+' nota(s)',t:'com você, a entregar ao financeiro',c:'var(--par)'});if(c('aguardando'))L.push({h:'#ti-notas',b:N(c('aguardando'))+' compra(s)',t:'aguardando a nota',c:'var(--par)'});\n    const sd=T.filter(n=>n.semV>0.01).length;if(sd)L.push({h:'#ti-custos',b:N(sd)+' compra(s)',t:'com material sem destino',c:'var(--par)'});if(c('nd'))L.push({h:'#ti-notas',b:N(c('nd'))+' compras',t:'sem nº de nota e situação',c:'var(--par)'});return L}\n  if(p.g==='Administrativo'){")
# quick search
rep("    out.push({g:'Buscar em toda a base',ic:'lista',t:'\"'+q+'\" nos lançamentos de '","    tiNotas().filter(n=>(n.num+' '+n.fornN+' '+n.itens.map(i=>i.desc).join(' ')).toUpperCase().includes(Q)).slice(0,6).forEach(n=>out.push({g:'Setor de TI · Compras',ic:'pc',t:(n.num?'NF '+n.num:'Compra sem nº')+' · '+n.fornN,s:R(n.total)+' · '+tiD(n.emissao),go:()=>{location.hash='ti-nota-'+n.id}}));\n    out.push({g:'Buscar em toda a base',ic:'lista',t:'\"'+q+'\" nos lançamentos de '")
# capabilities init
rep("  claude.use('downloads').then(d=>{DL=d}).catch(()=>{});","  claude.use('downloads').then(d=>{DL=d}).catch(()=>{});claude.use('assets').then(a=>{ASSETS=a}).catch(()=>{});claude.use('sample').then(x=>{SAMPLE=x}).catch(()=>{});")
rep("  try{if(await carregarAlim())mud=true}catch(e){}","  try{if(await tiCarregar(db))mud=true}catch(e){}\n  try{if(await carregarAlim())mud=true}catch(e){}")
# module + css
JS=open('ti.js',encoding='utf-8').read()
rep("/* ===== PORTAL DE INDICADORES ===== */",JS+"\n"+open("fundo.js",encoding="utf-8").read()+"\n"+open("offline.js",encoding="utf-8").read()+"\n/* ===== PORTAL DE INDICADORES ===== */")
CSS=open('ti.css',encoding='utf-8').read()+open('padrao.css',encoding='utf-8').read()
i=s.index('</style></head>');s=s[:i]+CSS+s[i:]
# portal integration
rep("const TEMA_ICO={'Hospedagem':'cama','Alimentação':'mix','Patrimônio':'caixa','Fale Conosco':'chat'};","const TEMA_ICO={'Hospedagem':'cama','Alimentação':'mix','Patrimônio':'caixa','Fale Conosco':'chat','Setor de TI':'pc'};")
rep("const TEMAS=['Hospedagem','Alimentação','Patrimônio','Fale Conosco'];","const TEMAS=['Hospedagem','Alimentação','Patrimônio','Fale Conosco','Setor de TI'];")
rep("const k=DS.hosp.rows.length+'|'+DS.alim.rows.length+'|'+ROWS.length+'|'+CUT;","const k=DS.hosp.rows.length+'|'+DS.alim.rows.length+'|'+ROWS.length+'|'+CUT+'|'+TI_VER;")
rep("  L.forEach(i=>i.id='ind-'+i.cod.slice(4));",r"""  /* setor de TI */
  {const TN=tiNotas(),gm=tiGastoMes(TN),ms=Object.keys(gm).filter(m=>m.startsWith('2026')).sort(),mt=tiMetaMes(),ma=tiMesAtual(),lab=ms.map(m=>MES3[+m.slice(5)-1]),atu=Date.parse((TN[0]||{}).emissao||'')||null;
   const v12=mt?(gm[ma]||0)/mt:(gm[ma]||0);
   L.push({cod:'IND-12',tema:'Setor de TI',modo:'',nome:'Gasto do mês × meta de TI',obj:'Acompanhar se as compras de material de informática do mês cabem na meta mensal do Setor de TI.',
     form:'Soma das parcelas que caem no mês ÷ meta mensal de TI',und:mt?'%':'R$',pol:'Menor é melhor',meta:mt?'≤ 90% verde · 90–100% amarelo · acima de 100% vermelho':'Meta mensal ainda não definida: informe no Painel de custos do Setor de TI',mv:mt?1:null,prop:false,freq:'A cada compra',
     fonte:'Notas e compras do Setor de TI (planilha Controle de Gastos T.I.C + notas anexadas)',v:v12,fv:mt?fP:fR,st:mt?semaforoMeta(v12):'nd',serie:ms.map(m=>mt?(gm[m]||0)/mt:(gm[m]||0)),lab,fs:mt?fP:fR,
     extra:[['Gasto em '+tiMesN(ma),R(gm[ma]||0)],['Meta mensal',mt?R(mt):'não definida'],['Gasto em 2026',R(ms.reduce((s,m)=>s+(gm[m]||0),0))]],det:'ti-custos',atu});
   const cs=TN.filter(n=>n.st!=='nd'),ent=cs.filter(n=>n.st==='entregue').length,v13=cs.length?ent/cs.length:null;
   const me=[...new Set(cs.map(n=>(n.emissao||'').slice(0,7)).filter(Boolean))].sort();
   L.push({cod:'IND-13',tema:'Setor de TI',modo:'',nome:'Notas entregues ao financeiro',obj:'Garantir que as notas das compras de TI cheguem ao setor financeiro para a prestação de contas.',
     form:'Notas com situação "entregue ao financeiro" ÷ notas com situação informada',und:'%',pol:'Maior é melhor',meta:'≥ 90% verde · 70–90% amarelo · abaixo de 70% vermelho',mv:.9,prop:true,freq:'A cada compra',
     fonte:'Notas e compras do Setor de TI',v:v13,fv:fP,st:v13==null?'nd':v13>=.9?'ok':v13>=.7?'par':'nao',serie:me.map(m=>{const a=cs.filter(n=>(n.emissao||'').startsWith(m));return a.length?a.filter(n=>n.st==='entregue').length/a.length:null}),lab:me.map(m=>MES3[+m.slice(5)-1]),fs:fP,
     extra:[['Nota comigo',N(cs.filter(n=>n.st==='comigo').length)],['Aguardando nota',N(cs.filter(n=>n.st==='aguardando').length)],['Entregues',N(ent)],['Sem situação (planilha antiga)',N(TN.length-cs.length)]],det:'ti-notas',atu});
   const tot=TN.reduce((s,n)=>s+n.total,0),sem=TN.reduce((s,n)=>s+n.semV,0),v14=tot?1-sem/tot:null;
   L.push({cod:'IND-14',tema:'Setor de TI',modo:'',nome:'Material com destino definido',obj:'Saber para onde foi o material comprado (contrato, base e setor), para dividir o custo corretamente.',
     form:'Valor dos itens com destino informado ÷ valor total comprado',und:'%',pol:'Maior é melhor',meta:'≥ 95% verde · 80–95% amarelo · abaixo de 80% vermelho',mv:.95,prop:true,freq:'A cada compra',
     fonte:'Notas e compras do Setor de TI',v:v14,fv:fP,st:v14==null?'nd':v14>=.95?'ok':v14>=.8?'par':'nao',serie:ms.map(m=>{const a=TN.filter(n=>n.meses.includes(m));const t=a.reduce((s,n)=>s+n.total,0);return t?1-a.reduce((s,n)=>s+n.semV,0)/t:null}),lab,fs:fP,
     extra:[['Valor sem destino',R(sem)],['Valor total comprado',R(tot)]],det:'ti-custos',atu});
   const stL=(v,lim,maior)=>v==null?'nd':maior?(v>=lim[0]?'ok':v>=lim[1]?'par':'nao'):(v<=lim[0]?'ok':v<=lim[1]?'par':'nao');
   const fonteTI='Notas e compras do Setor de TI';
   /* IND-15 meta do próximo mês já comprometida */
   const nx=(()=>{const [y,mo]=ma.split('-').map(Number);const d=new Date(y,mo,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')})();
   const fut=TN.flatMap(n=>(n.parc||[]).filter(p=>p.mes>ma)),futT=fut.reduce((s,p)=>s+(+p.v||0),0),prox=fut.filter(p=>p.mes===nx).reduce((s,p)=>s+(+p.v||0),0);
   const v15=mt?prox/mt:null;
   L.push({cod:'IND-15',tema:'Setor de TI',modo:'',nome:'Meta do próximo mês já comprometida',obj:'Saber, antes de fazer uma compra nova, quanto da meta do próximo mês já está ocupado por parcelas de compras feitas. Evita começar o mês "estourado".',
     form:'Parcelas já lançadas para o próximo mês ÷ meta mensal de TI (R$ 8.000)',und:'%',pol:'Menor é melhor',meta:'≤ 50% verde · 50–90% amarelo · acima de 90% vermelho',mv:.5,lim:[.5,.9],prop:true,freq:'A cada compra',fonte:fonteTI,
     v:v15,fv:fP,st:mt?stL(v15,[.5,.9],false):'nd',serie:ms.map(m=>{const c=TN.filter(n=>n.emissao&&n.emissao.slice(0,7)<m).flatMap(n=>(n.parc||[]).filter(p=>p.mes===m)).reduce((s,p)=>s+(+p.v||0),0);return mt?c/mt:null}),lab,fs:fP,
     extra:[['Gasto de '+tiMesN(ma),R(gm[ma]||0)],['Já lançado para '+tiMesN(nx),R(prox)],['Todas as parcelas futuras',R(futT)],['Meta mensal',mt?R(mt):'não definida']],det:'ti-custos',atu,
     leitura:'O histórico mostra quanto de cada mês já estava comprometido por compras feitas nos meses anteriores (parceladas).'});
   /* IND-16 tempo para entregar a nota ao financeiro */
   const chegou=n=>{const h=(n.hist||[]).find(x=>x.st==='comigo');return Date.parse(h?h.em:(n.emissao||''))};
   const entregou=n=>{const h=(n.hist||[]).filter(x=>x.st==='entregue').pop();return Date.parse(h?h.em:(n.stEm||''))};
   const ents=TN.filter(n=>n.st==='entregue').map(n=>({n,d:Math.max(0,(entregou(n)-chegou(n))/864e5),m:new Date(entregou(n)).toISOString().slice(0,7)})).filter(x=>isFinite(x.d));
   const abertas=TN.filter(n=>n.st==='comigo').map(n=>({n,d:Math.max(0,(Date.now()-chegou(n))/864e5)})).filter(x=>isFinite(x.d));
   const v16=ents.length?ents.reduce((s,x)=>s+x.d,0)/ents.length:null,fD=v=>v==null?'–':nf1.format(v)+' dias';
   const m16=[...new Set(ents.map(x=>x.m))].sort(),velha=abertas.sort((a,b)=>b.d-a.d)[0];
   L.push({cod:'IND-16',tema:'Setor de TI',modo:'',nome:'Tempo para entregar a nota ao financeiro',obj:'Medir a agilidade da prestação de contas: quantos dias a nota fica com você até ser entregue ao setor financeiro.',
     form:'Média de dias entre a nota chegar até você ("Nota comigo") e ser marcada como "Entregue ao financeiro"',und:'dias',pol:'Menor é melhor',meta:'Até 5 dias verde · 5 a 10 dias amarelo · mais de 10 dias vermelho',mv:5,lim:[5,10],prop:true,freq:'A cada entrega',fonte:fonteTI+' (datas de mudança de situação)',
     v:v16,fv:fD,st:v16==null?(velha&&velha.d>5?'par':'nd'):stL(v16,[5,10],false),serie:m16.map(m=>{const a=ents.filter(x=>x.m===m);return a.reduce((s,x)=>s+x.d,0)/a.length}),lab:m16.map(m=>MES3[+m.slice(5)-1]),fs:fD,
     extra:[['Notas já entregues',N(ents.length)],['Notas com você agora',N(abertas.length)],['A mais antiga com você',velha?(velha.n.num?'NF '+velha.n.num:'compra')+' · '+fD(velha.d):'–']],det:'ti-notas',atu,
     leitura:'Começa a ser calculado quando a primeira nota for marcada como "Entregue ao financeiro". Use os botões da Prestação de contas: a central registra a data de cada mudança.'});
   /* IND-17 dependência de um fornecedor */
   const fdo=m=>{const fo=new Map();TN.forEach(n=>{const v=(n.parc||[]).filter(p=>m?p.mes===m:p.mes.startsWith('2026')).reduce((s,p)=>s+(+p.v||0),0);if(v)fo.set(n.fornN,(fo.get(n.fornN)||0)+v)});return [...fo].sort((a,b)=>b[1]-a[1])};
   const fl=fdo(),ft=fl.reduce((s,x)=>s+x[1],0),v17=ft?fl[0][1]/ft:null;
   L.push({cod:'IND-17',tema:'Setor de TI',modo:'',nome:'Dependência do maior fornecedor',obj:'Evitar concentrar as compras em um só fornecedor: muita concentração tira o poder de negociar preço e é arriscado se ele falhar na entrega.',
     form:'Gasto com o maior fornecedor ÷ gasto total do período',und:'%',pol:'Menor é melhor',meta:'≤ 50% verde · 50–70% amarelo · acima de 70% vermelho',mv:.5,lim:[.5,.7],prop:true,freq:'Mensal',fonte:fonteTI,
     v:v17,fv:fP,st:stL(v17,[.5,.7],false),serie:ms.map(m=>{const a=fdo(m),t=a.reduce((s,x)=>s+x[1],0);return t?a[0][1]/t:null}),lab,fs:fP,
     extra:[['Maior fornecedor',fl[0]?esc(fl[0][0])+' · '+Rk(fl[0][1]):'–'],['2º maior',fl[1]?esc(fl[1][0])+' · '+Rk(fl[1][1]):'–'],['Fornecedores diferentes',N(fl.length)]],det:'ti-custos',atu,
     leitura:'Cada barra mostra a fatia do maior fornecedor daquele mês.'});
   /* IND-18 produtos que ficaram mais caros */
   const pm=new Map();for(const n of TN)for(const it of n.itens){if(!it.qtd||!it.vt)continue;const k=it.desc.replace(/\s+/g,' ').trim();if(!pm.has(k))pm.set(k,[]);pm.get(k).push({vu:it.vt/it.qtd,d:n.emissao||n.meses[0]||''})}
   const caros=ate=>{let r=0,c=0;for(const a of pm.values()){const b=a.filter(x=>x.d&&(!ate||x.d.slice(0,7)<=ate)).sort((x,y)=>x.d.localeCompare(y.d));if(b.length<2)continue;r++;if(b[b.length-1].vu>Math.min(...b.map(x=>x.vu))*1.005)c++}return {r,c}};
   const c18=caros(),v18=c18.r?c18.c/c18.r:null;
   L.push({cod:'IND-18',tema:'Setor de TI',modo:'',nome:'Produtos que ficaram mais caros',obj:'Mostrar onde vale pedir cotação em outro fornecedor: produtos recorrentes cujo último preço pago está acima do menor preço já pago.',
     form:'Produtos comprados 2+ vezes com último preço acima do menor ÷ produtos comprados 2+ vezes',und:'%',pol:'Menor é melhor',meta:'≤ 20% verde · 20–40% amarelo · acima de 40% vermelho',mv:.2,lim:[.2,.4],prop:true,freq:'A cada compra',fonte:fonteTI+' (itens das compras)',
     v:v18,fv:fP,st:stL(v18,[.2,.4],false),serie:ms.map(m=>{const x=caros(m);return x.r?x.c/x.r:null}),lab,fs:fP,
     extra:[['Produtos comprados mais de uma vez',N(c18.r)],['Ficaram mais caros',N(c18.c)]],det:'ti-precos',atu,
     leitura:'Cada barra mostra a situação acumulada até aquele mês. Os nomes vêm como foram escritos em cada compra.'});
   /* IND-19 custo de TI por colaborador de cada base */
   const BC={'Bacabal':'BCB','Presidente Dutra':'PDT','Barra do Corda':'BDC','Itapecuru':'ITM','Santa Ines':'STI','Pedreiras':'PDS'};
   const DD=tiDestinos(TN).filter(x=>!x.sem&&x.base&&FC.ativos[BC[x.base]]);const pb={};DD.forEach(x=>pb[x.base]=(pb[x.base]||0)+x.v);
   const lin=Object.entries(pb).map(([b,v])=>({b,v,a:FC.ativos[BC[b]],pc:v/FC.ativos[BC[b]]})).sort((x,y)=>y.pc-x.pc);
   const ta=Object.values(FC.ativos).reduce((s,x)=>s+x,0),tv=lin.reduce((s,x)=>s+x.v,0),v19=ta?tv/ta:null;
   L.push({cod:'IND-19',tema:'Setor de TI',modo:'',nome:'Custo de TI por colaborador (2026)',obj:'Comparar as bases pelo tamanho: quanto de material de TI cada base recebeu em 2026 para cada colaborador ativo. Mostra qual base consome mais.',
     form:'Valor do material enviado para a base ÷ colaboradores ativos da base (contagem da base de colaboradores do Fale Conosco)',und:'R$',pol:'Menor é melhor',meta:'Sem meta definida: indicador de comparação entre bases',mv:null,prop:false,freq:'Mensal',fonte:fonteTI+' + nº de colaboradores ativos por base',
     v:v19,fv:fR,st:'nd',serie:ms.map(m=>{const v=DD.filter(x=>x.n.meses[0]===m).reduce((s,x)=>s+x.v,0);return ta?v/ta:null}),lab,fs:fR,
     extra:lin.map(x=>[esc(x.b),R(x.pc)+' <small>('+Rk(x.v)+' ÷ '+N(x.a)+')</small>']),det:'ti-custos',atu,
     leitura:'O valor do card é o acumulado de 2026, somando todas as bases. As barras mostram quanto foi gasto por colaborador em cada mês. Na lista ao lado, cada base com o seu custo por colaborador no ano, da mais cara para a mais barata.'});}
  L.forEach(i=>i.id='ind-'+i.cod.slice(4));""")
rep("if(i.cod==='IND-01'||i.cod==='IND-04')return semaforoMeta(v);","if(i.cod==='IND-01'||i.cod==='IND-04'||i.cod==='IND-12')return semaforoMeta(v);")
rep("const lim={['IND-07']:[.9,.8],['IND-08']:[.9,.75],['IND-10']:[.95,.85]}","const lim={['IND-07']:[.9,.8],['IND-08']:[.9,.75],['IND-10']:[.95,.85],['IND-13']:[.9,.7],['IND-14']:[.95,.8]}")
rep("({Hospedagem:'inicio','Alimentação':'inicio','Patrimônio':'pat-painel','Fale Conosco':'fc-painel'})","({Hospedagem:'inicio','Alimentação':'inicio','Patrimônio':'pat-painel','Fale Conosco':'fc-painel','Setor de TI':'ti-custos'})")
rep("' indicadores de 4 áreas","' indicadores de '+TEMAS.length+' áreas")
rep("['Fale Conosco','Fale Conosco','#fc-painel'],","['Fale Conosco','Fale Conosco','#fc-painel'],['Setor de TI','Setor de TI','#ti-custos'],")
rep("['Última atualização',i.atu?dt(Math.floor(i.atu/864e5)):MESES[PAT_ULT-1]+'/2026 (último inventário)']","['Última atualização',i.atu?dt(Math.floor(i.atu/864e5)):i.tema==='Patrimônio'?MESES[PAT_ULT-1]+'/2026 (último inventário)':'A cada nova compra']")
rep('<div class="alertas" id="alertas" aria-label="Alertas"></div>\n','')
rep("  L.forEach(i=>i.id='ind-'+i.cod.slice(4));","  {const ren={'IND-15':'IND-13','IND-16':'IND-14'};for(let k=L.length-1;k>=0;k--){const i=L[k];if(i.tema!=='Setor de TI')continue;if(!['IND-12','IND-15','IND-16'].includes(i.cod))L.splice(k,1);else if(ren[i.cod])i.cod=ren[i.cod]}}\n  L.forEach(i=>i.id='ind-'+i.cod.slice(4));")
rep(",['IND-13']:[.9,.7],['IND-14']:[.95,.8]}","}")
rep('renderAlertas();','')
rep('<nav class="tnav" id="tnav" aria-label="Seções do portal"></nav>\n','')
rep("function renderNav(p){","function renderNav(p){if(!$('tnav'))return;")
s=s.replace("function renderAlertas(){","function renderAlertas(){if(!$('alertas'))return;")
rep("function stDe(i){const v=i.v;if(v==null||i.mv==null)return 'nd';","function stDe(i){const v=i.v;if(v==null||i.mv==null)return 'nd';if(i.lim){const [a,b]=i.lim;return i.pol.startsWith('Maior')?(v>=a?'ok':v>=b?'par':'nao'):(v<=a?'ok':v<=b?'par':'nao')}")
rep("['Unidade',i.und==='%'?'Percentual (%)':'Reais (R$)']","['Unidade',i.und==='%'?'Percentual (%)':i.und==='dias'?'Dias':'Reais (R$)']")
rep("'<div class=\"panel\"><div class=\"phd\"><h3>Histórico mensal</h3><small>'","(i.leitura?'':'')+'<div class=\"panel\"><div class=\"phd\"><h3>Histórico mensal</h3><small>'")
rep("'+indChart(i)+'</div></div>'","'+indChart(i)+(i.leitura?'<p class=\"ileit\">'+i.leitura+'</p>':'')+'</div></div>'")
rep('</body></html>','<script type="text/plain" id="pdfjs-w">%%PDFJSW%%</script><script type="text/plain" id="pdfjs-m">%%PDFJSM%%</script></body></html>')
rep("try{await lib(H2C_URL);document.documentElement.removeAttribute('data-tema');document.body.classList.add('capt');const sec=$('main').firstElementChild;const cv=await html2canvas(sec,{backgroundColor:'#f4f4f4',scale:2,useCORS:true,windowWidth:Math.max(1400,innerWidth)});",
 "try{document.documentElement.removeAttribute('data-tema');document.body.classList.add('capt');const sec=$('main').firstElementChild;let cv;try{await lib(H2C_URL);cv=await html2canvas(sec,{backgroundColor:'#f4f4f4',scale:2,useCORS:true,windowWidth:Math.max(1400,innerWidth),ignoreElements:el=>el.hasAttribute&&el.hasAttribute('data-html2canvas-ignore')})}catch(x){if(!window.htmlToImage)throw x;const fx=[...sec.querySelectorAll('svg *')].map(el=>{const c=getComputedStyle(el),o=el.getAttribute('style');el.style.fill=c.fill;el.style.stroke=c.stroke;el.style.opacity=c.opacity;el.style.font=c.font;return [el,o]});try{cv=await htmlToImage.toCanvas(sec,{backgroundColor:'#f4f4f4',pixelRatio:2,skipFonts:true,cacheBust:false})}finally{fx.forEach(([el,o])=>{if(o==null)el.removeAttribute('style');else el.setAttribute('style',o)})}}")
rep('<script type="text/plain" id="pdfjs-w">','<script>%%H2I%%</script><script type="text/plain" id="pdfjs-w">')
rep("const ehPat=p.g!=='Hospedagem / Alimentação';","document.body.dataset.area=p.g;const ehPat=p.g!=='Hospedagem / Alimentação';")
open('app.html','w',encoding='utf-8').write(s);print('ok')
