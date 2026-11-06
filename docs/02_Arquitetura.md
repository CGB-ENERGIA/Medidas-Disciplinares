# Arquitetura

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
| `GET /api/carga` | logado | Colaboradores, histórico e solicitações da equipe de quem está logado |
| `GET /api/referencias` | logado | Bases, Anexo I, modelos de texto, municípios e frota |
| `GET/POST/PATCH /api/solicitacoes` | logado | Lista, abre, cria e avança o fluxo |
| `GET /api/arquivo?id=` | logado | Baixa o documento assinado |
| `GET/POST/PATCH /api/usuarios` | DP | Cadastro e edição de usuários |
| `PATCH /api/colaboradores` | DP | Confirma o sexo (Sr./Sra.) |
| `GET /api/saude` | público | Confere se a API está no ar |

## O que o servidor confere
- **Equipe:** supervisor vê só a equipe dele, coordenador as equipes dele e o DP tudo (vale para leitura, criação, fluxo e arquivos).
- **Etapa inicial:** pelo perfil de quem abre (supervisor → coordenador; coordenador e DP → DP).
- **Quem faz cada passo:** autorizar e recusar (coordenador); elaborar, arquivar e devolver (DP); aplicar (quem solicitou ou o DP); cancelar (regras da política).
- **Conflito:** se a solicitação mudou desde que a tela leu, o passo é recusado e a tela pede para recarregar.
- **Histórico:** cada passo grava quem fez em `medidas_historico`, tabela que não aceita alteração nem exclusão.
- **Login:** senha com scrypt, bloqueio de 15 minutos após 5 erros, troca obrigatória da senha temporária; trocar a senha encerra as outras sessões.
