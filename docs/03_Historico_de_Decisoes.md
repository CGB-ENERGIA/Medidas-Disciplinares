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
- Solicitante vê só o que ele mesmo abriu (sem a lista dos 19 solicitantes); Recrutamento e Gestão veem tudo.
- Os dados antigos (candidatos, vagas, talentos, currículos) são migrados por exportação feita no site antigo e importação por script, e não passam pelo chat nem pelo GitHub.
