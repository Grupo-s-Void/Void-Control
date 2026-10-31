# VOID Control — guia de design

Documentação do estilo visual do sistema. Serve para manter consistência ao criar
telas ou componentes novos, e como referência rápida de "qual token eu uso aqui".

Toda a implementação vive em um único arquivo: [`src/styles/global.css`](../src/styles/global.css),
organizado em 9 seções numeradas no topo do arquivo. Os valores abaixo são as
variáveis de `:root` — mude ali para ajustar o sistema inteiro de uma vez.

---

## 1. Princípio central: a página nunca rola

A regra mais importante do layout, e a que mais molda o resto: **o app ocupa a
tela inteira e o `<body>` nunca tem barra de rolagem.** Cada tela é desenhada para
caber na viewport disponível.

- Quem rola é o conteúdo *dentro* de um card (classe `.rolagem`) — uma lista de
  motoristas, a tabela de notas, a agenda por horário.
- Isso é garantido em cascata com `height: 100dvh` + `overflow: hidden` no
  `<html>`/`<body>`/`.app`, e cada nível do layout usa `flex: 1; min-height: 0`
  para herdar a altura disponível sem estourar o pai.
- Abaixo de 900px (telas pequenas, onde o conteúdo do Início não cabe mais),
  a página inteira ainda não rola — em vez disso, o *painel* do Início ganha
  `overflow-y: auto` e rola por dentro do app.

Ao criar uma tela nova: pense em "o que cabe na viewport" antes de "o que cabe no
conteúdo". Se uma lista pode crescer sem limite, ela entra num card com `.rolagem`.

---

## 2. Cor

Paleta propositalmente enxuta: **fundos em preto/cinza neutro** + **um único par
de destaque em menta/ciano**, sem cores adicionais exceto para status.

```css
/* fundos — do mais escuro ao mais claro */
--fundo:  #0f0f0f;   /* fundo do app atrás de tudo */
--card:   #141414;   /* superfície padrão: cards, menu, inputs de busca */
--card-2: #222222;   /* superfície elevada: hover de linha, badges, inputs */
--card-3: #2e2e2e;   /* elementos de UI pequenos: scrollbar, trilho do switch */

/* linhas e bordas — sempre brancas translúcidas, nunca cor sólida */
--linha: rgba(255,255,255,.07);
--borda: rgba(255,255,255,.05);

/* texto — três níveis de ênfase */
--texto:   #ffffff;  /* títulos, valores, texto principal */
--texto-2: #9a9a9a;  /* legendas, labels, texto secundário */
--texto-3: #5f5f5f;  /* o mais apagado: placeholders visuais, ícones inativos */

/* destaque — a ÚNICA cor viva do sistema */
--destaque:   #d7fefa;  /* menta — ação primária, progresso concluído */
--destaque-2: #8fdce8;  /* ciano — ação secundária, segundo nível de dado */
--sobre-destaque:   #1a1d1d;  /* texto escuro em cima de uma superfície --destaque */
--sobre-destaque-2: #4a5555;  /* texto secundário em cima de --destaque */

/* status (mapeados 1:1 com o fluxo de canhotos em lib/util.ts) */
--ok:   var(--destaque);    /* conferido */
--info: var(--destaque-2);  /* a conferir */
--warn: #f3d9a4;             /* pendente / atrasado */
--bad:  #ffa3a3;             /* recusado / erro */
--bad-fundo: #3a2a2a;        /* fundo de avisos e mensagens de erro */
```

**Regras de uso:**
- `--destaque` é reservado para a ação mais importante da tela — um botão
  principal, o item ativo de um filtro, a fatia "concluído" de um gráfico. Usar
  em mais de um lugar por tela dilui o efeito.
- Nunca usar cor sólida nas bordas — sempre branco translúcido (`--linha` ou
  `--borda`), o que deixa o contraste suave em qualquer fundo escuro.
- Elementos "em cima do destaque" (texto dentro de um card `.card-destaque`,
  por exemplo) usam `--sobre-destaque`, nunca `--texto` branco — o menta claro
  não tem contraste suficiente com branco.
- **Exceção deliberada — escalas sequenciais (heatmaps):** quando o dado é uma
  intensidade (0, 1, 2, 3+ ocorrências), usar `color-mix(in srgb, var(--destaque)
  X%, var(--card-2))` em passos crescentes (ex.: 28%, 62%, 100%) em vez de
  introduzir cinzas no meio da escala. É a mesma cor, só mais clara conforme o
  valor cresce — não conta como "um segundo destaque" porque é uma única
  variável semântica (quantidade), não duas ações competindo. Ver `.grade-celula`
  na grade de Atividade (Início).

---

## 3. Tipografia

Uma família só: **Poppins** (pesos 300–600), carregada do Google Fonts no
`index.html`. Fallback: `system-ui, sans-serif`.

| Peso | Uso |
|---|---|
| 300 | títulos grandes (hero da tela Entrar, números grandes) |
| 400 | corpo de texto, título de card, título de tela |
| 500 | texto com ênfase: nomes, valores, labels de botão |
| 600 | a palavra de destaque dentro de um título (`<b>` dentro de `<h1>`) |

Base do corpo: `12px`, `line-height: 1.45`. Escala bem pequena e discreta —
a maior parte da interface usa entre `10px` e `14px`; só títulos de tela (hero
do login, números em destaque) passam de `20px`.

```css
.mini      { font-size: 10px; color: var(--texto-2); }  /* legenda padrão */
.espacado  { font-size: 9px; letter-spacing: .22em; text-transform: uppercase; color: var(--texto-2); }
.num       { font-variant-numeric: tabular-nums; }       /* todo número/valor monetário usa isso */
```

`.espacado` é o estilo de "rótulo editorial" usado nos poucos lugares com ar de
identidade visual (barra lateral da tela Entrar) — letras bem espaçadas, caixa
alta, tamanho minúsculo.

---

## 4. Espaço, raio e grid

```css
--raio:    10px;  /* cantos de cards */
--raio-sm:  6px;  /* cantos de botões, inputs, pílulas, badges */
--espaco:   8px;  /* gap padrão entre cards num grid */
```

Cantos **pouco arredondados** de propósito — nada de `border-radius: 16px+` ou
pílulas totalmente redondas em elementos grandes (só em elementos realmente
circulares: avatar, interruptor, indicadores de status).

Praticamente todo o layout usa **CSS Grid com `grid-template-areas` nomeadas**
(ver `.painel` na tela Início) em vez de posicionamento manual — isso é o que
permite reorganizar a tela inteira por breakpoint só trocando as áreas, sem
duplicar HTML.

---

## 5. Movimento

Todo o sistema usa **uma única curva de easing** e **uma escala pequena de
tempos**, para que qualquer animação pareça parte do mesmo sistema:

```css
--suave:      cubic-bezier(.16,1,.3,1);  /* "ease-out" acentuado — usado em quase tudo */
--t-medio:    200ms;   /* hover, abrir/fechar menu e modal, trocar de estado */
--t-lento:    360ms;   /* entrada de tela, cards aparecendo em sequência */
--t-grafico:  800ms;   /* anéis de progresso enchendo */
```

**Princípios:**
- **Nunca desloca conteúdo de um jeito que force rolagem.** As animações de
  entrada (`surgir`) usam opacidade + uma escala *menor que 1* (`scale(.985)`),
  nunca `translateY` positivo ou `scale > 1` — isso evitaria que um elemento
  "vazasse" do card por um instante e piscasse uma barra de rolagem.
- **Sequência com atraso incremental:** cards de uma tela entram em cascata
  (classe `.entra`), com 25ms de diferença entre um e outro, até um teto de
  ~125ms — dá uma sensação de "montagem", sem atrasar a tela como um todo.
- **A transição de login é a peça mais elaborada do sistema** — veja a seção 7.

---

## 6. Componentes

Cada componente visual vive em [`src/components/ui.tsx`](../src/components/ui.tsx)
como uma função React pequena, e o estilo correspondente é uma classe plana no
CSS (sem CSS-in-JS, sem Tailwind). Os principais:

| Componente | Classe CSS | Nota de uso |
|---|---|---|
| `<Card>` | `.card` (+ `.card-destaque` opcional) | contêiner base de quase tudo |
| `<Botao variante="…">` | `.botao-escuro/-destaque/-contorno/-perigo` | 4 variantes, nunca crie uma 5ª sem necessidade real |
| `<Avatar>` | `.avatar` | cor determinada por hash do nome — sempre a mesma cor para a mesma pessoa |
| `<Etiqueta status="…">` | `.etiqueta` | ponto colorido + texto; cor vem de `STATUS` em `lib/util.ts` |
| `<GraficoAneis>` | `.graficos` / `.aneis` | anéis concêntricos interativos (hover/clique) — ver seção 8 |
| `<Modal>` | `.fundo-modal` / `.modal` | entra com escala, sai encolhendo; ver seção 7 |

**Convenção de nomenclatura:** classes e nomes de variáveis em português, no
estilo "o que é" (`.lateral-item`, `--sobre-destaque`), não abreviações em
inglês. Siga o mesmo padrão em qualquer componente novo.

### Botões
```
.botao-escuro     uso padrão (cinza --card-2)
.botao-destaque   ação primária (fundo --destaque, 1 por tela no máximo)
.botao-contorno   ação secundária com borda, sem preencher
.botao-perigo     ações destrutivas (recusar, excluir)
```
Todos levam `height: 32px`, ficam `30px²` quando só têm ícone (`.botao-icone`),
e têm um micro-feedback de clique: `transform: scale(.98)` no `:active`.

---

## 7. A transição de login ("portal")

É a peça de identidade visual mais elaborada do sistema — vale documentar o
mecanismo porque não é óbvio lendo o CSS isoladamente.

A tela **Entrar** (`src/pages/Entrar.tsx`) mostra um vórtice de poeira — um
componente `<Poeira>` que desenha um spiral de centenas de partículas num
`<canvas>` **uma única vez** (não por quadro: é por isso que é leve). O núcleo
do vórtice é ciano, a cor de destaque do sistema; a poeira mais distante vai
esbranquiçando. É o único ponto de cor saturada na tela toda, concentrado no
centro do vórtice — o resto é escuro/cinza, como o resto da paleta.

A posição do núcleo (`--px`/`--py`) é calculada por uma função pura,
`pivo()`, a partir só de `innerWidth`/`innerHeight` — sem medir nenhum
elemento do DOM. Isso mantém `<Poeira>` e `abrirPortal()` (chamada no submit)
sincronizados sem precisar de ref nem de coordenação entre componentes: os
dois chamam a mesma fórmula e chegam ao mesmo ponto.

Ao autenticar com sucesso:
1. **Saída do formulário** (420ms): texto e card de login se dissolvem com
   leve blur + descida (`login-sai`); o `<canvas>` da poeira encolhe e gira
   na direção do núcleo até sumir (`poeira-sai`, `transform-origin` no ponto);
   o pontinho do núcleo cresce e ganha glow (`ponto-acende`) — lê como a
   poeira sendo "sugada" pro ponto que vai abrir o sistema.
2. **Portal** (900ms, logo em seguida): o `<div class="app">` entra com um
   `clip-path: circle()` animado a partir da posição exata do ponto
   (variáveis `--ox`/`--oy`, calculadas por `pivo()` no momento do submit) —
   o app "nasce" daquele ponto e se expande até cobrir a tela. Um anel ciano
   (`::after`) acompanha a borda dessa expansão.
3. Só depois disso os cards da tela começam a entrar (`--atraso: 380ms` soma ao
   delay normal de `.entra`), para não competir visualmente com o portal.

Reaproveite esse padrão (abrir um elemento "de um ponto") se precisar de outra
transição com a mesma assinatura visual — a lógica de cálculo de origem está
isolada em `pivo()`/`abrirPortal()` em `Entrar.tsx`. A deriva lenta do vórtice
(`@keyframes deriva`, um `rotate()` de poucos graus em 50s) é a única animação
contínua da tela — tudo o resto entra uma vez e para, por isso o efeito nunca
pesa na CPU/GPU mesmo ficando minutos parado na tela de login.

---

## 8. Gráficos de dados

Os únicos gráficos do sistema são **anéis concêntricos** (`<GraficoAneis>`),
usados em pares na tela Início (Notas / Canhotos de um motorista). Decisões de
design específicas:

- Cada segmento é um anel próprio (não um donut único fatiado) — permite
  comparar o preenchimento relativo de cada categoria num relance.
- **Interativo**: passar o mouse ou focar um anel/legenda ativa `.focado` no
  contêiner, que apaga (`opacity: .3`) todos os outros anéis e itens de
  legenda — destaca um dado de cada vez em vez de mostrar tudo com peso igual.
- Clicar num anel navega para a tela Canhotos já filtrada por aquele status —
  o gráfico é também um atalho de navegação, não só uma visualização.
- Anel some (`stroke-opacity: 0`) quando o segmento tem valor zero, em vez de
  desenhar um arco de 0% — evita o ponto decorativo "fantasma" no início do anel.
- Preenchimento é animado (`--t-grafico`, 800ms) a partir de um
  `requestAnimationFrame` no primeiro render — os anéis começam vazios e enchem
  assim que a tela aparece.

---

## 9. Responsivo

Breakpoints não seguem uma escala genérica — cada um existe para resolver um
reflow específico do Início, que é a tela mais densa:

| Largura | O que muda |
|---|---|
| `max-height: 760px` | compacta paddings do topo/cabeçalho (telas baixas) |
| `1180px` | painel do Início vai de 4 para 3 colunas |
| `1100px` | painel de detalhe (Canhotos/Usuários) vira tela cheia sobreposta |
| `900px` | Início para de caber: o painel ganha rolagem própria |
| `820px` | cabeçalho de tela empilha o filtro central numa 2ª linha |
| `700px` | menu lateral vira pílula flutuante inferior (padrão mobile) |

No celular, a barra lateral deixa de ser uma coluna fixa e vira uma pílula
flutuante centralizada no rodapé — com o mesmo indicador que desliza entre os
itens, só que na horizontal em vez de vertical.

---

## Como estender

- **Nova cor:** só se for um novo *status*, nunca um novo destaque decorativo.
  Adicione em `:root` e reaproveite `--texto`/`--sobre-destaque` para o texto
  em cima dela.
- **Novo componente:** função em `ui.tsx` + classe CSS de mesmo nome na seção 4.
  Reuse `--raio-sm`, `--t-medio` e `--suave` em vez de inventar valores novos.
- **Nova tela:** comece pelo `<Cabecalho titulo subtitulo meio acao>` padrão,
  monte o conteúdo em cards dentro de um grid com `grid-template-areas`, e
  garanta que nada deixa a página inteira rolar — só o conteúdo de um card.
