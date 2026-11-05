# Sistema de Medidas Disciplinares · CGB

Protótipo do fluxo de medidas disciplinares (supervisor → coordenador → DP → aplicação → arquivamento).
Versão de 05/11/2026.

Endereço do sistema: https://medidas-disciplinares.vercel.app

## Como funciona agora

Os dados pessoais (colaboradores, equipes, gestores e histórico) **não ficam mais dentro do site**.
Eles ficam só no banco (Neon), e o site busca pela API (`/api/carga`) ao abrir.

```
site (navegador) → API (pasta api/, na Vercel) → banco Neon
```

## Login e níveis de acesso

- Cada pessoa entra com **usuário e senha** (sem e-mail). A sessão dura 10 horas.
- **Supervisor** vê só a própria equipe; **coordenador**, só as equipes em que é coordenador; **DP** vê tudo. O filtro é feito no servidor (API), não só na tela.
- O DP cria, redefine a senha e desativa usuários na aba **Usuários**. O sistema gera uma senha temporária, e a pessoa cria a própria senha no primeiro acesso.
- Senha: pelo menos 8 caracteres, com letras e números. Após 5 senhas erradas seguidas, o usuário fica bloqueado por 15 minutos.
- **Primeiro usuário do DP** (só uma vez, no terminal, na pasta do projeto):
  `npm run usuario:criar -- --usuario seu.usuario --nome "Seu Nome" --perfil dp`

## Como abrir no seu computador

1. Tenha o arquivo `.env` com a `DATABASE_URL` do Neon (veja `.env.example`).
2. Na pasta do projeto: `npm install` (só na primeira vez) e depois `npm run dev`.
3. Abra http://localhost:3000.

Abrir o `site/index.html` direto (duplo clique) não funciona mais: sem a API, o site mostra "Não foi possível carregar os dados".
Os testes da pasta `testes/` também precisam ser ajustados para usar o endereço do `npm run dev`.

## O que tem em cada pasta

| Pasta | Conteúdo |
|---|---|
| `site/` | O site (`index.html`): telas, regras e modelos de documento, sem dados pessoais |
| `api/` | Funções da API (Vercel) que leem do banco Neon |
| `banco/` | Estrutura do banco (`schema.sql`) e importação dos CSVs (ver `banco/LEIA-ME.md`) |
| `dev/` | Servidor local para testar site + API (`npm run dev`) |
| `docs/` | Toda a lógica do sistema, o plano para a versão real (Supabase) e o histórico das decisões |
| `dados/` | Bases usadas pelo site em CSV (separador `;`): colaboradores, gestores, Anexo I, frota ativa, municípios do MA, histórico importado das planilhas e modelos de texto do fato |
| `modelos/` | Modelo oficial do documento (Word) e o modelo de ponto manual enviado pelo DP |
| `testes/` | Testes automáticos (Python + Playwright) e a planilha com as 79 solicitações de exemplo |
| `scripts/` | Scripts usados para cruzar as planilhas antigas e montar as bases |

## Atenção: dados pessoais

- `dados/colaboradores.csv`, `dados/gestores.csv` e `dados/historico_medidas_importado.csv` têm nomes reais e histórico disciplinar. Guardar só em local com acesso restrito. Eles estão no `.gitignore` e **não vão para o GitHub**.
- O `.env` (senha do banco) também não vai para o GitHub.
- O site não guarda CPF, RG, endereço nem telefone.
- As solicitações de exemplo (79) são **inventadas** sobre colaboradores reais, só para teste.
- O link publicado deve ficar **privado** (menu Compartilhar).

## Documentos

1. `docs/01_Logica_e_Regras.md`: fluxo, perfis, status, regras da política, documentos, painel e indicadores.
2. `docs/02_Plano_Versao_Real_Supabase.md`: o que falta para usar de verdade e como montar.
3. `docs/03_Historico_de_Decisoes.md`: tudo o que foi pedido e decidido no projeto.
