# Histórico das decisões do projeto

Registro do que foi pedido e decidido ao longo da construção do protótipo.

## Fluxo e perfis
- Supervisor solicita → coordenador autoriza ou recusa → DP elabora → quem solicitou aplica → DP arquiva.
- Coordenador e DP também solicitam, sem precisar de autorização. Quem solicita é quem aplica.
- Login guardado para depois (Supabase); no protótipo troca-se o perfil no menu.
- Restrição por pessoa pela base-resumo de equipes (supervisor e coordenador veem só as equipes deles).

## Telas e organização
- Visual branco no padrão CGB, logo no topo, tema claro/escuro.
- Os três perfis com os mesmos 4 cartões (Solicitações, Aguardando autorização, Concluídas, Total), que filtram a lista.
- Gráficos e Banco de dados só para o DP. Removido "Onde estão as solicitações".
- Caixa de entrada do supervisor só com: documento para aplicação, solicitação autorizada, correção do documento, solicitação recusada (e medida cancelada). Sem "medida concluída".
- Status "Concluída" para supervisor/coordenador quando falta só o arquivamento do DP.
- Passo a passo e dúvidas para os colaboradores.
- Nova solicitação em 5 passos.

## Ocorrência e desvio
- Cidade opcional com os 217 municípios do Maranhão e busca sem acento.
- Placa com a frota ativa (frota-2026-11-03), mostrando só a placa.
- Removido "Procedimento descumprido"; "Local" virou "Ponto de referência".
- Removido "Tipo de situação"; o modelo de texto é escolhido pelo relato (com opção de trocar).
- Texto do fato termina no fato (pedido do DP).

## Regras da sugestão
- Régua de reincidência com medida padrão × medida a aplicar.
- Reincidência só do **mesmo desvio** (confirmado com o DP).
- Sugestão e reincidência contam só medidas registradas no sistema; histórico das planilhas só para consulta.

## Documento
- Modelo oficial CGB; depois passou de Word para **PDF**.
- Modelo de ponto manual do DP (uma ou várias datas).
- DP insere evidências (prints) no documento, também na etapa de aplicação.
- Campo sexo do colaborador (cadastro ou confirmado pelo DP) para Sr./Sra.
- Tratamento com advertido/suspenso (troca a medida).
- DP pode editar todos os dados da medida, com registro no histórico.
- Cancelamento de medida com motivo.

## Painel e indicadores
- Painel em Consulta, com alertas por perfil e cor por prazo.
- Indicadores com abrir/fechar e filtro de período.
- Medidas pendentes de aplicação em destaque (último passo), com visão para print para e-mail.
- DP: dashboard de documentos assinados pendentes por coordenador e supervisor.
- Indicadores próprios do supervisor (feito); coordenador (a fazer); DP permanece.

## Bases
- Cadastro de colaboradores (1610.xls), histórico (CONTROLE_MEDIDAS_DISCIPLINARES e Medidas_PONTO), equipes (base-resumo_9), frota (frota-2026-11-03).
- DP atualiza as bases enviando as planilhas, com conferência do que mudou.
- Sem dados pessoais (CPF, RG, endereço, telefone) no site.

## Testes
- Teste geral (27 verificações) e teste de uso com evidências (17 verificações), todos passando na versão de 05/11/2026.
- Exemplo com 79 solicitações em todas as etapas, fotos e prints ilustrativos, documentos assinados e histórico de 6 meses.

## Versão com banco e login (novembro de 2026)
- Banco Neon (sa-east-1) e site na Vercel; dados pessoais só no banco, nunca no GitHub.
- Login por usuário e senha (sem e-mail), com perfis supervisor, coordenador e DP; o DP cadastra e edita usuários.
- Solicitações gravadas no banco; o perfil de quem abre define a etapa (supervisor → coordenador; coordenador e DP → direto ao DP).
- Painel reorganizado: sua ação, acompanhamento e indicadores em grupos; reincidência numa base só.
- Downloads (PDF, Excel, CSV, apresentação) pelo navegador comum.
- Removidos o modo protótipo (troca de perfil, exemplos, envio de planilhas pelo navegador) e os scripts e testes antigos.

## Módulos e acessos (novembro de 2026)
- O site passa a ter dois módulos: Medidas Disciplinares e Contratações (este em preparação, a partir do site de Contratações já existente).
- Acessos: administrador (controle total e único que mexe em usuários), gestor de cada módulo (DP em Medidas, Recrutamento em Contratações), usuários fim (supervisor e coordenador em Medidas, solicitante em Contratações) e Gestão (só leitura em Contratações).
- O usuário fim de Contratações vê só as solicitações que ele mesmo abriu; os gestores veem tudo.
- Seletor de ambiente no topo para quem tem mais de um módulo.
- O módulo Contratações entrou no site trazendo o código do site de Contratações original (Artifact) e trocando só a camada de dados para o nosso banco; as regras de negócio não mudaram.
- Solicitante vê só o que ele mesmo abriu (sem a lista dos 19 solicitantes); o Recrutamento vê tudo.
- Os dados antigos (candidatos, vagas, talentos, currículos) são migrados por exportação feita no site antigo e importação por script, e não passam pelo chat nem pelo GitHub.
- O nível Gestão (só leitura) de Contratações foi removido: o módulo tem só Recrutamento (gestor) e Solicitante (usuário fim).

## Módulo Horas Extras (novembro de 2026, ambiente de testes)
- Terceiro módulo do site, a partir do relatório de horas extras feito fora do sistema. Por enquanto só quem for liberado pelo script `npm run horas:liberar` enxerga o módulo (coluna `usuarios.horas_extras`); o administrador não ganha o acesso sozinho.
- A base de batidas é enviada por planilha: a página lê o Excel no navegador e manda em lotes. A chave é CHAPA + DATABATIDA. Linha nova entra; linha que veio diferente é atualizada e o antes/depois fica em `he_ajustes` (sem alteração nem exclusão); linha igual não muda nada; linha que não vier no arquivo é mantida.
- O número de HE é o das colunas EXTRA da planilha: 4 batidas usam EXTRA ENTRADA + ALMOÇO + SAIDA; 2 batidas usam EXTRA ENTRADA2 + SAIDA2. Se |HTRAB − HBASE| ≤ 10 min, a jornada é normal e a HE do dia não é computada. Dias com outras quantidades de batidas ficam fora do indicador.
- Filiação (supervisor, coordenador, base, setor, equipe) vem da planilha de cadastro, pela CHAPA. Indireto: o responsável aparece como supervisor. Chapa sem cadastro aparece como "(sem cadastro)".
- Próximas fases: banco de horas (definição e fechamento ainda em aberto), perfis com escopo por coordenador e supervisor, e liberação para outros usuários.

### Horas Extras: banco de horas no Neon e alertas (novembro de 2026)
- **Decisão:** o banco de horas e as premissas ficam no Neon, um fechamento por período, em vez de acumular planilhas. Tabelas: `he_banco` (chave período + chapa + centro de custo, tempos em minutos), `he_premissas` (centro de custo → processo, seção → base) e `he_config` (HE aceitas por dia e dias úteis do período).
- **Alerta de banco de horas:** variação = saldo positivo do período − saldo positivo do período anterior guardado no banco. Acima de (HE aceitas por dia × dias úteis) é ALERTA; acima de zero é HORA EXTRA; senão COMPENSOU. Saldo negativo conta como zero, como na planilha de controle.
- **Alertas de jornada:** jornada média diária pelas batidas (até 8 h normal, acima de 8 h excessiva, acima de 10 h alarmante) e almoço médio (3ª − 2ª batida); o limite do almoço curto (60 min) é provisório.
- **Base padronizada:** siglas do base-resumo (BCB, PDT, PDS, PRES DUTRA, STI, ITM, BDC) são unificadas nos nomes das Premissas.

### Horas Extras: HE considerada limitada ao saldo do dia (11/11/2026)
- **Motivo:** chapa 12690 em 19/08/2026: colunas EXTRA somavam 38 min (12 de almoço + 26 de saída), mas o saldo do dia (HTRAB − HBASE) era 22 min, porque um atraso de 16 min na entrada não aparece nas colunas EXTRA.
- **Regra:** HE considerada do dia = menor valor entre a soma das colunas EXTRA aplicáveis (4 batidas: entrada + almoço + saída; 2 batidas: entrada2 + saída2) e o saldo do dia (HTRAB − HBASE, mínimo zero). A tolerância de 10 min continua valendo.
- **Entrada, Almoço e Saída** (cards, bases, Top 10) seguem as colunas da planilha, sem abatimento. Só a HE considerada (resumo, ranking, total por semana e dia da semana) é limitada.
- **Impacto na base de 16/08 a 15/09/2026:** HE considerada passou de 69.015 h (soma das colunas) para cerca de 22.020 h.
- **Novo bloco "Horas geradas e compensadas":** gerada = dias acima da base fora da tolerância; compensada = dias abaixo da base; banco positivo/negativo = saldo líquido por colaborador (gerada − compensada), somado por sinal.

- **Revertido no mesmo dia:** a limitação ao saldo do dia foi desfeita a pedido do usuário. A HE considerada voltou a ser a soma das colunas EXTRA (no exemplo, 38 min; total de 69.015 h na base de 16/08 a 15/09/2026). O bloco "Horas geradas e compensadas" foi mantido.

### Horas Extras: negativos que a planilha não traz (11/11/2026)
- **Motivo:** chapa 12690 em 19/08/2026: HTRAB 09:22 está correto; faltou o atraso de 16 min na entrada (EXTRA ENTRADA vem 00:00 porque a planilha só registra o lado positivo). Com ele, entrada −00:16 + almoço 00:12 + saída 00:26 = 00:22.
- **Regra:** nos dias de 2 ou 4 batidas com horário previsto (HBASE > 0), entram com sinal contrário, medidos pelas batidas contra o previsto: atraso na entrada, almoço mais longo que o previsto e saída antes do previsto. As colunas EXTRA da planilha continuam como o lado positivo.
- **Dia sem HE:** se a soma das três partes é zero ou negativa, o dia não conta HE e o valor vira hora a compensar. A tolerância de 10 min continua valendo.
- **Efeito na base de 16/08 a 15/09/2026:** HE total de 63.092 h (antes 69.015 h): entrada 5.458 h, almoço 1.055 h, saída 56.579 h; 4.877 h de dias abaixo da base.

### Horas Extras: dia sem jornada prevista (11/11/2026)
- **Motivo:** chapa 12690 em 29/08/2026 (sábado, HBASE 00:00, batidas 08:14 e 11:31, HTRAB 03:17): a planilha lançou EXTRA SAIDA2 = 11:31, porque mede a saída contra o previsto 00:00 e acaba lançando o horário do relógio como duração.
- **Regra:** em dia de 2 ou 4 batidas com HBASE = 00:00 e HTRAB > 0, a HE do dia é o HTRAB, lançado na saída (entrada e almoço zerados). A tolerância de 10 min e os negativos continuam valendo para os demais dias.
- **Efeito na base de 16/08 a 15/09/2026:** HE total de 62.039 h (antes 63.092 h): entrada 5.180 h, almoço 1.025 h, saída 55.834 h.

### Horas Extras: total líquido (11/11/2026)
- **Decisão:** a HE considerada passa a ser líquida: cada dia soma as partes com sinal (entrada, almoço, saída), e o dia abaixo da base fica negativo e abate a HE do colaborador. Quem termina o período com valor negativo tem saldo a compensar e aparece no ranking (barra vermelha) e no card "Com saldo a compensar".
- **Mantido:** tolerância de 10 min (dia dentro dela não conta nem positivo nem negativo) e, em dia sem jornada prevista (HBASE 00:00), HE = HTRAB.
- **Efeito na base de 16/08 a 15/09/2026:** HE considerada líquida de 57.414 h (entrada 4.725 h, almoço 673 h, saída 52.016 h).

### Horas Extras: jornada prevista parcial (11/11/2026)
- **Motivo:** chapa 25545 em 03/10/2026 (sábado, previsto 08:00 às 12:00, HBASE 04:00, batidas 07:55 e 17:02, HTRAB 09:07): a planilha lançou EXTRA SAIDA2 = 17:02, porque mede a saída contra a última posição do previsto (00:00) e lança o horário do relógio como duração. O sistema somava 17:07 de HE; o correto é 05:07 (saldo do dia).
- **Regra:** quando o previsto só tem as primeiras posições (a última vem 00:00) e HBASE > 0, a entrada é medida contra a primeira entrada prevista e a saída contra a última saída prevista (12:00 no exemplo), ambas com sinal. Almoço fica zerado.
- **Efeito:** 3.881 dias com jornada parcial nas duas bases carregadas (16/08 a 15/10/2026); cerca de 43.200 h a menos que as colunas da planilha lançavam; HE líquida total de 91.113 h nessas duas bases.

### Horas Extras: cálculo da análise no servidor (11/11/2026)
- **Motivo:** a página baixava todas as batidas (66 mil linhas, 12 chamadas) a cada abertura e calculava no navegador; o tempo crescia a cada período novo.
- **Decisão:** o cálculo da HE passou para o servidor, em SQL (`api/he-analise.js`). A página envia o período, a tolerância e a lista de chapas que passaram nos filtros de filiação e na busca, e recebe só os totais prontos (por colaborador, por semana e por dia da semana). O detalhe dia a dia de um colaborador é buscado ao clicar nele.
- **Uma só fonte das regras:** as regras do dia (HBASE zero, jornada parcial, negativos, tolerância, total líquido) ficam na consulta `DIA_SQL`. A cópia em JavaScript na página (`diaHE`) não é mais usada nos totais.
- **Validação:** o resultado em SQL foi comparado com o cálculo em JavaScript, colaborador por colaborador, sobre a base inteira: 16.100 valores, 0 divergências. A consulta da base toda leva cerca de 1 s.

### Horas Extras: reinício da base com saldo de abertura (11/11/2026)
- **Decisão do usuário:** a base passa a partir do último fechamento do banco de horas, com o saldo pré-existente de cada colaborador, mais os períodos seguintes (16 a 15). As cargas de teste foram removidas.
- **Apagado do Neon (com confirmação):** 66.876 batidas (16/08 a 15/10/2026), 4 ajustes de batidas e o registro de 4 cargas de batidas. Mantidos: o cadastro do base-resumo (1.074 chapas, carga 3) e os parâmetros (`he_config`). Banco de horas e premissas já estavam vazios.
- **Próximo passo:** carregar o banco de horas do último fechamento (saldo de abertura) e as batidas dos períodos seguintes; o saldo acumulado de cada colaborador passa a ser saldo de abertura + HE líquida dos períodos posteriores.

### Horas Extras: banco de horas (RM) e estrutura "Banco Dinâmica" (11/11/2026)
- **Fonte:** planilha de controle `banco de horas.xlsx`, aba "Banco de Horas" (exportação do RM por chapa e centro de custo, com os campos EXTRA/FALTA/ATRASO/SALDO do período anterior e do atual). A aba "Banco Dinâmica" é calculada a partir dela.
- **Guardado no Neon (`he_banco`):** cada posição do banco tem uma data de referência (não precisa ser dia 15; pode ser uma atualização no meio do período, ex.: 01/11/2026). Reenviar a mesma data atualiza onde mudou e registra a correção. Primeira posição carregada: 01/11/2026, 543 linhas, 530 colaboradores. O período anterior está zerado porque o banco foi zerado; o período atual traz os dados de 16/10 a 01/11.
- **Estrutura da Banco Dinâmica (replicada na tela e em `api/he-analise.js`, ação `banco`):** por colaborador, somando os centros de custo: realizadas = EXTRA (anterior e atual); atrasos = FALTA + ATRASO; saldo = realizadas − atrasos (zero se negativo); horas positivas = max(realizadas − atrasos dos dois períodos, 0); horas negativas = max(atrasos − realizadas dos dois períodos, 0).
- **Validação:** a coluna "Sistema" traz a HE líquida calculada pelas batidas do período (de 16 a 15, até a data de referência), para conferir com o que o RM traz; a diferença por colaborador é mostrada e pode ser filtrada.
- **Conferido contra a planilha:** chapa 12390 (24:49 − 01:04 = 23:45 positivas) e chapa 12613 (05:29 − 40:18 = 34:49 negativas).

- **Correção (11/11/2026):** a aba "Banco de Horas" desse arquivo só traz 530 chapas (543 linhas), mas a aba **Banco Dinâmica** traz **1.076 colaboradores**; os outros 546 existem só nos valores da Dinâmica. Por isso a estrutura guardada passou a ser a própria Banco Dinâmica: tabela `he_banco_din` (uma linha por colaborador e data de referência: anterior e atual com realizadas, atrasos e saldo, mais horas positivas e negativas, em minutos), carga tipo `bancodin`, correções registradas em `he_banco_ajustes` (centro de custo `DIN`). Primeira posição: 01/11/2026, 1.076 colaboradores, 15.375 h positivas e 1.345 h negativas. O bloco 9 da Análise lê dessa tabela. A exportação do RM por centro de custo (`he_banco`) segue guardada à parte (530 chapas).
- **Erro de preenchimento na planilha (11/11/2026):** três chapas (12848, 12492, 12509) vinham com horas positivas 00:00 na Banco Dinâmica, mas o saldo atual estava correto (11:27, 23:07, 21:47). Decisão do usuário: o saldo vale. A carga do banco dinâmica agora mantém o valor da planilha quando ele bate com as fórmulas (tolerância de 1 minuto, por causa das horas decimais) e usa a fórmula quando o valor estiver fora disso. As três chapas foram corrigidas (positivas = saldo) e a correção ficou registrada em `he_banco_ajustes`. Total de positivas: 15.431 h.

### Horas Extras: saldo atual do banco = abertura + movimento (11/11/2026)
- **Decisão do usuário:** a posição do banco de 01/11/2026 é o saldo de abertura; as batidas entram a partir de 02/11. O saldo negativo entra negativo e é **pendência de compensação**.
- **Regra:** abertura = positivas − negativas na data de referência (pode ser negativa); movimento = HE líquida pelas batidas de dias depois da referência (as mesmas regras da análise); saldo atual = abertura + movimento, também em dias (8 h = 1). Batidas até a referência não somam (já estão na posição do banco); servem só para conferir com o RM (colunas "Sistema até a ref." e "Diferença", quando existirem).
- **Onde:** bloco 9 da Análise (`api/he-analise.js`, ação `banco`). Testado com batidas de teste em transação desfeita: abertura −34:49 + movimento 01:30 = −33:19.

### Horas Extras: carga de planilhas no padrão do Gerenciador de Equipes (11/11/2026)
- **Decisão do usuário:** a lógica de implementação e validação das planilhas segue a do Gerenciador de Equipes (`ImportacaoColaboradores.vue` e `processar_planilha_colaboradores`): planilha modelo → **analisar sem gravar** → resumo clicável (novos, atualizados de → para, com erro) → erros por linha bloqueiam a aplicação → **Confirmar e aplicar**.
- **Como ficou:** `api/he-carga.js` ganhou a ação `previa` (só leitura): compara cada lote com o que já está no banco e devolve novos, alterados (campo, de, para), iguais, protegidos (cadastro editado à mão) e as linhas com erro (número da linha da planilha, chapa, nome e motivo). A página lê o número da linha de cada registro; data inválida deixou de ser descartada em silêncio e vira erro da linha. O botão "Confirmar e aplicar" só habilita depois de analisar e sem erros; trocar o arquivo ou a data de referência exige analisar de novo.
- **Planilha modelo:** botões para baixar o modelo de batidas e o do banco dinâmica, com cabeçalho certo, linha de exemplo e aba de instruções.
- **Diferença em relação ao Gerenciador:** lá o arquivo vai inteiro e a aplicação é uma só transação. Aqui o arquivo é enviado em lotes de 1.000 linhas (limite de 4,5 MB da Vercel); cada lote é tudo ou nada e reenviar é seguro (linha igual não muda nada), e como a prévia já barra os erros, a aplicação não deve falhar no meio.
- O módulo e o relatório de indicadores "Medidas Disciplinares" passaram a se chamar "Gestão Administrativa" (só o nome exibido; códigos internos e tabelas não mudaram).
- O acesso passa a ser pedido pela própria pessoa ("Primeiro acesso" na tela de login: nome completo, matrícula, setor, usuário e senha). O pedido fica pendente até um administrador aprovar e definir o nível em cada ambiente (padrão em Gestão Administrativa: Supervisor). Limite de 5 pedidos por hora por IP. A tela Usuários ganhou chaves por ambiente e nível que salvam na hora.
