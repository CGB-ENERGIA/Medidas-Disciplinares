/* ===== COMO USAR + SUGESTÕES: central de ajuda do sistema ===== */
Object.assign(ICON,{ajuda:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.6"/><circle cx="12" cy="17" r=".6"/>',tela:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',img:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',filtro:'<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>',ideia:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',livro:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>'});
PAGINAS.push({id:'ajuda',nm:'Como usar',sub:'Guia do sistema',ic:'ajuda',g:'Ajuda'},{id:'sugestoes',nm:'Sugestões e dúvidas',sub:'Fale com o administrador',ic:'ideia',g:'Ajuda'});
GRUPO_ICO['Ajuda']='ajuda';GRUPO_SUB['Ajuda']='Guia e sugestões';

const AJ={
  ir:(id,t)=>'<a class="aj-ir" href="#'+id+'">'+(t||'Abrir')+' →</a>',
  passo:(n,t,d)=>'<li><span class="aj-n">'+n+'</span><div><b>'+t+'</b><p>'+d+'</p></div></li>',
  sec:(id,ic,t,s,h,k)=>'<section class="aj-sec" id="aj-'+id+'" data-ajk="'+VX.esc((t+' '+s+' '+(k||'')).toLowerCase())+'"><div class="aj-sh"><span class="aj-sn">'+ico(ic)+'</span><div><h3>'+t+'</h3>'+(s?'<small>'+s+'</small>':'')+'</div></div>'+h+'</section>',
  faq:(q,a)=>'<details class="aj-faq" data-ajk="'+VX.esc((q+' '+a).toLowerCase().replace(/<[^>]+>/g,''))+'"><summary>'+q+'</summary><p>'+a+'</p></details>',
  /* ajuda de cada tela: título, para que serve, como ler, dica */
  CTX:{
    entrada:['Início','Resumo de toda a Central: saúde geral, avisos do momento e um cartão por área.','O anel mostra quantos indicadores com meta estão no verde. Os cartões das áreas mostram o principal número de cada uma.','Clique num cartão de área para abrir o painel dela.'],
    inicio:['Painel geral da Hospedagem','Quanto foi gasto com hospedagem (ou alimentação) e quanto isso representa da meta.','A barra com marca mostra cada área contra a meta até hoje; o ritmo do orçamento compara o acumulado com o tracejado da meta.','Use os botões Hospedagem/Alimentação no topo para trocar de modo.'],
    onde:['Onde se gasta','Em quais bases, cidades, hotéis e colaboradores o dinheiro está indo.','O mapa de blocos mostra cada base do tamanho do seu gasto, dividida pelas cidades.','Clique numa cidade ou hotel para ver os últimos lançamentos.'],
    lancar:['Lançar no sistema','Registrar hospedagens ou refeições sem precisar de planilha.','Preencha os campos e salve; o lançamento entra nos painéis na hora.','Em modo de teste nada é gravado.'],
    controle:['Pendências da base','Lançamentos com erro, sem nota ou a revisar.','Cada linha mostra o problema encontrado e o valor envolvido.','Corrija na planilha da base e envie de novo em Banco de dados.'],
    'loc-cad':['Cadastro de imóveis','Incluir e editar imóveis e lançar as contas do mês.','Os meses aparecem a partir do mês atual; dá para editar qualquer informação.','Ao salvar, aluguel, água e energia se atualizam sozinhos.'],
    'loc-busca':['Consultar imóvel','Achar um imóvel pela UC, locador ou endereço.','Digite parte do texto e escolha o imóvel na lista.','A ficha mostra contrato, contas e pagamentos.'],
    'loc-aluguel':['Aluguel','Previsto × pago, pendências e contratos a vencer.','A linha do tempo mostra os contratos que vencem primeiro; a grade mostra a situação de cada mês.','Use o filtro de mês de referência para ver meses anteriores.'],
    'loc-agua':['Água','Contas de água dos imóveis, por base e por imóvel.','Cada quadro é uma base; a última coluna é o último mês fechado (vermelha se subiu).','Clique numa base para ver os imóveis dela.'],
    'loc-energia':['Energia','Contas de energia dos imóveis, por base e por imóvel.','Cada quadro é uma base; a última coluna é o último mês fechado (vermelha se subiu).','Clique numa base para ver os imóveis dela.'],
    'pat-painel':['Painel do inventário','Como estão os bens: em conformidade, não conformes ou não encontrados.','Cada quadradinho é 1% dos bens; abaixo, a mesma grade mês a mês e a evolução.','Clique num mês ou numa situação para ver a lista.'],
    'pat-crono':['Cronograma 2026','O que já foi inventariado e o que falta.','Cada linha é uma etapa do cronograma com datas e situação.',''],
    'pat-nc':['Não conformidades','Bens não conformes e não encontrados.','Clique numa plaqueta para ver o histórico do bem.',''],
    'pat-bens':['Bens e responsáveis','Cadastro de bens, locais e movimentações.','Use os filtros de base e local para achar um bem.',''],
    'pat-banco':['Banco do patrimônio','Todos os registros do inventário e do cadastro.','Pesquise por plaqueta, descrição ou responsável.',''],
    'fc-painel':['Painel do Fale Conosco','Atendimentos aos colaboradores: situação, assuntos, bases e dias.','O funil mostra do pedido à solução; o mapa de calor mostra os assuntos mês a mês.','Clique num assunto para ver os atendimentos.'],
    'fc-lista':['Atendimentos','Lista com pergunta, resolução e status.','Use os filtros de mês, base, assunto e status.','O lápis abre a edição do atendimento.'],
    'fc-novo':['Registrar atendimento','Lançar um atendimento novo ou editar um existente.','Busque o colaborador, escolha o assunto e o status.',''],
    'ti-custos':['Painel de custos do TI','Gasto do mês contra a meta e para onde foi o material.','A cascata parte da meta, desconta cada contrato e termina no saldo.','Ver como: Compras ou Financeiro muda a visão.'],
    'ti-fin':['Painel do financeiro','Notas, parcelas e rateio por contrato.','Os cartões mostram o que já foi entregue ao financeiro.',''],
    'ti-notas':['Notas e prestação de contas','Cadastrar compras e anexar a nota (PDF/XML).','Os itens da nota são lidos sozinhos; informe o destino de cada um.',''],
    'ti-aquis':['Novas aquisições','Pedidos futuros e orçamento (perfil Compras).','Cada pedido tem setor, solicitante e situação.',''],
    eqp:['Produtividade da equipe','Lançamentos de cada pessoa no Contas a Pagar, por mês e por dia (só o administrador e os gestores do Financeiro veem).','Os cartões mostram o total do mês e a média por pessoa; o gráfico compara a equipe mês a mês.','Para atualizar, use o botão de enviar a planilha nesta tela.'],
    dados:['Banco de dados','De onde vêm os dados e como atualizar.','A linha de atualização mostra há quantos dias cada base foi atualizada.','Envie a planilha em Enviar planilha.'],
    ajuda:['Como usar','Este guia.','Use a busca ou o sumário para ir direto ao assunto.',''],
    sugestoes:['Sugestões e dúvidas','Mande dúvidas, ideias e problemas ao administrador.','Acompanhe a resposta em Minhas mensagens.','']
  },
  GLOSS:[['Meta até hoje','Parte da meta do ano que corresponde aos meses já passados (o mês atual entra proporcional aos dias).'],['Consumo da meta','Gasto realizado ÷ meta até hoje. Até 90% verde, 90–100% amarelo, acima de 100% vermelho.'],['Diária','Uma noite de hospedagem de um colaborador.'],['Ritmo do orçamento','Comparação do gasto acumulado com o tracejado da meta: abaixo do tracejado = dentro do planejado.'],['Último mês fechado','Mês completo mais recente. O mês atual não entra nas comparações porque ainda não terminou.'],['p.p. (pontos percentuais)','Diferença entre dois percentuais. De 80% para 81% = +1 p.p.'],['Conformidade','Bens encontrados e em ordem ÷ bens conferidos no inventário.'],['Não conforme','Bem encontrado, mas com algum problema (local, placa, responsável, estado).'],['Não encontrado','Bem do cadastro que não foi localizado no inventário.'],['UC','Unidade consumidora: o número da conta de água ou energia.'],['Distratado','Contrato de aluguel encerrado.'],['Previsto × pago','Valor de aluguel esperado no mês comparado com o que saiu no Contas a Pagar.'],['Rateio','Divisão do valor de uma nota entre bases, setores e contratos.'],['Modo de teste','Quando o site está aberto sem permissão de edição: dá para usar, mas nada é gravado.']]
};

const AJ_AREAS=[['cama','Hospedagem / Alimentação',['inicio','onde','lancar','controle']],['chave','Controle de Locação',['loc-cad','loc-busca','loc-aluguel','loc-agua','loc-energia']],['equipe','Produtividade da equipe',['eqp']],['caixa','Patrimônio',['pat-painel','pat-crono','pat-nc','pat-bens','pat-banco']],['chat','Fale Conosco',['fc-painel','fc-lista','fc-novo']],['pc','Setor de TI',['ti-custos','ti-fin','ti-notas','ti-aquis']],['db','Banco de dados',['dados']]];
const ajTem=id=>PAGINAS.some(p=>p.id===id&&(p.id!=='eqp'||caEqp()));
const ajArea=()=>{try{return AREA}catch(e){return null}};
/* termo do glossário -> área (sem área = vale para todas) */
const AJ_GA={'Meta até hoje':'financeiro','Consumo da meta':'financeiro','Diária':'financeiro','Ritmo do orçamento':'financeiro','UC':'financeiro','Distratado':'financeiro','Previsto × pago':'financeiro','Conformidade':'patrimonio','Não conforme':'patrimonio','Não encontrado':'patrimonio','Rateio':'ti'};
PG.ajuda=()=>{
  const AR=ajArea(),ini=AR?AR.ini:'entrada',nIni=AR?'o painel de '+AR.nm:'o Início';
  const gl=AJ.GLOSS.filter(g=>!AR||!AJ_GA[g[0]]||AJ_GA[g[0]]===AR.id);
  const tarefas=[['inicio','cama','Ver o gasto de hospedagem e a meta'],['onde','pin','Descobrir onde mais se gasta'],['loc-aluguel','chave','Saber se um aluguel foi pago'],['loc-energia','raio','Ver contas de energia que subiram'],['pat-nc','caixa','Ver bens não encontrados'],['fc-novo','chat','Registrar um atendimento'],['ti-notas','pc','Lançar uma nota de TI'],['dados','db','Enviar uma planilha atualizada']].filter(t=>ajTem(t[0]));
  const fq=(typeof SUG!=='undefined'?SUG.faq:[]).filter(f=>!AR||!f.area||f.area==='Geral'||f.area==='Como usar'||AR.gs.includes(f.area)).map(f=>AJ.faq(VX.esc(f.q),VX.esc(f.a).replace(/\n/g,'<br>'))).join('');
  return '<div class="aj">'+
  '<div class="aj-hero"><div class="aj-hl"><span class="aj-tag">'+ico('ajuda')+' Central de ajuda</span><h2>Como usar '+(AR?'· '+AR.nm:'a Central Administrativa')+'</h2><p>Tudo o que você precisa para navegar, filtrar, lançar dados e apresentar os indicadores. Procure pelo assunto ou faça o tour guiado de 1 minuto.</p>'+
    '<div class="aj-busca"><svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" id="aj-q" placeholder="Pesquisar na ajuda: filtro, meta, nota, imóvel..." autocomplete="off"></div>'+
    '<div class="aj-hb"><button type="button" class="aj-bt claro" data-ajtour>'+ico('play')+' Fazer o tour guiado</button><a class="aj-bt" href="#sugestoes">'+ico('ideia')+' Enviar dúvida ou sugestão</a></div></div>'+
    '<div class="aj-hr"><div class="aj-hk"><b>1 min</b><span>tour guiado</span></div><div class="aj-hk"><b>'+AJ_AREAS.filter(a=>a[2].some(ajTem)).length+'</b><span>'+(AR?'grupos de telas':'áreas explicadas')+'</span></div><div class="aj-hk"><b>'+gl.length+'</b><span>termos no glossário</span></div></div></div>'+
  '<p class="aj-semres" hidden>Nada encontrado para essa busca. <a href="#sugestoes">Envie sua dúvida</a> que o administrador responde.</p>'+

  AJ.sec('tarefas','seta','O que você quer fazer?','atalhos para as tarefas mais comuns','<div class="aj-tasks">'+tarefas.map(t=>'<a class="aj-task" href="#'+t[0]+'"><span class="aj-ti">'+ico(t[1])+'</span><b>'+t[2]+'</b><i>→</i></a>').join('')+'</div>','hospedagem meta onde gasta aluguel pago energia bens atendimento nota planilha')+

  AJ.sec('comecar','play','Primeiros passos','o básico em 5 passos','<ol class="aj-passos">'+
    (AR?AJ.passo(1,'Abra o painel da área','A primeira tela de '+AR.nm+' resume os principais números.')+AJ.passo(2,'Escolha a tela','Use o menu à esquerda: ele mostra só as telas de '+AR.nm+'.'):AJ.passo(1,'Abra o Início','A primeira tela resume toda a Central: saúde geral, avisos do momento e um cartão por área.')+AJ.passo(2,'Escolha uma área','Clique no cartão da área ou use o menu à esquerda (em <b>Áreas</b>).'))+
    AJ.passo(3,'Leia os cartões do topo','A cor indica a situação: <b class="aj-ok">verde</b> = bom, <b class="aj-par">laranja</b> = atenção, <b class="aj-nao">vermelho</b> = problema, vinho = informação.')+
    AJ.passo(4,'Filtre quando precisar','O botão <b>Filtros</b> deixa ver só uma base, um mês, um contrato...')+
    AJ.passo(5,'Clique para entender','Barras, linhas de tabela e cartões abrem um <b>resumo detalhado</b> com frase pronta, números e registros.')+
  '</ol><div class="aj-row">'+AJ.ir(ini,'Ir para '+nIni)+'<button type="button" class="aj-ir" data-ajtour>Fazer o tour →</button></div>','inicio area cartoes cores filtros clique resumo')+

  AJ.sec('menu','painel','Menu, busca e barra de cima','onde fica cada coisa','<div class="aj-g2"><div class="aj-box"><h4>'+ico('painel')+' Menu à esquerda</h4><ul class="aj-ul">'+(AR?'<li>Mostra só as telas de <b>'+AR.nm+'</b>. Para outra área, volte à tela de Ambientes do site.</li>':'<li><b>Administrativo</b> leva ao Início.</li><li>Em <b>Áreas</b> ficam as pastas de cada área; clique para abrir as telas.</li>')+'<li>Recolhido, mostra só os ícones: passe o mouse para ver os nomes.</li><li><b>Manter menu aberto</b> deixa os nomes sempre visíveis.</li><li>No celular, abra pelo botão <b>☰</b>.</li></ul></div>'+
    '<div class="aj-box"><h4>'+ico('lupa')+' Achar algo rápido</h4><ul class="aj-ul"><li><kbd>Ctrl</kbd> + <kbd>K</kbd> abre a busca: digite uma tela, base, imóvel ou UC.</li><li>O Início tem uma busca grande e atalhos prontos.</li><li><b>Recentes</b> no Início mostra as últimas telas abertas.</li><li>O botão <b>?</b> no canto inferior direito abre a ajuda da tela atual.</li></ul></div></div>'+
    '<div class="aj-btns">'+[['lupa','Buscar','Ir a qualquer tela (Ctrl + K).'],['cal','Dados até','Até que dia vão os dados da tela.'],['tela','Apresentar','Tela cheia, sem menu e filtros. Esc para sair.'],['sol','Tema','Claro ou escuro.'],['img','Print / Enviar','Gera a imagem da tela para WhatsApp ou e-mail.'],['filtro','Filtros','Abre os filtros da tela.']].map(x=>'<div class="aj-btn"><span class="aj-bi">'+ico(x[0])+'</span><div><b>'+x[1]+'</b><span>'+x[2]+'</span></div></div>').join('')+'</div>','menu busca ctrl k barra apresentar tema print enviar dados ate celular')+

  AJ.sec('filtros','filtro','Filtros','ver só o que interessa','<ol class="aj-passos">'+
    AJ.passo(1,'Clique em Filtros','Fica no topo da tela e mostra um número quando há filtros ligados.')+
    AJ.passo(2,'Escolha as opções','Base, mês, contrato, assunto, situação... dá para combinar vários.')+
    AJ.passo(3,'Veja o resultado','Clique em <b>Ver resultado</b>: cartões, gráficos e tabelas mudam juntos.')+
    AJ.passo(4,'Limpar','Abra os filtros e clique em <b>Limpar</b>, ou no ✕ da etiqueta do filtro.')+
  '</ol><p class="aj-nota"><b>Dica:</b> na Hospedagem, ao filtrar uma base os painéis mostram só o realizado (as metas são por centro de custo).</p>','filtro base mes contrato limpar ver resultado')+

  AJ.sec('clique','seta','Resumo com um clique','a informação detalhada de cada indicador','<div class="aj-g2"><div class="aj-box"><h4>Onde clicar</h4><ul class="aj-ul"><li>Barras e rankings.</li><li>Linhas de tabela.</li><li>Cartões do topo.</li><li>Gráficos principais de cada painel.</li></ul><p class="aj-nota">Onde dá para clicar, o mouse vira mãozinha e aparece "Clique para ver o resumo".</p></div>'+
    '<div class="aj-box"><h4>O que aparece</h4><ul class="aj-ul"><li>Frase-resumo pronta para a reunião.</li><li>Números principais com cor de situação.</li><li>Evolução mês a mês e onde se concentra.</li><li>Registros mais recentes.</li><li><b>Copiar resumo</b> para colar no WhatsApp ou e-mail.</li></ul><p class="aj-nota">Fechar: ✕, clique fora ou Esc.</p></div></div>','clique resumo detalhe copiar painel')+

  AJ.sec('areas','caixa','Cada área, tela por tela','para que serve cada tela e como ler','<div class="aj-areas">'+
    AJ_AREAS.filter(a=>a[2].some(ajTem)).map(a=>'<div class="aj-area"><div class="aj-ah"><span class="aj-ai">'+ico(a[0])+'</span><h4>'+a[1]+'</h4></div><ul class="aj-al">'+a[2].filter(ajTem).map(id=>{const c=AJ.CTX[id];return '<li><div><b>'+c[0]+'</b><span>'+c[1]+'</span></div>'+AJ.ir(id)+'</li>'}).join('')+'</ul></div>').join('')+
  '</div>','hospedagem alimentacao locacao aluguel agua energia patrimonio inventario fale conosco atendimento ti notas aquisicoes banco')+

  (AR&&AR.id==='patrimonio'?'':AJ.sec('lancar','mais','Lançar e cadastrar','como colocar informação no sistema','<div class="aj-g4">'+
    [['cama','Hospedagem','lancar',['Abra Lançar no sistema.','Escolha Hospedagem ou Alimentação.','Preencha base, colaborador, hotel, datas e valor.','Salve: entra nos painéis na hora.']],['chave','Locação','loc-cad',['Abra Cadastro de imóveis.','Imóvel novo: incluir e preencher base, endereço, locador e contrato.','Contas: abra o imóvel e preencha o valor do mês.','Aluguel, água e energia se atualizam sozinhos.']],['chat','Fale Conosco','fc-novo',['Abra Registrar atendimento.','Busque o colaborador e escolha o assunto.','Escreva a pergunta e defina o status.','Para corrigir, use o lápis na lista.']],['pc','Setor de TI','ti-notas',['Abra Notas e prestação de contas.','Inclua a compra e anexe o PDF ou XML.','Informe o destino de cada item.','Avance a situação até "entregue ao financeiro".']]].filter(x=>ajTem(x[2])).map(x=>'<div class="aj-box"><h4>'+ico(x[0])+' '+x[1]+'</h4><ol class="aj-ol">'+x[3].map(l=>'<li>'+l+'</li>').join('')+'</ol>'+AJ.ir(x[2])+'</div>').join('')+
    '</div><p class="aj-nota"><b>Importante:</b> só quem tem permissão de edição grava de verdade. Os demais usam o site em <b>modo de teste</b>.</p>','lancar cadastrar salvar hospedagem imovel atendimento nota permissao modo de teste'))+

  (!ajTem('dados')?'':AJ.sec('dados','db','Manter os dados em dia','como atualizar as bases','<ol class="aj-passos">'+
    AJ.passo(1,'Abra Banco de dados','Mostra cada base, até quando vão os dados e há quantos dias foi atualizada.')+
    AJ.passo(2,'Envie a planilha','Em <b>Enviar planilha</b>, escolha o tipo e selecione o arquivo. Cada arquivo substitui os dados daquela base; os lançamentos manuais continuam guardados.')+
    AJ.passo(3,'Confira','A data "Dados até" no topo das telas muda após o envio.')+
    AJ.passo(4,'Outras bases','As marcadas "mande para o Claude" são atualizadas enviando o arquivo na conversa com o Claude.')+
  '</ol>'+AJ.ir('dados','Ir para Banco de dados'),'planilha enviar atualizar banco dados ate'))+

  AJ.sec('apresentar','tela','Apresentar à gerência','roteiro para reunião','<ol class="aj-passos">'+
    AJ.passo(1,'Comece pelo '+(AR?'painel da área':'Início'),AR?'Os números principais de '+AR.nm+'.':'Saúde geral da Central e avisos do momento.')+
    AJ.passo(2,'Entre na área','Panorama pelos cartões do topo.')+
    AJ.passo(3,'Mostre o gráfico principal','Cada painel tem um gráfico próprio que responde a pergunta principal da área.')+
    AJ.passo(4,'Aprofunde com um clique','Clique no item que chamar atenção e leia a frase-resumo.')+
    AJ.passo(5,'Tela cheia e envio','<b>Apresentar</b> esconde menu e filtros; <b>Print / Enviar</b> gera a imagem para mandar depois.')+
  '</ol>','apresentar reuniao gerencia tela cheia print')+

  AJ.sec('glossario','livro','Glossário','o que significa cada termo','<dl class="aj-gl">'+gl.map(g=>'<div data-ajk="'+VX.esc((g[0]+' '+g[1]).toLowerCase())+'"><dt>'+g[0]+'</dt><dd>'+g[1]+'</dd></div>').join('')+'</dl>',gl.map(g=>g[0]).join(' ').toLowerCase())+

  AJ.sec('duvidas','ajuda','Dúvidas frequentes','','<div class="aj-fq">'+fq+
    AJ.faq('Os números não batem com a minha planilha. Por quê?','Veja a data "Dados até" no topo: os dados vão até o último envio. Confira se não há filtro ligado (o botão Filtros mostra um número).')+
    AJ.faq('Lancei algo e não apareceu.','Em modo de teste nada é gravado. Se houver filtro de base ou mês, o lançamento pode estar fora do filtro.')+
    AJ.faq('O mês atual parece baixo.','O mês em andamento ainda não fechou; por isso alguns gráficos comparam com o último mês fechado.')+
    AJ.faq('Não vejo "Novas aquisições" no Setor de TI.','Essa tela aparece só para o perfil Compras.')+
    AJ.faq('Posso usar no celular?','Sim. O menu abre pelo botão ☰ e os gráficos se ajustam à tela.')+
    AJ.faq('Como sugiro uma melhoria ou aviso um erro?','Use <b>Sugestões e dúvidas</b> no menu ou o botão <b>?</b> no canto da tela. Você acompanha a resposta do administrador por lá.')+
  '</div>','duvida pergunta faq')+

  '<div class="aj-util" id="aj-util"><span>Esta página ajudou?</span><button type="button" data-ajutil="sim">👍 Sim</button><button type="button" data-ajutil="nao">👎 Não</button></div>'+
  '<div class="aj-cta"><div><b>Não encontrou o que precisava?</b><span>Mande sua dúvida ou sugestão. O administrador responde e você acompanha por aqui.</span></div><a class="aj-bt claro" href="#sugestoes">'+ico('ideia')+' Enviar dúvida ou sugestão</a></div>'+
  '</div>'};

/* busca dentro da ajuda */
document.addEventListener('input',e=>{if(e.target.id!=='aj-q')return;const q=e.target.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');let n=0;
  document.querySelectorAll('.aj-sec').forEach(s=>{const t=(s.dataset.ajk+' '+s.innerText.toLowerCase()).normalize('NFD').replace(/[̀-ͯ]/g,'');const ok=!q||q.split(/\s+/).every(w=>t.includes(w));s.hidden=!ok;if(ok)n++;
    s.querySelectorAll('details.aj-faq').forEach(d=>{if(q){const tt=d.innerText.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');d.open=q.split(/\s+/).every(w=>tt.includes(w))}})});
  const sr=document.querySelector('.aj-semres');if(sr)sr.hidden=n>0});

/* tour guiado */
const TOUR=[
  ['#rail','Menu','Aqui ficam todas as áreas. Administrativo leva ao Início; em Áreas ficam as pastas de cada setor.'],
  ['#b-cmd','Busca rápida','Clique aqui ou aperte Ctrl + K para ir a qualquer tela, base, imóvel ou UC.'],
  ['#main .en-c, #main .vx, #main .icard','Indicadores','Os cartões mostram o principal número de cada área. A cor indica a situação. Clique para abrir o painel.'],
  ['#topAte','Dados até','Até que dia vão os dados. Se parecer desatualizado, veja o Banco de dados.'],
  ['#b-apres','Apresentar','Tela cheia para reuniões, sem menu e sem filtros. Esc para sair.'],
  ['#b-tema','Tema claro ou escuro','Troque o visual quando quiser.'],
  ['#b-copiar','Print / Enviar','Gera uma imagem da tela para mandar no WhatsApp ou e-mail.'],
  ['#ajx','Ajuda sempre à mão','Este botão abre a ajuda da tela atual e permite enviar dúvidas e sugestões ao administrador.']
];
function tourIr(k){const st=TOUR[k];let el=null;for(const s of st[0].split(','))if(!el){const c=document.querySelector(s.trim());if(c&&c.getBoundingClientRect().width>0)el=c}
  if(!el){if(k<TOUR.length-1)return tourIr(k+1);return tourFim()}
  let o=document.getElementById('tour');if(!o){o=document.createElement('div');o.id='tour';document.body.appendChild(o)}
  el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect(),pad=8,W=320;
  const x=Math.max(8,r.left-pad),y=Math.max(8,r.top-pad),w=Math.min(innerWidth-16,r.width+pad*2),h=Math.min(innerHeight-16,r.height+pad*2);
  let tx=r.right+16,ty=r.top;if(tx+W>innerWidth-10){tx=Math.max(10,Math.min(innerWidth-W-10,r.left));ty=r.bottom+16;if(ty+200>innerHeight)ty=Math.max(10,r.top-216)}
  o.innerHTML='<div class="tour-sp" style="left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px"></div><div class="tour-card" style="left:'+tx+'px;top:'+Math.max(10,ty)+'px;width:'+W+'px" role="dialog" aria-label="Tour guiado"><small>Passo '+(k+1)+' de '+TOUR.length+'</small><b>'+st[1]+'</b><p>'+st[2]+'</p><div><button type="button" data-tour="sair">Sair</button>'+(k?'<button type="button" data-tour="'+(k-1)+'">Anterior</button>':'')+'<button type="button" class="pri" data-tour="'+(k+1)+'">'+(k===TOUR.length-1?'Concluir':'Próximo')+'</button></div></div>';
  o.classList.add('on')}
function tourFim(){const o=document.getElementById('tour');if(o)o.classList.remove('on');try{localStorage.setItem('central.tour','1')}catch(e){}}
function tourIniciar(){if(location.hash!=='#entrada'){location.hash='#entrada';setTimeout(()=>tourIr(0),700)}else tourIr(0)}
document.addEventListener('click',e=>{const t=e.target.closest('[data-tour]');if(t){const v=t.dataset.tour;if(v==='sair'||+v>=TOUR.length)tourFim();else tourIr(+v);return}
  if(e.target.closest('[data-ajtour]')){e.preventDefault();tourIniciar()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('#tour.on'))tourFim()});
