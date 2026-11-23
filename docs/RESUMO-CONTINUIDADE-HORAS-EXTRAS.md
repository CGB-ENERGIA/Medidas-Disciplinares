# Resumo para continuar — módulo Horas Extras (Medidas Disciplinares)

## Onde está
- Pasta do projeto: `C:\Users\Micro\OneDrive - CGB ENERGIA LTDA\SETOR DE MEDIÇÃO\Projetos\Sistemas\Gestão Administrativa`
- GitHub: https://github.com/CGB-ENERGIA/Medidas-Disciplinares (branch `main`, último commit publicado `061eddb`; a Vercel faz o deploy sozinha)
- Banco: Neon (o mesmo em desenvolvimento e produção). Credenciais só no `.env` (não vai para o GitHub).
- Servidor local: `npm run dev` (porta 3000). Reiniciar depois de mudar a API.

## Arquivos principais
- `site/horas-extras.html` — página do módulo (Análise, Cadastro, Carga). Aberta em quadro dentro de `site/index.html`.
- `site/index.html` — menu, login, aba Usuários (campo Horas Extras: Analista / Gestor).
- `api/he-analise.js` — regras do dia em SQL (`DIA_SQL`) e ações `resumo`, `dias`, `quando`, `banco`.
- `api/he-carga.js` — carga de batidas, cadastro e banco dinâmica (prévia e aplicar, trilha de auditoria).
- `api/he-cadastro.js` — edição de vínculos (só gestor). `api/he-dados.js` — leituras (resumo, cargas, meses com batidas).
- `api/_lib/bases.js` — nome padrão das bases (BCB→BACABAL etc.). `api/_lib/auth.js` — login e níveis. `api/usuarios.js` — gestão de usuários (só admin).
- `banco/liberar-horas.mjs`, `banco/criar-usuario.mjs`, `banco/schema.sql`.

## Regras já decididas
- Tolerância de 10 min em |HTRAB − HBASE|; HE do dia é líquida (pode ser negativa = saldo a compensar).
- Dia sem escala (HBASE 00:00): HE = HTRAB. HBASE > 0 sem previsto: HTRAB − HBASE.
- 8 h = 1 dia de folga. Jornada = soma dos turnos; 2 batidas = saída − entrada, sem desconto de almoço.
- Banco: saldo atual = saldo de abertura (01/11/2026) + HE líquida das batidas depois dessa data.
- Acesso: admin NÃO ganha Horas Extras sozinho; precisa de nível na aba Usuários. Todos veem todas as bases.

## Feito nesta etapa (tudo publicado)
- Acesso por nível na aba Usuários; rótulos de "testes" removidos.
- Usuário `administrador` criado no banco (admin + gestor de HE), senha igual ao login: trocar por senha forte.
- Carga: período das batidas por mês; modelo de batidas com as 49 colunas do banco na ordem da exportação; área de importação separada dos botões de modelo.

## Pendências / ideias
- Não testado no navegador: aba Carga (prévia/aplicar), modelo novo, link do nome no modal indo ao banco de horas (bloco 9).
- Auditoria: bloqueio no servidor de linhas inválidas no `lote`; contas genéricas; banco de testes separado; 44+23 chapas sem cadastro; escopo por supervisor (descartado por ora).
- Cartão "Dias com batidas ímpares" ainda sem lista.

## Aviso "Artifact comment monitor"
Vem da sessão antiga (artefatos já apagados). Não afeta nada; some abrindo sessão nova.
