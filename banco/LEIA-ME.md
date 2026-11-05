# Banco de dados (Neon)

## Arquivos

| Arquivo | O que faz |
|---|---|
| `schema.sql` | Cria as tabelas. Pode rodar de novo sem problema: só cria o que ainda não existe. |
| `importar-core.mjs` | Lê os CSVs de `dados/` e grava no banco, tudo numa transação. Se der erro, nada é gravado. |
| `rodar.mjs` | Comandos `testar`, `schema` e `importar`. |

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

Na tabela `medidas`, `origem = 'sistema'` são as medidas criadas no site, que contam para sugestão e reincidência. `planilha` e `ponto` são o histórico antigo, só para consulta.
