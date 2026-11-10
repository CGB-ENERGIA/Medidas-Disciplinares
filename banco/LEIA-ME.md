# Banco de dados (Neon)

## Arquivos

| Arquivo | O que faz |
|---|---|
| `schema.sql` | Cria as tabelas. Pode rodar de novo sem problema: só cria o que ainda não existe. |
| `importar-core.mjs` | Lê os CSVs de `dados/` e grava no banco, tudo numa transação. Se der erro, nada é gravado. |
| `rodar.mjs` | Comandos `testar`, `schema` e `importar`. |
| `importar-contratacoes.mjs` | Importa os dados do site de Contratações antigo (`npm run ct:importar`). |
| `contratacoes-exportar-antigo.js` | Trecho para colar no console do site antigo e baixar tudo num .zip. |

## Passo a passo

1. Criar o projeto no Neon (região **AWS São Paulo / sa-east-1**).
2. Copiar `.env.example` para `.env` (na pasta `Medidas Disciplinares`) e colar a connection string em `DATABASE_URL`.
3. Rodar, nesta ordem, dentro da pasta `Medidas Disciplinares`:
   - `npm install` (só na primeira vez)
   - `npm run db:testar`: confere a conexão
   - `npm run db:schema`: cria as tabelas
   - `npm run db:importar`: importa as bases e o histórico

## Como a importação se comporta

- Bases, gestores, Anexo I, modelos de texto e municípios são atualizados se já existirem.
- Colaboradores e frota: quem saiu da planilha fica com `ativo = false`. Ninguém é apagado, e o histórico continua.
- O histórico antigo das planilhas é importado **uma vez só**. Se já estiver no banco, é pulado (para não duplicar nem gastar números MD-xxxx).
- O `medidas_historico` não aceita alteração nem exclusão (trava no próprio banco).

## Tabelas

`bases`, `gestores`, `colaboradores`, `equipes`, `usuarios`, `desvios`, `modelos_texto_fato`, `municipios`, `frota`, `medidas`, `medidas_historico`, `medidas_arquivos`.

Módulo Contratações: `ct_docs` (documentos em JSON: candidatos, vagas, rm, config, talentos, talentosEd), `ct_arquivos` e `ct_log`.

Na tabela `medidas`, `origem = 'sistema'` são as medidas criadas no site, que contam para sugestão e reincidência. `planilha` e `ponto` são o histórico antigo, só para consulta.

## Trazer os dados do site de Contratações antigo

Faça isso uma vez, depois que o módulo estiver publicado. Os dados têm nomes e currículos de pessoas: use só computador e pasta de acesso restrito.

**1. Exportar, no site antigo**
1. Abra o site de Contratações antigo, entre e espere carregar tudo.
2. Aperte **F12** (ferramentas do navegador) e vá na aba **Console**.
3. Se o site estiver dentro de um quadro, no seletor de contexto do console (canto superior, "top") escolha o quadro do site.
4. Abra o arquivo `banco/contratacoes-exportar-antigo.js`, copie tudo, cole no console e aperte Enter.
5. O console mostra o andamento (documentos por coleção e arquivos). No fim o navegador baixa **contratacoes-exportacao.zip**. Só lê: não altera nada no site antigo.

**2. Importar, aqui**
1. Descompacte o .zip numa pasta **fora do repositório** (por exemplo `C:\contratacoes-exportacao`). Dentro devem estar `dados.json`, `arquivos.json` e a pasta `arquivos`.
2. Na pasta do projeto, confira sem gravar:
   `npm run ct:importar -- --pasta "C:\contratacoes-exportacao" --simular`
3. Se os números batem com o site antigo, importe de verdade:
   `npm run ct:importar -- --pasta "C:\contratacoes-exportacao"`
4. Abra Contratações → Painel e compare os totais de vagas, candidatos e banco de talentos com o site antigo. Pode rodar a importação de novo sem duplicar nada.
5. Quando estiver tudo conferido, apague a pasta descompactada e o .zip.

O site antigo continua funcionando até você decidir desligá-lo. Arquivos acima de 4 MB entram, mas o download pelo site pode falhar (limite da Vercel); o importador avisa.
