# Kit de layout CGB — guia de uso

Este é o padrão visual da **Central Administrativa CGB**, pronto para usar em qualquer outro indicador.

## O que vem no pacote

| Arquivo | Para que serve |
|---|---|
| `exemplo.html` | Página de demonstração com **todos os componentes funcionando**. Abra no navegador. É também o melhor modelo para copiar. |
| `css/cgb-kit.css` | Todo o visual: cores, barra superior, hero, cartões, gráficos e painel de detalhe (claro e escuro). |
| `js/cgb-graficos.js` | Biblioteca de gráficos (`VX`), painel de detalhe (`DT`) e fundo animado em rede (`cgbRede`). Sem dependências. |
| `referencia/central-administrativa-cgb.html` | O site completo atual, para consulta. |
| `referencia/cgb-site-completo.css` | Todo o CSS do site (inclui menu, filtros, tabelas), para consulta. |
| `previa-*.png` | Imagens do exemplo nos temas claro e escuro. |

## Como começar um indicador novo

1. Copie `exemplo.html` e renomeie.
2. Troque o título na barra superior e no hero.
3. Apague os gráficos que não usar e troque os dados de exemplo pelos seus.
4. Para o tema escuro funcionar, mantenha o botão que troca `data-tema="escuro"` no `<html>`.

> Para usar os arquivos separados em vez de tudo embutido: `<link rel="stylesheet" href="css/cgb-kit.css">` e `<script src="js/cgb-graficos.js"></script>`.

## Identidade visual

**Fonte:** Plus Jakarta Sans (Google Fonts), com pesos de 400 a 850.

**Cores da marca (vinho)**

| Uso | Cor |
|---|---|
| Vinho profundo (início dos degradês) | `#3d0812` |
| Vinho | `#6a1222` |
| Vinho destaque (botões, links, marcas) | `#8d1d31` |
| Brilho (canto dos degradês) | `#b0283f` |
| Fundo da página (claro) | `#e7e5e6`, um cinza leve |
| Cartões (claro) | `#fcfafb`, gelo |
| Fundo e cartões (escuro) | `#151517` e `#1f1f22` |

**Cores de situação.** São reservadas: use só para dizer se algo está bom ou ruim, nunca como "mais uma cor de série".

| Situação | Claro | Escuro |
|---|---|---|
| Bom / dentro da meta | `#2e8b3e` | `#4cc764` |
| Atenção | `#d99a1e` | `#f0b43c` |
| Problema / acima da meta | `#c0392b` | `#ff5a4f` |

**Degradês**
- Hero: `radial-gradient(1100px 480px at 85% -10%, #b0283f 0%, transparent 60%), linear-gradient(135deg, #3d0812 0%, #6a1222 45%, #8d1d31 100%)`
- Barra superior: igual, com o brilho menor (`900px 220px at 85% -80%`).
- No escuro: `#1c0408 → #3a0a14 → #5a0f1c`, com brilho `#7c1a2c`.

**Formas:** cantos de 18px nos cartões, 22px nos cartões de indicador e 24px no hero. Sombras suaves avermelhadas: `0 10px 28px rgba(61,8,18,.07)`.

## Componentes

### Barra superior (`.k-top`)
Degradê vinho com a rede animada ao fundo. Botões de vidro (`.k-btn-vidro`) e um botão branco para a ação principal (`.k-btn-branco`).

### Hero (`.k-hero`)
Bloco de abertura da tela principal: etiqueta de vidro (`.k-chip-vidro`), título grande, frase e até 3 mini números (`.k-hk`) à direita.

### Cartão de indicador (`.k-card`)
Use as classes `ok`, `par` (atenção) e `nao` (problema) para mudar a cor da faixa lateral, do brilho, da bolinha e do número. Sem classe, o cartão fica vinho (informação neutra).

```html
<a class="k-card ok">
  <div class="k-ch"><span class="k-k">Consumo da meta</span><span class="k-m">Novembro</span></div>
  <div class="k-v">91,6%</div>
  <span class="k-pill">Dentro da meta</span>
  <div class="k-l"><span>Meta até hoje</span><b>R$ 2,6 mi</b></div>
  <span class="k-go">Abrir painel →</span>
</a>
```

### Cartão de gráfico (`VX.card`)
`VX.card(etiqueta, título, como_ler, conteúdo, legenda)` monta o cartão padrão. Coloque os cartões dentro de `<div class="vx">` (1 coluna) ou `<div class="vx vx2">` (2 colunas).

### Painel de detalhe (`DT.abrir`)
Gaveta que abre pela direita ao clicar num indicador. Segue sempre a mesma ordem: frase-resumo, números, evolução, onde se concentra, registros e o botão "Copiar resumo".

```js
DT.abrir({tag:'Área · Tipo', tit:'Nome do item', frase:'Resumo em uma frase...',
  kpis:[['Valor','R$ 412 mil'],['Meta','92%','ok']],
  ev:DT.barras([{l:'Out',v:100},{l:'Nov',v:120}], VX.brl),
  top:DT.top([{k:'Bacabal',v:156e3}], VX.brl),
  reg:DT.tab([['Data'],['Valor',1]], [['18/11','R$ 1.200']])});
```

Qualquer elemento com `data-vxd="campo|valor|nome"` fica clicável. No exemplo, um único `addEventListener` abre o painel.

## Qual gráfico usar

Comece pela pergunta que o indicador responde; ela define o gráfico.

| Pergunta | Gráfico | Função |
|---|---|---|
| Cada item está dentro da meta? | Barra com marca de meta | `VX.bullet(itens)` |
| O orçamento vai estourar? | Ritmo (acumulado × meta) | `VX.ritmo(meses, real, meta)` |
| Onde está o dinheiro (2 níveis)? | Mapa de blocos | `VX.blocos(grupos, nome)` |
| Que parte do todo está em cada situação? | Grade de 100 quadradinhos | `VX.waffle(partes)` |
| Quantos passam por cada etapa? | Funil | `VX.funil(etapas)` |
| Como cruzar duas dimensões? | Mapa de calor | `VX.calor(linhas, colunas, valor)` |
| Como se chegou neste saldo? | Cascata | `VX.cascata(meta, gastos)` |
| O que vence primeiro? | Linha do tempo | `VX.tempo(itens, hoje)` |
| Situação de cada item, mês a mês | Grade de situação | `VX.grade(itens, meses, mêsAtual)` |
| Tendência de cada grupo | Um gráfico por grupo | `VX.minisBase(itens, índice)` |
| Quão recentes estão os dados? | Linha de atualização | `VX.frescor(fontes)` |

## Regras do padrão

1. **Tema escuro sempre funcionando.** Tudo usa variáveis (`--fg`, `--surface`, `--vx*`), então nunca escreva cores fixas de texto.
2. **Filtros só dentro do botão "Filtros"** (gaveta), nunca espalhados pela tela.
3. **Comparar com o último mês fechado.** O mês em andamento aparece mais claro ou com `*`.
4. **Cor não é a única pista.** Junte sempre um texto (▲ +12%, "Acima da meta", legenda).
5. **Cada gráfico tem uma frase "como ler"** logo abaixo do título.
6. **Nada de valor cortado na tela.** Os números diminuem sozinhos (`clamp`) e os textos longos quebram linha.
7. **Dados pessoais** (CPF, CNPJ, telefone) nunca entram no HTML.
8. **Um gráfico com a "cara" do indicador** no topo de cada painel, em vez de repetir o mesmo cartão e a mesma barra em todo lugar.
