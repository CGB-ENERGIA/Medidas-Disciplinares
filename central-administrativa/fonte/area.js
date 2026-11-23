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
