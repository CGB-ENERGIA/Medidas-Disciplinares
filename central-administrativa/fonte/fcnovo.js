/* ===== Fale Conosco: registro de atendimentos no próprio sistema ===== */
let FC_ED=null,FC_INI=false;
const fcPode=()=>!!(DBX&&CAN_EDIT);
function fcIni(){if(FC_INI)return;FC_INI=true;FC.at.forEach((x,i)=>{if(!x.id)x.id='S'+i})}
function fcRecalc(){FC_ULT=Math.max(...FC.at.map(x=>x.d||0))}
function fcAplica(o){fcIni();const i=FC.at.findIndex(x=>x.id===o.id);if(o.del){if(i>=0)FC.at.splice(i,1)}else if(i>=0)FC.at[i]=o;else FC.at.push(o);fcRecalc()}
async function fcCarregar(db){let m=false;try{const s=await db.collection('fc_at').get();const docs=s.docs||s;(docs||[]).forEach(d=>{const v=d.data?d.data():d;if(v&&v.j){fcAplica(JSON.parse(v.j));m=true}})}catch(e){}return m}
async function fcGrava(o){fcAplica(o);if(fcPode()){try{await DBX.doc('fc_at/'+o.id).set({j:JSON.stringify(o),em:new Date().toISOString()});return 'ok'}catch(x){toast('Não foi possível salvar para todos ('+(x.message||x.code)+').');return 'erro'}}return 'teste'}
const fcUniq=k=>[...new Set(FC.at.map(x=>x[k]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const fcHoje=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5);
const fcDia=d=>{const x=new Date(d*864e5);return x.toISOString().slice(0,10)};
/* Cadastro de colaboradores ATIVOS (vem de /api/fc-colaboradores, só depois do login): o campo de nome do "Registrar atendimento" sugere todo mundo do cadastro e preenche chapa, base, função e equipe */
let FC_COL=null,FC_COL_P=null,FC_AUTO={};
const fcNz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function fcColCarregar(){if(FC_COL_P)return FC_COL_P;
  FC_COL_P=fetch('/api/fc-colaboradores',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(j=>{
    FC_COL=((j&&j.colaboradores)||[]).map(x=>({ch:String(x.chapa||''),nm:String(x.nome||'').toUpperCase().replace(/\s+/g,' ').trim(),fn:String(x.funcao||'').toUpperCase(),b:x.base||'',ar:x.setor||'',sup:String(x.supervisor||'').toUpperCase(),co:String(x.coordenador||'').toUpperCase()})).filter(x=>x.nm);
    const dl=document.getElementById('fcdl-nm');if(dl)dl.innerHTML=fcNomesHtml()}).catch(()=>{FC_COL=null;FC_COL_P=null});
  return FC_COL_P}
function fcNomesHtml(){const op=(v,l)=>'<option value="'+esc(v)+'"'+(l?' label="'+esc(l)+'"':'')+'>';
  if(FC_COL&&FC_COL.length){const n={};FC_COL.forEach(x=>{const k=fcNz(x.nm);n[k]=(n[k]||0)+1});
    return FC_COL.map(x=>op(n[fcNz(x.nm)]>1?x.nm+' — '+x.ch:x.nm,[x.ch,x.fn,x.b?fcb(x.b):''].filter(Boolean).join(' · '))).join('')}
  return fcUniq('nm').map(x=>op(x)).join('')}
function fcColAcha(t){if(!FC_COL||!FC_COL.length)return null;const m=/^(.*?)\s+—\s+(\S+)$/.exec(String(t||'').trim());
  if(m){const h=FC_COL.find(x=>x.ch===m[2]&&fcNz(x.nm)===fcNz(m[1]));if(h)return h}
  const k=fcNz(t),l=FC_COL.filter(x=>fcNz(x.nm)===k);return l.length===1?l[0]:null}
function fcColPreenche(el){const h=fcColAcha(el.value);
  if(!h){if(FC_AUTO.id===FC_ED.id)Object.keys(FC_AUTO).forEach(f=>{if(f!=='id'&&FC_ED[f]===FC_AUTO[f]){FC_ED[f]='';const c=document.querySelector('[data-fce="'+f+'"]');if(c)c.value='';delete FC_AUTO[f]}});return false}
  if(el.value!==h.nm)el.value=h.nm;FC_ED.nm=h.nm;if(FC_AUTO.id!==FC_ED.id)FC_AUTO={id:FC_ED.id};
  const sc=document.querySelector('[data-fce="co"]'),kc=fcNz(h.co);
  const lc=sc&&kc?[...sc.options].map(o=>o.value).filter(v=>v&&(fcNz(v)===kc||fcNz(v).startsWith(kc+' '))):[];
  const ar=h.ar?(fcUniq('ar').find(a=>fcNz(a)===fcNz(h.ar))||''):'';
  const v={mat:h.ch,b:h.b,fn:h.fn,ar:ar,co:lc.length===1?lc[0]:'',sup:h.sup};
  Object.keys(v).forEach(f=>{if(!v[f])return;if(FC_ED[f]&&FC_ED[f]!==FC_AUTO[f])return;FC_ED[f]=v[f];FC_AUTO[f]=v[f];const c=document.querySelector('[data-fce="'+f+'"]');if(c)c.value=v[f]});
  toast('Dados do colaborador preenchidos pelo cadastro (chapa '+h.ch+').');return true}
PG['fc-novo']=()=>{fcIni();fcColCarregar();const e=FC_ED||(FC_ED={novo:1,id:'A'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),d:fcHoje(),st:'RESOLVIDO'});
  const op=(arr,v,ph,lab)=>'<option value="">'+ph+'</option>'+arr.map(x=>'<option value="'+esc(x)+'"'+(x===v?' selected':'')+'>'+esc(lab?lab(x):x)+'</option>').join('');
  const inp=(k,lab,t,ph,ex)=>'<label'+(ex&&ex.cls?' class="'+ex.cls+'"':'')+'><small>'+lab+'</small><input type="'+(t||'text')+'" data-fce="'+k+'" value="'+esc(k==='d'?fcDia(e.d||fcHoje()):(e[k]||''))+'" placeholder="'+(ph||'')+'"'+(ex&&ex.list?' list="'+ex.list+'"':'')+'></label>';
  const sel=(k,lab,html)=>'<label><small>'+lab+'</small><select data-fce="'+k+'">'+html+'</select></label>';
  const txt=(k,lab,ph)=>'<label class="aqw3"><small>'+lab+'</small><textarea data-fce="'+k+'" rows="3" placeholder="'+ph+'">'+esc(e[k]||'')+'</textarea></label>';
  const bases=Object.keys(FCB),cos=[...new Set(Object.keys(FC.ativosCoord||{}).concat(fcUniq('co')))].sort();
  const dl=(id,arr)=>'<datalist id="'+id+'">'+arr.map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist>';
  const recentes=FC.at.slice().sort((a,b)=>(b.d||0)-(a.d||0)).slice(0,8);
  return fcUbar(e.novo?'Registrar atendimento':'Editar atendimento',e.novo?'O que você salvar aqui entra na hora no painel, na lista e nos indicadores':'Altere o que precisar e salve','chat')+
   (fcPode()?'':'<div class="note">Modo de teste: você pode preencher e ver o atendimento nos painéis, mas ele só fica salvo para todos quando quem pode editar o site registra pelo Claude.</div>')+
   '<div class="panel aqform"><div class="phd"><h3>1. Colaborador</h3><small>comece pelo nome e escolha na lista: o resto se preenche sozinho</small></div><div class="aqgrid">'+
    inp('nm','Nome do colaborador *','text','Digite o nome',{list:'fcdl-nm',cls:'aqw2'})+inp('mat','Matrícula (chapa)','text','opcional')+
    sel('b','Base',op(bases,e.b,'Escolha',fcb))+inp('fn','Função','text','ex.: Eletricista',{list:'fcdl-fn'})+inp('ar','Área','text','ex.: STC, ADM, GERE',{list:'fcdl-ar'})+
    sel('co','Coordenador',op(cos,e.co,'Escolha'))+inp('sup','Supervisor','text','opcional',{list:'fcdl-sup'})+'</div></div>'+
   '<div class="panel aqform"><div class="phd"><h3>2. Atendimento</h3><small>o que a pessoa pediu e como foi tratado</small></div><div class="aqgrid">'+
    inp('d','Data','date')+inp('as','Assunto *','text','Escolha ou digite um novo',{list:'fcdl-as'})+
    sel('st','Situação',[['RESOLVIDO','Resolvido'],['ANDAMENTO','Em andamento'],['VERIFICAR','Verificar']].map(([v,t])=>'<option value="'+v+'"'+(e.st===v?' selected':'')+'>'+t+'</option>').join(''))+
    txt('q','Pergunta / solicitação *','O que o colaborador pediu')+txt('res','Tratativa / resolução','O que foi feito e a resposta dada')+'</div>'+
    '<div class="aqbar">'+(!e.novo&&fcPode()?'<button type="button" class="btn" data-fcexclui>Excluir</button>':'')+'<span class="aqtot"></span><button type="button" class="btn" data-fccancela>Cancelar</button><button type="button" class="btn primary" data-fcsalva>'+(e.novo?'Registrar atendimento':'Salvar alterações')+'</button></div></div>'+
   '<datalist id="fcdl-nm">'+fcNomesHtml()+'</datalist>'+dl('fcdl-fn',fcUniq('fn'))+dl('fcdl-ar',fcUniq('ar'))+dl('fcdl-sup',fcUniq('sup'))+dl('fcdl-as',fcUniq('as'))+
   panel('Últimos registros','os 8 mais recentes',tabela([{h:'Data',f:r=>dt(r.d)},{h:'Colaborador',f:r=>'<b>'+esc(r.nm)+'</b><br><span class="sml">'+fcb(r.b)+'</span>'},{h:'Assunto',f:r=>'<span class="tagi">'+esc(r.as)+'</span>'},{h:'Situação',f:r=>fcSt(r.st)},{h:'',f:r=>'<button type="button" class="fced" data-fcedita="'+r.id+'" title="Editar atendimento" aria-label="Editar atendimento"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg></button>'}],recentes,{}))};
document.addEventListener('input',ev=>{const el=ev.target;if(!el.dataset||el.dataset.fce==null||!FC_ED)return;const k=el.dataset.fce;let v=el.value;
  if(k==='d'){const t=Date.parse(v);FC_ED.d=isNaN(t)?FC_ED.d:Math.floor(t/864e5);return}
  FC_ED[k]=(k==='nm'||k==='as')?v.toUpperCase():v;
  if(k==='nm'){if(fcColPreenche(el))return;const ult=FC.at.filter(x=>x.nm===FC_ED.nm).sort((a,b)=>(b.d||0)-(a.d||0))[0];if(ult){['mat','b','fn','ar','co','sup'].forEach(f=>{if(!FC_ED[f]&&ult[f]){FC_ED[f]=ult[f];const c=document.querySelector('[data-fce="'+f+'"]');if(c)c.value=ult[f]}});toast('Dados do colaborador preenchidos pelo último atendimento.')}}});
document.addEventListener('change',ev=>{const el=ev.target;if(el.dataset&&el.dataset.fce!=null&&FC_ED&&el.tagName==='SELECT')FC_ED[el.dataset.fce]=el.value});
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-fcsalva],[data-fccancela],[data-fcedita],[data-fcnovo],[data-fcexclui]');if(!b)return;
  if(b.hasAttribute('data-fcnovo')){FC_ED=null;if(location.hash==='#fc-novo')render();else location.hash='fc-novo';return}
  if(b.dataset.fcedita){fcIni();const r=FC.at.find(x=>x.id===b.dataset.fcedita);if(!r)return;FC_ED=Object.assign({},r);if(location.hash==='#fc-novo')render();else location.hash='fc-novo';scrollTo({top:0});return}
  if(b.hasAttribute('data-fccancela')){FC_ED=null;location.hash='fc-lista';return}
  if(b.hasAttribute('data-fcexclui')){if(!confirm('Excluir este atendimento?'))return;await fcGrava({id:FC_ED.id,del:true});FC_ED=null;toast('Atendimento excluído.');location.hash='fc-lista';return}
  const e=FC_ED;if(!e)return;const falta=[['nm','o nome do colaborador'],['as','o assunto'],['q','a pergunta']].find(([k])=>!(e[k]||'').trim());
  if(falta){toast('Preencha '+falta[1]+'.');const c=document.querySelector('[data-fce="'+falta[0]+'"]');c&&c.focus();return}
  const o=Object.assign({},e);delete o.novo;o.em=new Date().toISOString();if(!o.d)o.d=fcHoje();
  const r=await fcGrava(o);FC_ED=null;toast(r==='ok'?'Atendimento registrado. Já aparece no painel.':r==='teste'?'Atendimento registrado nesta tela (modo de teste: não fica salvo).':'Ficou só nesta tela.');location.hash='fc-lista'});
/* botão "Novo atendimento" e coluna Editar nas telas do Fale Conosco */
{const _r=render;render=function(){const r=_r.apply(this,arguments);try{const h=(location.hash||'').slice(1);
  if(h==='fc-painel'||h==='fc-lista'){const m=$('main'),u=m&&m.querySelector('.ubar');if(u&&!u.querySelector('[data-fcnovo]')){let rr=u.querySelector(':scope > .ubar-r');if(!rr){rr=document.createElement('div');rr.className='ubar-r';u.appendChild(rr)}const bt=document.createElement('button');bt.type='button';bt.className='btn primary fcnbtn';bt.setAttribute('data-fcnovo','');bt.textContent='+ Novo atendimento';rr.insertBefore(bt,rr.firstChild)}}
  if(h==='fc-painel'&&!document.querySelector('#main .fcstp')){const a=fcRows('st'),tot=a.length||1,ST=[['RESOLVIDO','Resolvido','ate','✓'],['ANDAMENTO','Em andamento','par','…'],['VERIFICAR','Verificar','ver','?']];
    const pend=a.filter(x=>x.st!=='RESOLVIDO').sort((p,q)=>(q.d||0)-(p.d||0));
    const box=document.createElement('div');box.className='panel fcstp';
    box.innerHTML='<div class="phd"><h3>Situação dos atendimentos</h3><small>clique para filtrar</small></div><div class="fcst">'+ST.map(([k,t,c,ic])=>{const n=a.filter(x=>x.st===k).length;return '<button type="button" class="fcst-c '+c+(FF.st===k?' on':'')+'" data-fcst="'+k+'"><i>'+ic+'</i><span>'+t+'</span><b>'+N(n)+'</b><small>'+Math.round(100*n/tot)+'% dos atendimentos</small><em><u style="width:'+(100*n/tot)+'%"></u></em></button>'}).join('')+'</div>'+
      (pend.length?'<div class="fcpend"><p>Para acompanhar ('+pend.length+')</p>'+pend.slice(0,6).map(x=>'<div><span>'+fcSt(x.st)+'</span><b>'+esc(x.nm)+'</b><small>'+esc(x.as)+' · '+dt(x.d)+'</small><button type="button" class="fced" data-fcedita="'+x.id+'" title="Editar atendimento" aria-label="Editar atendimento"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg></button></div>').join('')+'</div>':'<p class="fcpend-ok">Nenhum atendimento em andamento ou para verificar.</p>');
    const ref=document.querySelector('#main .k6')||document.querySelector('#main .icard')&&document.querySelector('#main .icard').parentElement;if(ref)ref.after(box)}
  if(h==='fc-painel'){const pb=[...document.querySelectorAll('#main .panel')].find(p=>(p.querySelector('h3')||{}).textContent==='Por base');
    if(pb&&!pb.parentElement.classList.contains('xcol')){const a=fcRows(),dn=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],c=[0,0,0,0,0,0,0];a.forEach(x=>{if(x.d!=null)c[new Date(x.d*864e5).getUTCDay()]++});
      const ord=[1,2,3,4,5,6,0].filter(i=>c[i]||(i>0&&i<6)),mx=Math.max(1,...c),tot=a.length||1,pico=ord.reduce((p,i)=>c[i]>c[p]?i:p,ord[0]);
      const html='<div class="phd"><h3>Dia da semana</h3><small>quando os colaboradores mais procuram o canal</small></div><div class="tirank">'+ord.map(i=>'<div class="tirank-r"><span>'+dn[i]+'</span><i><em style="width:'+(100*c[i]/mx)+'%"></em></i><b>'+N(c[i])+'</b><small>'+Math.round(100*c[i]/tot)+'%</small></div>').join('')+'</div><p class="tnota">'+(c[pico]?'Pico na <b>'+dn[pico].toLowerCase()+'</b>: bom dia para reforçar o atendimento.':'')+'</p>';
      const col=document.createElement('div');col.className='xcol';pb.replaceWith(col);col.appendChild(pb);const np=document.createElement('div');np.className='panel';np.innerHTML=html;col.appendChild(np);
      const pc=[...document.querySelectorAll('#main .panel')].find(p=>(p.querySelector('h3')||{}).textContent==='Por coordenador'),pf=[...document.querySelectorAll('#main .panel')].find(p=>(p.querySelector('h3')||{}).textContent==='Funções que mais procuram');
      if(pc&&pf){const c2=document.createElement('div');c2.className='xcol';pc.replaceWith(c2);c2.appendChild(pc);c2.appendChild(pf)}try{gfEquilibra()}catch(e){}}}
  if(h==='fc-lista'){const t=[...document.querySelectorAll('#main .panel')].find(p=>(p.querySelector('h3')||{}).textContent==='Lista de atendimentos');const tb=t&&t.querySelector('table');if(tb&&!tb.dataset.fced){tb.dataset.fced=1;const L=fcRows().filter(x=>!FF.q.trim()||(x.nm+' '+x.q+' '+x.res+' '+x.as+' '+x.fn).toUpperCase().includes(FF.q.trim().toUpperCase())).sort((p,q)=>(q.d||0)-(p.d||0));
    const th=document.createElement('th');tb.querySelector('thead tr').appendChild(th);[...tb.querySelectorAll('tbody tr')].forEach((tr,i)=>{const td=document.createElement('td');const x=L[i];if(x)td.className='fced-td';td.innerHTML='<button type="button" class="fced" data-fcedita="'+x.id+'" title="Editar atendimento" aria-label="Editar atendimento"><svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg></button>';tr.appendChild(td)})}}
 }catch(e){console.error(e)}return r}}

document.addEventListener('click',e=>{const b=e.target.closest('[data-fcst]');if(!b)return;FF.st=FF.st===b.dataset.fcst?'':b.dataset.fcst;render()});
