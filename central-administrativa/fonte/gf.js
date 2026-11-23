/* ===== filtros sempre no botão "Filtros" (gaveta lateral) ===== */
let GF_OPEN=false;
const gfIco='<svg class="ico" viewBox="0 0 24 24"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/></svg>';
function gfAplicar(){document.querySelectorAll('.gfgav,.gffundo').forEach(x=>x.remove());
  const m=$('main');if(!m)return;const bars=[...m.querySelectorAll('.pfbar,.lfil')];if(!bars.length){GF_OPEN=false;return}const bar=bars[0];
  const sels=bars.flatMap(b=>[...b.querySelectorAll('select')]),ativos=sels.filter(s=>s.value!=='');
  const lab=s=>{const l=s&&s.closest('label');if(!l)return '';const c=l.cloneNode(true);c.querySelectorAll('select').forEach(x=>x.remove());return c.textContent.trim()};
  /* botão */
  const btn=document.createElement('button');btn.type='button';btn.className='tifbtn gfbtn'+(GF_OPEN?' on':'');btn.innerHTML=gfIco+'Filtros'+(ativos.length?'<span class="ufn">'+ativos.length+'</span>':'');
  btn.onclick=()=>{GF_OPEN=!GF_OPEN;render()};
  const ub=m.querySelector('.ubar');let r=ub&&ub.querySelector(':scope > .ubar-r');
  if(ub&&!r){r=document.createElement('div');r.className='ubar-r';ub.appendChild(r)}
  if(r)r.appendChild(btn);else bar.parentNode.insertBefore(btn,bar);
  /* chips dos filtros ativos */
  const ch=document.createElement('div');ch.className='tichips gfchips';
  ativos.forEach(s=>{const sp=document.createElement('span');sp.className='chipf';sp.innerHTML='<small>'+esc(lab(s))+'</small>'+esc(s.options[s.selectedIndex].text)+'<button type="button" aria-label="Remover filtro">×</button>';sp.querySelector('button').onclick=()=>{s.value='';s.dispatchEvent(new Event('change',{bubbles:true}))};ch.appendChild(sp)});
  const limpar=()=>{const lb=bars.map(b=>b.querySelector('[data-pflimpa],[data-fflimpa]')).find(Boolean);if(lb){lb.click();return}if(bar.classList.contains('lfil')&&typeof LF!=='undefined'){LF.b='';LF.ct='';LF.mes='';render();return}ativos.forEach(s=>{s.value='';s.dispatchEvent(new Event('change',{bubbles:true}))})};
  if(ativos.length){const b=document.createElement('button');b.type='button';b.className='tilimpa';b.textContent='Limpar tudo';b.onclick=limpar;ch.appendChild(b)}
  bar.parentNode.insertBefore(ch,bar);
  /* gaveta */
  const corpo=document.createElement('div');corpo.className='tigav-b';
  bars.forEach(b=>[...b.children].forEach(c=>{if(c.matches('[data-pflimpa],[data-fflimpa]'))return;corpo.appendChild(c)}));
  corpo.querySelectorAll('label').forEach(l=>{if(!l.querySelector('small')){const s=l.querySelector('select,input');if(!s)return;const t=lab(s);[...l.childNodes].forEach(n=>{if(n.nodeType===3)n.remove()});const sm=document.createElement('small');sm.textContent=t;l.insertBefore(sm,l.firstChild)}});
  corpo.insertAdjacentHTML('beforeend','<p class="tigav-n">Os resultados mudam na hora em que você escolhe.</p>');
  bars.forEach(b=>b.remove());
  if(!GF_OPEN)return;
  const fundo=document.createElement('div');fundo.className='tigav-fundo gffundo';fundo.onclick=()=>{GF_OPEN=false;render()};
  const av=document.createElement('aside');av.className='tigav gfgav';av.setAttribute('role','dialog');av.setAttribute('aria-label','Filtros');
  av.innerHTML='<div class="tigav-h"><h3>Filtros</h3><button type="button" class="tigav-x" aria-label="Fechar">×</button></div>';
  av.appendChild(corpo);
  const pe=document.createElement('div');pe.className='tigav-p';pe.innerHTML='<button type="button" class="btn">Limpar</button><button type="button" class="btn primary">Ver resultado</button>';
  pe.children[0].onclick=limpar;pe.children[1].onclick=()=>{GF_OPEN=false;render()};av.appendChild(pe);
  av.querySelector('.tigav-x').onclick=()=>{GF_OPEN=false;render()};
  document.body.appendChild(fundo);document.body.appendChild(av)}
{const _r=render;render=function(){const r=_r.apply(this,arguments);try{gfAplicar()}catch(e){console.error(e)}return r}}
addEventListener('hashchange',()=>{GF_OPEN=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&GF_OPEN){GF_OPEN=false;render()}});
/* ===== painéis lado a lado com a mesma altura: lista longa mostra o essencial + "Ver todos" ===== */
const EQ_ABERTO=new Set();
function gfEquilibra(){const m=$('main');if(!m)return;m.classList.toggle('estreito',m.clientWidth<1180);if(innerWidth<900||m.clientWidth<1180)return;const pid=(location.hash||'#').slice(1);
  m.querySelectorAll('.xg2,.xg2b').forEach(g=>{const ps=[...g.children].filter(c=>(c.classList.contains('panel')||c.classList.contains('xcol'))&&c.offsetHeight);if(ps.length!==2)return;
    const alt=p=>p.classList.contains('xcol')?[...p.children].reduce((s,c)=>s+(c.classList.contains('panel')?[...c.children].reduce((a,x)=>a+x.offsetHeight,0)+40:c.offsetHeight)+18,-18):[...p.children].reduce((s,c)=>s+c.offsetHeight,0);const [a,b]=ps.map(alt);let [hi,lo]=a>b?[ps[0],ps[1]]:[ps[1],ps[0]];if(hi.classList.contains('xcol'))hi=[...hi.children].filter(c=>c.classList.contains('panel')).pop();if(!hi)return;const diff=Math.abs(a-b);if(diff<140||Math.max(a,b)<Math.min(a,b)*1.35)return;
    const h3=hi.querySelector('h3'),key=pid+'|'+(h3?h3.textContent:'');
    /* acha a lista: o contêiner com mais filhos iguais */
    let best=null,bn=0;hi.querySelectorAll('*').forEach(c=>{if(c.closest('.eqmais'))return;const k=[...c.children];if(k.length<7)return;const cls=k[0].tagName+'.'+k[0].className;const n=k.filter(x=>x.tagName+'.'+x.className===cls).length;if(n>bn&&n>=k.length*.8){bn=n;best=c}});
    if(!best)return;const rows=[...best.children].filter(r=>!r.classList.contains('tot'));if(rows.length<7)return;
    if(EQ_ABERTO.has(key)){const bt=document.createElement('button');bt.type='button';bt.className='eqmais';bt.textContent='Mostrar menos';bt.onclick=()=>{EQ_ABERTO.delete(key);render()};hi.appendChild(bt);return}
    let corta=diff+44,keep=rows.length;for(let i=rows.length-1;i>=5&&corta>0;i--){corta-=rows[i].offsetHeight;keep=i}
    if(keep>=rows.length)return;rows.slice(keep).forEach(r=>r.style.display='none');
    const bt=document.createElement('button');bt.type='button';bt.className='eqmais';bt.textContent='Ver todos ('+rows.length+')';bt.onclick=()=>{EQ_ABERTO.add(key);render()};hi.appendChild(bt)})}
{const _r=render;render=function(){const r=_r.apply(this,arguments);try{gfEquilibra()}catch(e){console.error(e)}return r}}
addEventListener('resize',(()=>{let t;return ()=>{clearTimeout(t);t=setTimeout(()=>render(),250)}})());
/* ===== cartões de indicador no mesmo padrão (icard) em todas as áreas ===== */
function gfCartoes(){const m=$('main');if(!m)return;
  m.querySelectorAll('.tifk,.lk,.dbk').forEach(g=>{g.classList.add('kpad');g.querySelectorAll(':scope > .bcard').forEach(c=>{
    const cls=c.classList.contains('sup')?'ate':c.classList.contains('par')?'par':c.classList.contains('nao')?'nao':'';
    const k=c.querySelector('span'),v=c.querySelector('b'),s=c.querySelector('small');
    const d=document.createElement('div');d.className='icard kpad-c'+(cls?' st-'+cls:'');
    d.innerHTML='<div class="ic-hd"><span class="ic-k">'+(k?k.innerHTML:'')+'</span></div><div class="ic-v sm '+cls+'">'+(v?v.innerHTML:'')+'</div>'+(s?'<p class="kpad-s">'+s.innerHTML+'</p>':'');
    c.replaceWith(d)})})}
{const _r=render;render=function(){const r=_r.apply(this,arguments);try{gfCartoes()}catch(e){console.error(e)}return r}}
/* ===== 1. frase-resumo no topo ===== */
function gfResumo(){const m=$('main');if(!m||m.querySelector('.resumo'))return;
  const cards=[...m.querySelectorAll('.icard')].filter(c=>!c.closest('.indg,.pind'));if(cards.length<3)return;
  const it=cards.map(c=>{const v=c.querySelector('.ic-v');const k=c.querySelector('.ic-k');const cl=v?v.className:'';const st=/\bnao\b|\bneg\b/.test(cl)?'nao':/\bpar\b/.test(cl)?'par':/\bate\b|\bpos\b|\bsup\b/.test(cl)?'ate':'';return {st,k:k?k.textContent.trim():'',v:v?v.textContent.trim():''}}).filter(x=>x.k);
  const nao=it.filter(x=>x.st==='nao'),par=it.filter(x=>x.st==='par'),ok=it.filter(x=>x.st==='ate');if(!nao.length&&!par.length&&!ok.length)return;
  const cap=s=>s.charAt(0)+s.slice(1).toLowerCase();const lst=a=>a.map(x=>'<b>'+esc(cap(x.k))+'</b> ('+esc(x.v)+')').join(', ');
  const cls=nao.length?'nao':par.length?'par':'ate';
  const txt=(nao.length?'<span>Fora do esperado: '+lst(nao)+'.</span>':'')+(par.length?'<span>Atenção: '+lst(par)+'.</span>':'')+(!nao.length&&!par.length?'<span>Tudo dentro do esperado neste período.</span>':ok.length?'<span>'+ok.length+' indicador'+(ok.length>1?'es':'')+' em dia.</span>':'');
  const d=document.createElement('div');d.className='resumo '+cls;d.innerHTML='<i>'+(cls==='ate'?'✓':'!')+'</i><div><small>Resumo do período</small><p>'+txt+'</p></div>';
  const alvo=cards[0].closest('.k6,.kpad,.vgk,.tifk,.lk')||cards[0].parentElement;alvo.parentElement.insertBefore(d,alvo)}
/* ===== 7. textos de apoio longos viram (i) ===== */
function gfInfo(){const m=$('main');if(!m)return;
  m.querySelectorAll('.panel .phd > small, .panel .phd > span.sml').forEach(s=>{const t=s.textContent.trim();if(t.length<=34||s.querySelector('button,a,select,input'))return;
    const b=document.createElement('span');b.className='pinfo';b.setAttribute('data-tip',esc(t));b.setAttribute('tabindex','0');b.setAttribute('aria-label',t);b.textContent='i';s.replaceWith(b)})}
/* ===== 6. modo apresentação ===== */
function gfApresBtn(){if($('b-apres'))return;const t=$('b-tema');if(!t)return;const b=document.createElement('button');b.className='tbtn';b.id='b-apres';b.type='button';b.title='Modo apresentação (tela cheia, sem menu e filtros)';
  b.innerHTML='<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg><span class="txt">Apresentar</span>';
  b.onclick=()=>{const on=!document.body.classList.contains('apres');document.body.classList.toggle('apres',on);try{if(on&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});else if(!on&&document.fullscreenElement)document.exitFullscreen()}catch(e){}toast(on?'Modo apresentação: aperte Esc para sair.':'Modo normal.')};
  t.parentNode.insertBefore(b,t)}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('apres'))document.body.classList.remove('apres')});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('apres')});
{const _r=render;render=function(){const r=_r.apply(this,arguments);try{gfResumo();gfInfo();gfApresBtn()}catch(e){console.error(e)}return r}}
