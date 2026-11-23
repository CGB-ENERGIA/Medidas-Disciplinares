/* ===== ÁREA: abrir a Central já filtrada por cartão (central.html?area=financeiro|patrimonio|ti|atendimento) ===== */
const AREA=(()=>{let a='';try{a=(new URLSearchParams(location.search).get('area')||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}catch(e){}
  const M={
    financeiro:{nm:'Financeiro',sub:'Hospedagem, alimentação, locação e produtividade',gs:['Hospedagem / Alimentação','Controle de Locação','Equipe','Banco de dados'],ini:'inicio'},
    patrimonio:{nm:'Patrimônio',sub:'Inventário, cronograma e bens',gs:['Patrimônio'],ini:'pat-painel'},
    ti:{nm:'Tecnologia (TI)',sub:'Custos, notas e aquisições',gs:['Setor de TI'],ini:'ti-custos'},
    atendimento:{nm:'Atendimento',sub:'Fale Conosco',gs:['Fale Conosco'],ini:'fc-painel'}};
  return M[a]?Object.assign({id:a},M[a]):null})();
if(AREA){
  /* fica só o que é da área, mais Ajuda; as páginas ocultas do Administrativo (ficha do indicador) continuam acessíveis pelos cliques */
  const fica=PAGINAS.filter(p=>AREA.gs.includes(p.g)||p.g==='Ajuda'||(p.g==='Administrativo'&&p.id!=='entrada'&&p.hide)||p.id==='ti-nota');
  const i0=fica.findIndex(p=>p.id===AREA.ini);if(i0>0)fica.unshift(fica.splice(i0,1)[0]);
  PAGINAS.splice(0,PAGINAS.length,...fica);
  document.body.classList.add('area-'+AREA.id);
  try{document.title=AREA.nm+' · Central Administrativa CGB'}catch(e){}
}
if(AREA&&typeof TOUR!=='undefined'){TOUR[0][2]='Aqui ficam só as telas de '+AREA.nm+', mais Como usar e Sugestões e dúvidas.';TOUR[2][2]='Os cartões mostram os principais números de '+AREA.nm+'. A cor indica a situação. Clique para ver o resumo.'}
/* ===== duplicados: a mesma regra do dedup.py vale para as planilhas enviadas pelo site =====
   Hospedagem: mesmo colaborador, mesma entrada e mesma saída. Alimentação: mesmo colaborador, mesmo dia e mesma refeição.
   Fica o lançamento com nota fiscal; depois o de valor maior que zero; depois o primeiro da planilha. */
function caSemDup(rs,chave){const temNF=v=>String(v||'').replace(/[\s0]/g,'')!=='';const g=new Map();
  rs.forEach((r,i)=>{const k=chave(r);if(k==null)return;if(!g.has(k))g.set(k,[]);g.get(k).push(i)});const fora=new Set();
  for(const ix of g.values()){if(ix.length<2)continue;ix.sort((a,b)=>(temNF(rs[b].nf)-temNF(rs[a].nf))||((rs[b].tot>0)-(rs[a].tot>0))||(a-b));ix.slice(1).forEach(i=>fora.add(i))}
  const out=rs.filter((_,i)=>!fora.has(i));out.removidos=fora.size;return out}
const CA_TIPO={'Self-Service Almoço':'Almoço','Self-Service Jantar':'Jantar','Self-Service Café':'Café da Manhã'};
if(typeof parseWb==='function'){const _p=parseWb;parseWb=function(wb){return caSemDup(_p(wb),r=>r.col&&r.ent!=null&&r.sai!=null?String(r.col).trim().toUpperCase()+'|'+r.ent+'|'+r.sai:null)}}
if(typeof parseAlim==='function'){const _p=parseAlim;parseAlim=function(wb){return caSemDup(_p(wb),r=>r.col&&r.ent!=null?String(r.col).trim().toUpperCase()+'|'+r.ent+'|'+(CA_TIPO[r.tipo]||r.tipo):null)}}
