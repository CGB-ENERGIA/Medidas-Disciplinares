# Testes automáticos

Precisam de Python 3 e Playwright (`pip install playwright` e `playwright install chromium`).

- `teste_geral.py`: simula meses de uso (38 solicitações em todas as etapas, perfis, sigilo, caixa de entrada, banco, indicadores, celular). 27 verificações.
- `teste_uso_evidencias.py`: exemplo com 79 solicitações, fotos, prints, PDF, 136 telas, fluxo completo do zero. 17 verificações.

Antes de rodar, troque a variável `SOURCE` no topo de cada arquivo pelo caminho do `site/index.html` no seu computador.
`Solicitacoes_de_exemplo_Medidas_Disciplinares.xlsx` tem as 79 solicitações de exemplo (medidas inventadas).
