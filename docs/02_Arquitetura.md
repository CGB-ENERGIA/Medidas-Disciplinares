# Arquitetura

O site reúne **módulos** (ambientes): **Medidas Disciplinares** e **Contratações**. A pessoa troca de ambiente pelo seletor no topo, que só mostra os módulos a que ela tem acesso.

## Peças
| Peça | Onde | O que faz |
|---|---|---|
| Site | `site/index.html` + `site/modelo-docx.js` (Vercel, pasta de saída `site`) | Telas, regras da política, geração do documento (Word/PDF), indicadores |
| API | `api/*.js` (funções da Vercel, região `gru1`) | Login, carga inicial, fluxo das solicitações, arquivos, usuários, cadastro |
| Banco | Neon Postgres (sa-east-1) | Cadastro, equipes, histórico, solicitações, usuários e sessões |

Teste local: `npm run dev` sobe o site e a API juntos (`dev/servidor-local.mjs`), usando o mesmo banco.

## Rotas da API
| Rota | Quem | Para quê |
|---|---|---|
| `POST /api/login`, `POST /api/logout`, `POST /api/senha`, `GET /api/eu` | todos | Sessão (cookie HttpOnly, 10 h), troca de senha |
| `GET /api/carga` | acesso a Medidas | Colaboradores, histórico e solicitações |
| `GET /api/referencias` | logado | Bases, Anexo I, modelos de texto, municípios e frota |
| `GET/POST/PATCH /api/solicitacoes` | logado | Lista, abre, cria e avança o fluxo |
| `GET /api/arquivo?id=` | logado | Baixa o documento assinado |
| `GET/POST/PATCH/DELETE /api/usuarios` | administrador | Cadastro, edição, exclusão e acessos por módulo |
| `PATCH /api/colaboradores` | gestor de Medidas (DP) | Confirma o sexo (Sr./Sra.) |
| `GET/POST /api/ct-docs` | acesso a Contratações | Documentos do módulo (candidatos, vagas, rm, config, talentos), com as regras por nível |
| `GET/POST /api/ct-arquivos` | acesso a Contratações | Envia e baixa currículos, certificados, documentos e RPs assinadas |
| `GET /api/ct-nomes` | acesso a Contratações | Nome de quem fez cada alteração (histórico dos candidatos) |
| `GET /api/saude` | público | Confere se a API está no ar |

## O que o servidor confere
- **Acesso por módulo:** cada rota diz de qual módulo é (`comLogin`, opção `modulo`, padrão "medidas"); quem não tem acesso a ele recebe 403. As rotas de Contratações usarão `modulo: "contratacoes"`.
- **Administrador:** só ele cria, edita e exclui usuários e dá acessos; age como DP em Medidas e como gestor em Contratações. O sistema não deixa o administrador desativar, excluir ou rebaixar a si mesmo, nem ficar sem nenhum administrador ativo.
- **Equipe:** todos os perfis veem todas as bases e equipes (decisão de 06/11/2026). O filtro fica num lugar só (`escopoEquipe`, em `api/_lib/auth.js`), se um dia voltar a separar.
- **Etapa inicial:** pelo perfil de quem abre (supervisor → coordenador; coordenador e DP → DP).
- **Quem faz cada passo:** autorizar e recusar (coordenador); elaborar, arquivar e devolver (DP); aplicar (quem solicitou ou o DP); cancelar (regras da política).
- **Conflito:** se a solicitação mudou desde que a tela leu, o passo é recusado e a tela pede para recarregar.
- **Histórico:** cada passo grava quem fez em `medidas_historico`, tabela que não aceita alteração nem exclusão.
- **Login:** senha com scrypt, bloqueio de 15 minutos após 5 erros, troca obrigatória da senha temporária; trocar a senha encerra as outras sessões.

## Acessos por módulo
| | Medidas Disciplinares | Contratações |
|---|---|---|
| **Administrador** | age como DP (gestor) | age como Recrutamento (gestor) |
| **Gestor** | DP: elabora, arquiva, banco de dados | Recrutamento: conduz vagas e candidatos |
| **Usuário** | Supervisor (solicita e aplica) e Coordenador (autoriza ou recusa) | Solicitante: vê só o que ele mesmo abriu |
| **Somente leitura** | não existe | Gestão: consulta tudo, sem alterar |

Onde fica guardado (tabela `usuarios`): `admin` (sim/não), `perfil` (Medidas: supervisor, coordenador ou dp; vazio = sem acesso) e `contratacoes` (usuario, gestor ou leitura; vazio = sem acesso). `GET /api/eu` devolve `admin` e `modulos`, que a tela usa para montar o seletor de ambiente e o menu de cada módulo.

## Módulo Contratações
- **Como entra no site:** a página do módulo (`site/contratacoes.html`) roda dentro do site principal, num quadro (iframe) da mesma origem. O menu lateral, o menu do perfil, o tema claro/escuro e o login são os do site principal; o cabeçalho e o menu próprios da página ficam escondidos. Navegar no menu do site muda a tela do módulo, e navegar dentro do módulo (ex.: abrir um candidato) destaca o item certo no menu.
- **Origem do código:** é o site de Contratações original, que rodava na plataforma do Artifact, trazido com poucas mudanças. `site/ct-adaptador.js` implementa por cima da nossa API os recursos que ele usava da plataforma (banco de documentos, arquivos, download e identificação do usuário). A página só é carregada na primeira vez que a pessoa abre Contratações.
- **Dados:** `ct_docs` (documentos em JSON, no mesmo formato do site original), `ct_arquivos` (os arquivos) e `ct_log` (quem gravou o quê, só inserção). A tela busca a cada 15 segundos só o que mudou.
- **Quem pode o quê (conferido no servidor):**
  - Recrutamento (gestor): lê e grava tudo.
  - Gestão (leitura): lê tudo, não grava.
  - Solicitante (usuário): lê só as vagas e candidatos dele (pelo nome do solicitante), as configurações e o resumo do RM; abre vagas só em seu nome; anexa a RP assinada nos candidatos das vagas dele. Não lê o banco de talentos nem a base do RM.
- **Nada é apagado:** "remover" só esconde o documento.
- **Tamanho:** arquivos até 4 MB (limite da Vercel).
- **Dados do site antigo:** `banco/contratacoes-exportar-antigo.js` (roda no site antigo) gera um .zip, e `npm run ct:importar` grava no banco. Veja `banco/LEIA-ME.md`.
