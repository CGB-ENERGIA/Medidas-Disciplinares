/* ===== SUGESTÕES E DÚVIDAS: caixa de mensagens para o administrador ===== */
const SUG={uid:null,user:null,meus:[],todos:null,faq:[],pronto:false,adm:false,tipo:'Dúvida',f:{st:'',tp:''},edit:null,ultEnvio:null};
SUG.TIPOS=[['Dúvida','ajuda','Não entendi algo ou não sei como fazer'],['Sugestão de melhoria','ideia','Uma ideia para deixar o sistema melhor'],['Problema ou erro','alerta','Algo não funciona ou o número está errado'],['Elogio','alvo','Algo que ficou bom e ajudou']];
SUG.ST={nova:['Nova','sg-nova'],analise:['Em análise','sg-anl'],respondida:['Respondida','sg-rsp'],feita:['Implementada','sg-feita'],recusada:['Não será feita','sg-rec']};
SUG.AREAS=['Geral','Hospedagem / Alimentação','Controle de Locação','Patrimônio','Fale Conosco','Setor de TI','Banco de dados','Como usar'];
SUG.esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
SUG.quando=t=>{if(!t)return '';const d=new Date(t);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
SUG.ref=()=>'S-'+Date.now().toString(36).toUpperCase().slice(-6);
SUG.areaAtual=()=>{try{const g=pag().g;return SUG.AREAS.includes(g)?g:(g==='Ajuda'?'Como usar':'Geral')}catch(e){return 'Geral'}};
SUG.telaAtual=()=>{try{const p=pag();return p.nm}catch(e){return ''}};

/* carregar do banco */
SUG.carregar=async function(){if(!DBX)return;try{
  const u=await claude.use('user').catch(()=>null);SUG.user=u;if(u&&u.id)SUG.uid=await u.id();SUG.adm=caAdm();try{SUG.pode=u&&u.can?await u.can('data.write'):null}catch(e){SUG.pode=null}
  try{const s=await DBX.collection('faq').get();const d=s.docs||s;SUG.faq=(d||[]).map(x=>({id:x.id,...(x.data?x.data():x)})).filter(f=>f&&f.q).sort((a,b)=>(b.em||0)-(a.em||0))}catch(e){}
  if(SUG.uid){try{const m=(await DBX.doc('sug/'+SUG.uid).get()).data();SUG.meus=(m&&m.itens)||[]}catch(e){}}
  if(SUG.adm){try{const s=await DBX.collection('sug').get();const d=s.docs||s;SUG.todos=(d||[]).map(x=>({uid:x.id,...(x.data?x.data():x)}))}catch(e){SUG.todos=null}}
  SUG.pronto=true;sugBadge();const id=pag().id;if(id==='sugestoes'||id==='ajuda')render();
}catch(e){console.warn('sug',e)}};
setTimeout(function esperar(n){n=n||0;let ok=false;try{ok=!!DBX}catch(e){}if(ok)return SUG.carregar();if(n>40){SUG.pronto=true;return}setTimeout(()=>esperar(n+1),500)},300);
SUG.novas=()=>SUG.adm&&SUG.todos?SUG.todos.reduce((a,d)=>a+(d.itens||[]).filter(i=>i.st==='nova').length,0):0;
function sugBadge(){try{renderRail()}catch(e){}}

/* enviar */
SUG.enviar=async function(o){const it={id:SUG.ref(),tipo:o.tipo,area:o.area,tela:o.tela||'',tit:o.tit.slice(0,140),txt:o.txt.slice(0,3000),em:Date.now(),st:'nova',resp:'',respEm:0};
  if((()=>{try{return !DBX}catch(e){return true}})()||!SUG.uid){SUG.meus.unshift({...it,teste:true});return {ok:true,teste:true,id:it.id}}
  try{const ref=DBX.doc('sug/'+SUG.uid);let atual=[];try{const m=(await ref.get()).data();atual=(m&&m.itens)||[]}catch(e){}
    atual.unshift(it);await ref.set({itens:atual,at:Date.now()});SUG.meus=atual;
    if(SUG.adm&&SUG.todos){const d=SUG.todos.find(x=>x.uid===SUG.uid);if(d)d.itens=atual;else SUG.todos.push({uid:SUG.uid,itens:atual})}
    sugBadge();return {ok:true,id:it.id}}
  catch(e){const m=String(e.message||e.code||'');return {ok:false,erro:/perm|denied|forbid|refus|not allowed|level/i.test(m)?'seu acesso ao site é só de leitura. Peça ao administrador o acesso de Contribuidor.':(m||'não foi possível enviar')}}};

/* administrador: salvar mudança num item de outra pessoa */
SUG.salvarAdm=async function(uid,id,mud){const d=SUG.todos.find(x=>x.uid===uid);if(!d)return false;const i=(d.itens||[]).findIndex(x=>x.id===id);if(i<0)return false;
  const itens=d.itens.slice();itens[i]={...itens[i],...mud};
  try{const ref=DBX.doc('sug/'+uid);let atual=itens;try{const m=(await ref.get()).data();if(m&&m.itens){atual=m.itens.slice();const j=atual.findIndex(x=>x.id===id);if(j>=0)atual[j]={...atual[j],...mud}}}catch(e){}
    await ref.set({itens:atual,at:Date.now()});d.itens=atual;if(uid===SUG.uid)SUG.meus=atual;return true}catch(e){toast('Não foi possível salvar: '+(e.message||e.code||''));return false}};
SUG.excluirAdm=async function(uid,id){const d=SUG.todos.find(x=>x.uid===uid);if(!d)return;const itens=(d.itens||[]).filter(x=>x.id!==id);
  try{await DBX.doc('sug/'+uid).set({itens,at:Date.now()});d.itens=itens;if(uid===SUG.uid)SUG.meus=itens}catch(e){toast('Não foi possível excluir.')}};
SUG.publicar=async function(it,on){try{if(on){await DBX.doc('faq/'+it.id).set({q:it.tit,a:it.resp,area:it.area,em:Date.now()});SUG.faq.unshift({id:it.id,q:it.tit,a:it.resp,area:it.area})}
  else{await DBX.doc('faq/'+it.id).delete();SUG.faq=SUG.faq.filter(f=>f.id!==it.id)}return true}catch(e){toast('Não foi possível publicar.');return false}};

/* desenho */
SUG.chip=st=>{const s=SUG.ST[st]||SUG.ST.nova;return '<span class="sg-st '+s[1]+'">'+s[0]+'</span>'};
SUG.form=function(mini){const tp=SUG.TIPOS.map(t=>'<button type="button" class="sg-tp'+(SUG.tipo===t[0]?' on':'')+'" data-sgtp="'+t[0]+'">'+ico(t[1])+'<b>'+t[0]+'</b>'+(mini?'':'<small>'+t[2]+'</small>')+'</button>').join('');
  return '<form class="sg-form" data-sgform="'+(mini?'mini':'pag')+'"><div class="sg-tps">'+tp+'</div>'+
    '<div class="sg-g2"><label><small>Área</small><select name="area">'+SUG.AREAS.filter(x=>{let A=null;try{A=AREA}catch(e){}return !A||x==='Geral'||x==='Como usar'||A.gs.includes(x)}).map(a=>'<option'+(a===SUG.areaAtual()?' selected':'')+'>'+a+'</option>').join('')+'</select></label><label><small>Tela (opcional)</small><input name="tela" value="'+SUG.esc(SUG.telaAtual())+'" maxlength="80"></label></div>'+
    '<label><small>Assunto</small><input name="tit" required maxlength="140" placeholder="Resuma em uma frase"></label>'+
    '<label><small>Descreva</small><textarea name="txt" required rows="'+(mini?4:5)+'" maxlength="3000" placeholder="O que aconteceu, o que você esperava ou qual é a sua ideia. Não coloque CPF, senhas ou dados pessoais."></textarea></label>'+
    '<div class="sg-fb"><small>Sua mensagem vai só para o administrador. Você acompanha a resposta em <b>Minhas mensagens</b>.</small><button type="submit" class="btn primary">'+ico('seta')+' Enviar</button></div></form>'};
SUG.item=function(it,adm,uid,nome){const tp=SUG.TIPOS.find(t=>t[0]===it.tipo)||SUG.TIPOS[0];
  let h='<article class="sg-it'+(it.st==='nova'&&adm?' novo':'')+'"><div class="sg-ih"><span class="sg-ic">'+ico(tp[1])+'</span><div class="sg-im"><b>'+SUG.esc(it.tit)+'</b><small>'+SUG.esc(it.tipo)+' · '+SUG.esc(it.area)+(it.tela?' · '+SUG.esc(it.tela):'')+' · '+SUG.quando(it.em)+' · <span class="sg-ref">'+SUG.esc(it.id)+'</span>'+(adm?' · <span class="sg-who" data-sguid="'+SUG.esc(uid)+'">'+SUG.esc(nome||'Usuário')+'</span>':'')+(it.teste?' · <i>modo de teste, não enviado</i>':'')+'</small></div>'+SUG.chip(it.st)+'</div>'+
    '<p class="sg-tx">'+SUG.esc(it.txt).replace(/\n/g,'<br>')+'</p>';
  if(adm){const k=uid+'|'+it.id,ab=SUG.edit===k;
    h+='<div class="sg-adm">'+(it.resp&&!ab?'<div class="sg-resp"><b>Sua resposta</b> · '+SUG.quando(it.respEm)+'<p>'+SUG.esc(it.resp).replace(/\n/g,'<br>')+'</p></div>':'')+
      (ab?'<form class="sg-af" data-sgaf="'+SUG.esc(k)+'"><label><small>Situação</small><select name="st">'+Object.entries(SUG.ST).map(([v,s])=>'<option value="'+v+'"'+(it.st===v?' selected':'')+'>'+s[0]+'</option>').join('')+'</select></label><label><small>Resposta para quem enviou</small><textarea name="resp" rows="4" maxlength="3000">'+SUG.esc(it.resp)+'</textarea></label><label class="sg-chk"><input type="checkbox" name="faq"'+(SUG.faq.some(f=>f.id===it.id)?' checked':'')+'> Publicar em Dúvidas frequentes (todos veem a pergunta e a resposta, sem o nome)</label><div class="sg-ab"><button type="button" class="btn sm" data-sgcanc>Cancelar</button><button type="submit" class="btn primary sm">Salvar</button></div></form>'
        :'<div class="sg-ab"><button type="button" class="btn sm" data-sgdel="'+SUG.esc(k)+'">Excluir</button><button type="button" class="btn sm" data-sgst="'+SUG.esc(k)+'|analise">Marcar em análise</button><button type="button" class="btn primary sm" data-sged="'+SUG.esc(k)+'">'+(it.resp?'Editar resposta':'Responder')+'</button></div>')+'</div>'}
  else if(it.resp)h+='<div class="sg-resp"><b>Resposta do administrador</b> · '+SUG.quando(it.respEm)+'<p>'+SUG.esc(it.resp).replace(/\n/g,'<br>')+'</p></div>';
  else h+='<div class="sg-esp">Aguardando resposta do administrador.</div>';
  return h+'</article>'};

PG.sugestoes=()=>{const adm=SUG.adm&&SUG.todos;
  let h='<div class="aj sg"><div class="aj-hero"><div class="aj-hl"><span class="aj-tag">'+ico('ideia')+' Sugestões e dúvidas</span><h2>Fale com o administrador</h2><p>Mande sua dúvida, uma ideia de melhoria ou um problema que encontrou. Cada mensagem recebe um número, e você acompanha a situação e a resposta aqui.</p>'+
    '<div class="aj-hb"><a class="aj-bt" href="#ajuda">'+ico('ajuda')+' Ver o Como usar</a></div></div>'+
    '<div class="aj-hr"><div class="aj-hk"><b>'+SUG.meus.length+'</b><span>mensagens suas</span></div><div class="aj-hk"><b>'+SUG.meus.filter(i=>i.resp).length+'</b><span>respondidas</span></div><div class="aj-hk"><b>'+SUG.faq.length+'</b><span>dúvidas publicadas</span></div></div></div>';
  if((()=>{try{return !DBX}catch(e){return true}})())h+='<div class="sg-aviso">Este arquivo está aberto fora do site publicado (modo de teste): dá para experimentar, mas as mensagens <b>não são enviadas</b>. Use o link do site para enviar de verdade.</div>';
  if(SUG.pode===false&&!SUG.adm)h+='<div class="sg-aviso">Seu acesso ao site é <b>só de leitura</b>, por isso o envio de mensagens não está liberado. Peça ao administrador o acesso de <b>Contribuidor</b>.</div>';
  if(SUG.ultEnvio)h+='<div class="sg-ok">✓ Mensagem enviada! Número <b>'+SUG.esc(SUG.ultEnvio)+'</b>. Você vê a resposta em Minhas mensagens.</div>';
  if(adm){const all=[];SUG.todos.forEach(d=>(d.itens||[]).forEach(i=>all.push({uid:d.uid,it:i})));all.sort((a,b)=>b.it.em-a.it.em);
    const cnt=k=>all.filter(x=>x.it.st===k).length,f=all.filter(x=>(!SUG.f.st||x.it.st===SUG.f.st)&&(!SUG.f.tp||x.it.tipo===SUG.f.tp));
    h+='<section class="aj-sec sg-admin"><div class="aj-sh"><span class="aj-sn">'+ico('user')+'</span><div><h3>Caixa do administrador</h3><small>só você vê esta parte · '+all.length+' mensagens de '+SUG.todos.length+' pessoa(s)</small></div></div>'+
      '<div class="sg-k">'+Object.entries(SUG.ST).map(([k,s])=>'<button type="button" class="sg-kc'+(SUG.f.st===k?' on':'')+'" data-sgfst="'+k+'"><span class="sg-st '+s[1]+'">'+s[0]+'</span><b>'+cnt(k)+'</b></button>').join('')+'</div>'+
      '<div class="sg-fil"><span>Tipo:</span>'+['',...SUG.TIPOS.map(t=>t[0])].map(t=>'<button type="button" class="sg-pf'+(SUG.f.tp===t?' on':'')+'" data-sgftp="'+t+'">'+(t||'Todos')+'</button>').join('')+(SUG.f.st?'<button type="button" class="sg-pf" data-sgfst="">✕ limpar situação</button>':'')+'</div>'+
      '<div class="sg-lista">'+(f.length?f.map(x=>SUG.item(x.it,true,x.uid,'')).join(''):'<p class="sg-vz">Nenhuma mensagem com esse filtro.</p>')+'</div></section>'}
  h+='<div class="sg-g">'+
    '<section class="aj-sec"><div class="aj-sh"><span class="aj-sn">'+ico('mais')+'</span><div><h3>Nova mensagem</h3><small>leva menos de 1 minuto</small></div></div>'+SUG.form(false)+'</section>'+
    '<section class="aj-sec"><div class="aj-sh"><span class="aj-sn">'+ico('lista')+'</span><div><h3>Minhas mensagens</h3><small>situação e resposta de cada uma</small></div></div><div class="sg-lista">'+(SUG.meus.length?SUG.meus.map(i=>SUG.item(i,false)).join(''):'<p class="sg-vz">Você ainda não enviou nenhuma mensagem.</p>')+'</div>'+
      '<div class="sg-leg">'+Object.values(SUG.ST).map(s=>'<span class="sg-st '+s[1]+'">'+s[0]+'</span>').join('')+'</div></section>'+
  '</div>';
  if(SUG.faq.length)h+='<section class="aj-sec"><div class="aj-sh"><span class="aj-sn">'+ico('ajuda')+'</span><div><h3>Perguntas já respondidas</h3><small>dúvidas de outros usuários publicadas pelo administrador</small></div></div>'+SUG.faq.map(f=>AJ.faq(SUG.esc(f.q),SUG.esc(f.a).replace(/\n/g,'<br>'))).join('')+'</section>';
  return h+'</div>'};
/* nomes de quem enviou (só para o administrador; nada de nome é guardado) */
async function sugNomes(){const els=[...document.querySelectorAll('.sg-who[data-sguid]')];if(!els.length||!SUG.user||!SUG.user.profiles)return;
  try{const ids=[...new Set(els.map(e=>e.dataset.sguid))];const ps=await SUG.user.profiles(ids);els.forEach(e=>{const p=ps&&ps[e.dataset.sguid];e.textContent=(p&&p.name)||(e.dataset.sguid===SUG.uid?'Você':'Usuário')})}catch(e){}}

/* ações */
document.addEventListener('click',async e=>{const b=e.target.closest('[data-sgtp],[data-sgfst],[data-sgftp],[data-sged],[data-sgcanc],[data-sgdel],[data-sgst],[data-ajutil]');if(!b)return;
  if(b.dataset.sgtp){SUG.tipo=b.dataset.sgtp;b.closest('.sg-tps').querySelectorAll('.sg-tp').forEach(x=>x.classList.toggle('on',x===b));return}
  if(b.dataset.sgfst!=null){SUG.f.st=SUG.f.st===b.dataset.sgfst?'':b.dataset.sgfst;render();return}
  if(b.dataset.sgftp!=null){SUG.f.tp=b.dataset.sgftp;render();return}
  if(b.dataset.sged){SUG.edit=b.dataset.sged;render();return}
  if(b.hasAttribute('data-sgcanc')){SUG.edit=null;render();return}
  if(b.dataset.sgdel){if(!confirm('Excluir esta mensagem? Não dá para desfazer.'))return;const [u,id]=b.dataset.sgdel.split('|');await SUG.excluirAdm(u,id);render();return}
  if(b.dataset.sgst){const [u,id,st]=b.dataset.sgst.split('|');await SUG.salvarAdm(u,id,{st});render();return}
  if(b.dataset.ajutil){const ok=b.dataset.ajutil==='sim';const box=document.getElementById('aj-util');
    if(ok){box.innerHTML='<span>Obrigado! 😊</span>';SUG.enviar({tipo:'Elogio',area:'Como usar',tela:'Como usar',tit:'O guia ajudou',txt:'Avaliação rápida: a página Como usar ajudou.'})}
    else box.innerHTML='<span>Que pena. Conte o que faltou:</span> <a class="aj-ir" href="#sugestoes">Enviar dúvida →</a>';}
});
document.addEventListener('submit',async e=>{const f=e.target;
  if(f.matches('[data-sgform]')){e.preventDefault();const d=new FormData(f);const tit=(d.get('tit')||'').trim(),txt=(d.get('txt')||'').trim();if(!tit||!txt){toast('Preencha o assunto e a descrição.');return}
    const bt=f.querySelector('[type=submit]');bt.disabled=true;bt.textContent='Enviando...';
    const r=await SUG.enviar({tipo:SUG.tipo,area:d.get('area'),tela:d.get('tela'),tit,txt});
    if(!r.ok){bt.disabled=false;bt.textContent='Enviar';toast('Não foi possível enviar: '+r.erro);return}
    if(f.dataset.sgform==='mini'){ajxFechar();toast(r.teste?'Modo de teste: a mensagem não foi enviada.':'Mensagem enviada! Número '+r.id+'.')}
    else{SUG.ultEnvio=r.teste?null:r.id;if(r.teste)toast('Modo de teste: a mensagem não foi enviada.');render();setTimeout(()=>{SUG.ultEnvio=null},15000)}return}
  if(f.matches('[data-sgaf]')){e.preventDefault();const [u,id]=f.dataset.sgaf.split('|');const d=new FormData(f);const resp=(d.get('resp')||'').trim();let st=d.get('st');if(resp&&st==='nova')st='respondida';
    const ok=await SUG.salvarAdm(u,id,{st,resp,respEm:resp?Date.now():0});if(!ok)return;
    const it=SUG.todos.find(x=>x.uid===u).itens.find(x=>x.id===id),pub=!!d.get('faq'),ja=SUG.faq.some(x=>x.id===id);
    if(pub&&!resp)toast('Escreva a resposta antes de publicar.');else if(pub!==ja||pub)await SUG.publicar(it,pub);
    SUG.edit=null;toast('Salvo. Quem enviou já vê a resposta.');render();sugBadge()}
});

/* botão de ajuda flutuante (em todas as telas) */
function ajxMontar(){if(document.getElementById('ajx'))return;const b=document.createElement('button');b.id='ajx';b.type='button';b.setAttribute('aria-label','Ajuda e sugestões');b.title='Ajuda desta tela e sugestões';b.innerHTML=ico('ajuda');document.body.appendChild(b);
  b.onclick=()=>{const p=document.getElementById('ajxp');if(p&&p.classList.contains('on'))ajxFechar();else ajxAbrir()}}
function ajxAbrir(form){let p=document.getElementById('ajxp');if(!p){p=document.createElement('div');p.id='ajxp';document.body.appendChild(p)}
  const id=(()=>{try{return pag().id}catch(e){return ''}})(),c=AJ.CTX[id];
  p.innerHTML='<div class="ajxp-h"><b>'+(form?'Enviar dúvida ou sugestão':'Ajuda desta tela')+'</b><button type="button" data-ajxx aria-label="Fechar">✕</button></div><div class="ajxp-c">'+(form?SUG.form(true):
    (c?'<div class="ajxp-t"><h4>'+c[0]+'</h4><p><b>Para que serve:</b> '+c[1]+'</p><p><b>Como ler:</b> '+c[2]+'</p>'+(c[3]?'<p class="ajxp-d">💡 '+c[3]+'</p>':'')+'</div>':'')+
    '<div class="ajxp-a"><button type="button" data-ajxform>'+ico('ideia')+'<span><b>Enviar dúvida ou sugestão</b><small>o administrador responde</small></span></button><button type="button" data-ajtour>'+ico('play')+'<span><b>Fazer o tour guiado</b><small>1 minuto, passo a passo</small></span></button><a href="#ajuda" data-ajxx>'+ico('livro')+'<span><b>Abrir o Como usar</b><small>guia completo e glossário</small></span></a><a href="#sugestoes" data-ajxx>'+ico('lista')+'<span><b>Minhas mensagens</b><small>ver respostas</small></span></a></div>')+'</div>';
  p.classList.add('on');p.querySelectorAll('[data-ajxx]').forEach(x=>x.addEventListener('click',ajxFechar));const fb=p.querySelector('[data-ajxform]');if(fb)fb.onclick=()=>ajxAbrir(true);const tb=p.querySelector('[data-ajtour]');if(tb)tb.addEventListener('click',ajxFechar)}
function ajxFechar(){const p=document.getElementById('ajxp');if(p)p.classList.remove('on')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')ajxFechar()});
{const _r=render;render=function(){const x=_r.apply(this,arguments);try{ajxMontar();ajxFechar();if(pag().id==='sugestoes')sugNomes();
  if(!SUG._tour&&pag().id==='entrada'){SUG._tour=1;let v=null;try{v=localStorage.getItem('central.tour')}catch(e){}if(!v)setTimeout(()=>{const n=document.getElementById('ajx');if(n)n.classList.add('pulsa')},1500)}}catch(e){}return x}}
