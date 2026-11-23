/* ===== papel de parede CGB no Fale Conosco (cabeçalho único) ===== */
const FC_BAN='data:image/jpeg;base64,%%FCBANNER%%';
{const _r=render;let feito=false;render=function(){if(!feito){feito=true;['fc-painel','fc-lista'].forEach(id=>{const f=PG[id];if(!f)return;PG[id]=()=>'<div class="fcban"><div class="fcban-i"><img src="'+FC_BAN+'" alt="Fale Conosco: um canal de aproximação feito para você"></div></div>'+f()})}
  const r=_r.apply(this,arguments);
  try{const m=$('main'),b=m&&m.querySelector(':scope > .fcban, .fcban'),u=b&&m.querySelector('.ubar');if(b&&u&&!b.contains(u)){b.appendChild(u);u.classList.add('fcub')}}catch(e){}
  return r}}
