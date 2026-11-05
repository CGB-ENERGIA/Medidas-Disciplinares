# Plano para a versão real (Supabase)

O protótipo valida telas e regras. Para uso real faltam: banco único, login, sigilo no servidor, arquivos guardados e avisos fora do site.

## 1. O que o Supabase resolve

| Hoje no protótipo | Na versão real |
|---|---|
| Dados só no navegador | Banco PostgreSQL único para todos |
| Sem login | Login com e-mail corporativo (Supabase Auth) |
| Sigilo só na tela | Row Level Security: o banco só entrega o que o perfil pode ver |
| Documentos assinados não ficam guardados | Supabase Storage, com acesso restrito |
| Bases enviadas à mão | Rotina diária (Edge Function agendada) lendo RM/TOTVS, Gerenciador de Equipes e frota |
| Alertas só dentro do site | E-mail ou Teams quando chega ação e quando passa de 10 dias do ocorrido |

## 2. Tabelas sugeridas

- `colaboradores` (chapa, nome, funcao, base, centro_custo, sexo, sexo_origem, ativo, atualizado_em)
- `equipes` (chapa, setor, equipe, tipo_equipe, supervisor_id, coordenador_id)
- `usuarios` (id do Auth, nome, perfil: supervisor/coordenador/dp, chave de supervisor ou coordenador)
- `desvios` (item, descricao, nivel, alinea_sugerida) — Anexo I
- `medidas` (id, codigo MD-xxxx, colaborador, data, desvios, cidade, ponto_referencia, placa, relato, texto, medida, medida_aprovada, alinea, dias, inicio, status, solicitante_perfil, solicitante_id, motivo_recusa, motivo_cancelamento, origem: sistema/planilha)
- `medidas_historico` (medida_id, data_hora, usuario_id, acao) — **só inserção**, nunca editar ou apagar
- `medidas_arquivos` (medida_id, tipo: foto/evidencia/documento/assinado, caminho no Storage, posicao, legenda)
- `frota` (placa, modelo, tipo, base, prefixo, ativo)

## 3. Regras de acesso (RLS)

- Supervisor: medidas de colaboradores cuja equipe tem ele como supervisor.
- Coordenador: medidas das equipes em que ele é coordenador.
- DP: tudo.
- Escrita por etapa: só o perfil responsável pela etapa muda o status (autorizar = coordenador; elaborar/arquivar = DP; aplicar = quem solicitou).

## 4. Ordem sugerida

1. Piloto de validação do protótipo com o DP e 1 ou 2 coordenadores.
2. Validar com DP e Jurídico: textos dos documentos, regras de reincidência, prazos e enquadramento CLT.
3. Criar projeto Supabase, tabelas e RLS; importar bases e histórico (CSVs da pasta `dados/`).
4. Ligar o site ao Supabase (login, leitura e gravação).
5. Storage para fotos, evidências e assinados.
6. Rotina diária das bases e avisos por e-mail/Teams.
7. Piloto com uma base, depois todas.

## 5. Pendências de negócio

- Incluir a coluna **SEXO** no relatório de colaboradores do RM.
- Confirmar com o DP o "vem, comunicar" do modelo de ponto manual (os outros documentos usam "vem, por meio desta, comunicar").
- Confirmar se o documento precisa da linha "Ciente em ___/___/___".
- Definir prazo de guarda dos dados (LGPD) e quem acessa.
- Indicadores específicos do coordenador (próximo passo do protótipo).
