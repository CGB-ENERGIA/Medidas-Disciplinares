# Central Administrativa CGB: 4 ambientes do Sistema de Gestão Administrativa

A Central (antes um Artifact do Claude) agora faz parte do site `https://medidas-disciplinares.vercel.app` como **4 ambientes** na tela "Onde vamos trabalhar hoje?": **Financeiro** (hospedagem, alimentação, locação e produtividade da equipe), **Patrimônio**, **Atendimento** (Fale Conosco) e **Tecnologia (TI)**. Mesmo login, mesmo menu do perfil, mesmo banco Neon.

## Para publicar (uma vez)

Na pasta do projeto (Gestão Administrativa), no terminal:

1. `npm run central:tabelas` → cria só as tabelas novas da Central (`ca_carga`, `ca_docs`, `ca_arquivos`) e as colunas de acesso. Não mexe no resto do banco e pode rodar de novo sem problema.
2. `npm run central:banco` → manda os dados da Central para o Neon (separados por área) e importa os 6 lançamentos que estavam no Artifact.
3. Publicar como sempre (commit + push). Vão junto: `site/central.html` (**sem dados**), `site/ca-adaptador.js`, `api/ca-*.js`, `api/_lib/ca.js` e as mudanças em `site/index.html`, `api/usuarios.js`, `api/_lib/auth.js` e `banco/schema.sql`.
4. No site, **Usuários**: ligar Financeiro, Patrimônio, Atendimento e/ou TI para cada pessoa (Consulta ou Gestor). O administrador já tem as quatro.

## Para atualizar os dados depois

Quando o Claude entregar uma Central nova (dados novos), troque `central-administrativa/site/central.html` pelo arquivo novo e rode:

1. `npm run central:site` → gera `site/central.html` sem dados.
2. `npm run central:banco` → atualiza os dados no Neon.
3. Publicar (commit + push).

As planilhas enviadas pela tela **Banco de dados** e os lançamentos feitos no site já vão direto para o Neon: não precisa fazer nada.

---

## 1. O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `site/central.html` | **A Central completa, com os dados** (~8,7 MB). Fica **só no computador** (está no `.gitignore`): é a entrada do `publicar.mjs`. |
| `publicar.mjs` | `site`: gera o `site/central.html` do projeto sem dados. `banco`: manda os dados de cada área para o Neon. |
| `fonte/` | Código-fonte para reconstruir o `central.html` (veja a seção 5). |
| `fonte/dados/` | Dados já tratados que vão embutidos no site: hospedagem, alimentação, metas, patrimônio, Fale Conosco, TI e locação. |
| `fonte/extracao/` | Scripts que geraram esses dados a partir das planilhas. |
| `fonte/testes/` | `t_full.py` (abre todas as telas e procura erros) e `audit.py` (procura tabelas cortadas). |
| `banco-exportado/` | **Tudo o que estava no banco do Artifact** em 23/11/2026, mais a "sal" da locação. **Tem dados pessoais. Não vai para o GitHub** (já está no `.gitignore`). |
| `kit-layout/` | Kit visual (CSS + gráficos + exemplo + guia) para reaproveitar o padrão em outros módulos. |

## 2. Áreas da Central

Administrativo (tela de Início) · Hospedagem/Alimentação · Controle de Locação (aluguel, água, energia, cadastro de imóveis) · Patrimônio · Fale Conosco · Setor de TI (custos, financeiro, notas, novas aquisições) · Banco de dados · Produtividade da equipe (só administrador) · Como usar · Sugestões e dúvidas.

Também tem: painel de detalhe ao clicar em qualquer indicador, gráficos próprios por área, tema claro e escuro, botão "?" com ajuda da tela e tour guiado.

## 3. Como funciona no site

- **Uma página para as 4 áreas:** cada cartão abre `central.html?area=financeiro|patrimonio|atendimento|ti` num quadro dentro do site. O menu da Central mostra só as telas da área, mais **Como usar** (com a ajuda da área) e **Sugestões e dúvidas**.
- **Dados:** `site/central.html` não tem dados. Ao abrir, o `ca-adaptador.js` busca `/api/ca-carga?area=...` (só depois do login e só se a pessoa tem aquela área). Na carga de uma área, os dados pessoais das outras áreas vão em branco.
- **O que a Central usava do Artifact** (`window.claude.use`) agora é o `ca-adaptador.js`, por cima de `/api/ca-docs` (lançamentos), `/api/ca-arquivos` (PDF/XML das notas de TI) e `/api/ca-carga`.
- **Quem pode o quê** (conferido no servidor, `api/_lib/ca.js`):

| Coleção | Área | Consulta | Gestor |
|---|---|---|---|
| `hlan`, `loc_imv`, `loc_link`, `cfg`, `partes` | Financeiro | lê | lê e grava |
| `fc_at` | Atendimento | lê | lê e grava |
| `ti_notas`, `ti_cfg`, `ti_aquis` | TI | lê | lê e grava |
| `eqp` (Produtividade da equipe) | só administrador | não | não |
| `sug` (Sugestões e dúvidas) | todas | lê e grava só a sua | lê e grava só a sua (o administrador vê e responde todas) |
| `faq` (dúvidas publicadas) | todas | lê | lê (o administrador publica) |

- **A nota 961** do Setor de TI tinha o PDF anexado no Artifact. O arquivo está em `banco-exportado/NFe-961_CGB.pdf`: anexe de novo pela tela da nota.

## 4. Atenção: dados pessoais

- `site/central.html` desta pasta (a versão completa) tem nomes de colaboradores, locadores e endereços. **Não tem CPF, CNPJ nem telefone.** Fica fora do GitHub (`.gitignore`); o que vai para o site é a versão sem dados.
- `banco-exportado/` tem nomes de colaboradores e a **sal da locação** (`sal-locacao.txt`). A sal protege o nome dos locadores no cruzamento com o Contas a Pagar: guarde junto com este pacote e **nunca** publique.
- `fonte/dados/` (dados já tratados) também fica fora do GitHub.

## 5. Como reconstruir o `central.html` a partir da fonte

Na pasta `fonte/` (Python 3):

```
cp app_backup7.html app.html
python patch_portal.py
python patch_ti.py
python patch_hosp.py
python build.py
```

Isso gera `central-hospedagem.html`. Para conferir: `python testes/t_full.py` (precisa de `pip install playwright` e `playwright install chromium`); o resultado esperado é `ERROS: 0`.

Para atualizar a locação com um BD Contas a Pagar novo: `extracao/extrai_loc.py` lê `loc_in2/loc.xlsx`, `bd_in/cp.xlsx` e a sal em `loc/.sal` (copie `banco-exportado/sal-locacao.txt` para `fonte/loc/.sal`).

## 6. Padrão visual

Fonte Plus Jakarta Sans; vinho `#3d0812 → #6a1222 → #8d1d31` com brilho `#b0283f`; fundo cinza leve `#e7e5e6`; cartões gelo `#fcfafb`; situação verde `#2e8b3e`, laranja `#d99a1e` e vermelho `#c0392b`. Detalhes no `kit-layout/GUIA-DE-LAYOUT.md`. O sistema publicado já usa a mesma família de vinho, então a Central combina com ele.
