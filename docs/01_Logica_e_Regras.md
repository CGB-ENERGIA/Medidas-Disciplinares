# Lógica e regras do sistema

## 1. Perfis

| Perfil | O que faz | O que vê |
|---|---|---|
| **Supervisor** | Solicita medidas da equipe e aplica as que solicitou | Só a própria equipe |
| **Coordenador** | Autoriza ou recusa as solicitações dos supervisores; também solicita (sem autorização) e aplica as próprias | Só as equipes dele |
| **DP** | Elabora o documento, pode editar tudo, arquiva; também solicita (sem autorização) e aplica as próprias | Todas as bases |

Regra central: **quem solicita é quem aplica.**

A visão por pessoa vem da estrutura de equipes (base-resumo do Gerenciador de Equipes): chapa → setor, equipe, tipo de equipe, supervisor e coordenador. Colaboradores indiretos ficam ligados ao gestor responsável.

## 2. Fluxo e status

| Ordem | Status | Com quem está |
|---|---|---|
| 1 | Aguardando autorização | Coordenador (só quando o supervisor solicita) |
| 2 | Aguardando elaboração | DP |
| 3 | Aguardando aplicação | Quem solicitou (é a etapa de "pendente de assinatura") |
| 4 | Aguardando arquivamento | DP (confere o assinado, lança no TOTVS e no Guadix/CDOC) |
| 5 | Concluída | — |
| — | Recusada | Encerrada pelo coordenador, com motivo |
| — | Cancelada | Encerrada a qualquer momento, com motivo |

- Solicitação do coordenador ou do DP pula a autorização e vai direto para a elaboração.
- Em "Aguardando arquivamento", o status aparece como **Concluída** para supervisor e coordenador e como **Aguardando arquivamento** para o DP.
- O DP pode **pedir correção** do documento assinado: a medida volta para "Aguardando aplicação" com o motivo.

### Cancelamento

- DP: em qualquer etapa aberta.
- Coordenador: depois de autorizar (antes disso ele recusa).
- Quem solicitou: enquanto o documento ainda não foi elaborado.
- Motivo obrigatório. Fica no histórico, não conta para reincidência nem para os indicadores, e avisa na Caixa de entrada quem participou.

## 3. Nova solicitação (5 passos)

1. **Colaborador**: busca por nome ou chapa (só aparecem os que a pessoa pode ver e que estão ativos).
2. **Ocorrência**: data (obrigatória), cidade (217 municípios do MA, opcional; em branco usa a cidade da base), ponto de referência, veículo/placa (frota ativa, mostra só a placa), fotos (até 6).
3. **Desvio**: palavras-chave e busca nos itens do Anexo I. Pode marcar mais de um; vale o mais grave (5.2).
4. **Relato**: texto livre ou ditado. Gera o texto formal (IA ou modelo). Modelo de texto da empresa escolhido pelas palavras do relato; a pessoa pode trocar ou usar "só o relato".
5. **Revisão** e envio.

O texto do fato **termina no fato**, sem citar o Anexo I nem a medida. Exemplo: "Em 03/11/2026, V.Sa. deixou de comparecer às suas atividades laborais sem apresentar qualquer justificativa."

Prazo recomendado: aplicar em até **15 dias** do ocorrido (risco de perdão tácito). O site avisa quando passa disso.

## 4. Sugestão de medida (Política de Consequências PG.001.SGI 019)

| Nível | 1ª ocorrência | 2ª ocorrência (5.1.1, penalidade dobrada) |
|---|---|---|
| Leve | Advertência por escrito | Suspensão de 1 dia (passa a ser tratada como Média) |
| Média | Suspensão de 1 dia | Suspensão de 2 dias |
| Grave | Suspensão de até 3 dias | Suspensão de até 6 dias |
| Gravíssima | Suspensão de 5 dias | Suspensão de 10 dias ou desligamento |

- **3ª ocorrência ou mais (5.3):** o desvio sobe um nível e recebe a penalidade de reincidência do novo nível.
- **Mesmo desvio:** a reincidência conta só o **mesmo item do Anexo I** nos últimos 12 meses.
- **Só medidas do sistema:** o histórico importado das planilhas aparece para consulta (com a descrição do que aconteceu), mas **não entra no cálculo**.
- Recusadas, canceladas e reorientações não contam.
- O cartão da sugestão mostra: situação (1ª, reincidência, agravada), medida padrão × medida a aplicar, régua de reincidência, ocorrências que contam, outras medidas do colaborador, histórico antigo e base legal.
- Enquadramento: art. 482 da CLT, alínea sugerida pelo item (o DP pode trocar).

## 5. Elaboração pelo DP

O DP pode editar **tudo**, e cada alteração vai para o histórico ("Editou medida: de X para Y"):

- colaborador, data, desvio, medida (qualquer uma), cidade, ponto de referência, placa;
- alínea do art. 482, dias e início da suspensão (máximo legal de 30 dias);
- tratamento: Ao Sr. / À Sra. × advertido / suspenso (trocar advertido/suspenso troca a medida);
- texto do fato;
- evidências (prints e fotos) no documento.

### Modelo de ponto manual

Quando o desvio é o item 8 e o caso é marcação manual do ponto, o documento segue o modelo do DP (`modelos/Modelo_DP_Ponto_Manual.docx`):

- "…em conformidade com o art. 482, alínea "h", da CLT, tendo em vista que **no dia** X (ou **nos dias** X, Y e Z) realizou a marcação do ponto de forma manual…";
- "…pois é papel do colaborador registrar corretamente todos os horários realizados durante a jornada de trabalho."

O DP informa uma ou mais datas e pode trocar entre o modelo padrão e o de ponto manual.

### Evidências

- Até 4 imagens por documento: botão, arrastar ou **Ctrl+V** (print).
- Posição: logo após o texto do fato, antes da assinatura ou em página de anexo.
- Legenda opcional. As fotos enviadas por quem solicitou podem ser usadas com um clique.
- Também dá para inserir na etapa de aplicação, antes de baixar.

### Documento

- Sai em **PDF**, gerado pelo próprio site: timbre da CGB em cada página, entrelinha 1,5, assinatura e testemunhas na mesma página.
- Tratamento Sr./Sra.: vem do campo **sexo** do colaborador (cadastro com coluna SEXO, ou confirmado pelo DP). Sem isso, é deduzido pelo primeiro nome e marcado como "deduzido".

## 6. Aplicação e arquivamento

- Quem aplica baixa o PDF, colhe a assinatura (ou 2 testemunhas se o colaborador recusar, item 5.4) e anexa foto ou PDF do assinado.
- O DP confere, lança no TOTVS (RM), posta no Guadix/CDOC e conclui. Ou pede correção.

## 7. Caixa de entrada

Mensagens geradas pelo histórico de cada medida. O supervisor recebe só: Documento para aplicação, Solicitação autorizada, Correção do documento, Solicitação recusada e Medida cancelada. Não existe notificação de "Medida concluída".

## 8. Painel (Consulta → Painel)

1. **Alertas "Precisa da sua ação"** por perfil, com cor por dias do ocorrido (até 7 verde, 8 a 12 amarelo, 13+ vermelho).
2. **Pendências do último passo:**
   - Supervisor e coordenador: **Medidas pendentes de aplicação** (total, atrasadas +15 dias, vencendo 8 a 15, média de dias com quem aplica), por supervisor ou lista própria.
   - DP: **Documentos assinados pendentes** (sistema + planilhas antigas), por coordenador e supervisor, com faixas de tempo e detalhe por supervisor.
   - Botão **Visão para print** para mandar por e-mail.
3. **Indicadores** (abrir/fechar, filtro de período):
   - **Supervisor:** aplicadas no prazo, tempo médio para aplicar, medidas da equipe, colaboradores em atenção, % recusadas; gráficos da equipe, qualidade das solicitações (recusas, ajustes, correções, motivos), desvios mais comuns (tema de DDS), top 5 colaboradores, colaboradores em atenção.
   - **Coordenador:** visão das equipes dele (versão específica do coordenador ainda a fazer: tabela por supervisor, medidas por 100 colaboradores, SLA de autorização, gravidade).
   - **DP:** visão da empresa (bases, funções, centros de custo, comparativo anual, documentos pendentes, reincidência alta), prazo de aplicação e exportação em PowerPoint.

## 9. Sigilo

- Supervisor: só a própria equipe; sem comparativos.
- Coordenador: só os supervisores dele.
- Só o DP: ranking por base, empresa inteira, desligamentos, recusas de assinatura, banco de dados, exportação e atualização de bases.
- No protótipo o sigilo é só na tela. Na versão real tem que ser no banco (ver documento 02).

## 10. Banco de dados e bases (DP)

- Exportação completa em Excel e CSV: medidas, fluxo, colaboradores, Anexo I e dicionário.
- **Atualizar bases:** o DP envia o cadastro do RM, a base-resumo de equipes e a planilha da frota. O site mostra quem entrou, saiu ou mudou antes de aplicar. Quem sai some das novas solicitações, mas o histórico fica. Do cadastro, o site lê só chapa, nome, função, seção, situação e sexo.

## 11. Como funciona hoje

- Login por usuário e senha; todos os perfis veem todas as bases e equipes. O perfil define o que cada um faz no fluxo.
- O DP cria, edita, desativa e exclui usuários; a lista fica separada por perfil.
- As solicitações e cada passo do fluxo ficam no banco; a tela se atualiza sozinha a cada minuto.
- Cadastro, equipes e frota vêm do banco; a atualização é feita pela importação (`npm run db:importar`), não pelo navegador.
- O Sr./Sra. confirmado pelo DP fica no cadastro do banco.
- O texto formal com IA só funciona dentro do claude.ai; fora dele o sistema usa o modelo de texto.
