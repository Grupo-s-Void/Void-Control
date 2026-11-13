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

Paleta propositalmente enxuta: **só preto, cinza e branco** (como as referências
em desfoque e grão). Sem cor de destaque. O app ocupa a tela inteira: um trilho preto
de ícones à esquerda (círculos; o ativo ganha uma bolha cinza que desliza) e o
painel de conteúdo "dentro" dele, com cantos de 24px. Sem borda em volta da página.

```css
/* paleta de referência: Obsidian #0A0A0A, Graphite #171717, Charcoal #222,
   Deep Gray #2E2E2E, Slate #555, Cool Gray #858585, Light Gray #B5B5B5,
   Mist #D9D9D7, Off White #EDEDEB, Soft White #F5F5F3, Pure White #FFF */
--pagina: #0a0a0a;   /* obsidian: o chrome preto em volta do painel */
--fundo:  #121212;   /* painel de conteúdo (arredondado, dentro do trilho preto) */
--card:   #171717;   /* graphite: cards, tabelas, menu */
--cabeca: #1b1b1b;   /* cabeçalho de tabela, rótulos da lista de dados */
--card-2: #222;      /* charcoal: hover, badges, botão padrão */
--card-3: #2e2e2e;   /* deep gray: item ativo, pílula ativa, scrollbar */

/* linhas e bordas — sempre brancas translúcidas */
--linha / --borda: rgba(255,255,255,.075);
--borda-forte:     rgba(255,255,255,.13);  /* inputs, botão contorno */

/* texto */
--texto: #f5f5f3;  --texto-2: #858585;  --texto-3: #555;

/* ação primária — branco */
--primario: #f5f5f3;  --sobre-primario: #0b0b0b;

/* destaques — em tons de cinza/branco */
--destaque:   #f5f5f3;  /* soft white */
--destaque-2: #b5b5b5;  /* light gray */
--destaque-suave: rgba(255,255,255,.14), para bordas de destaque
--degrade: radial cinza, de quase branco a preto, subindo de baixo

/* status (lib/util.ts) */
--ok: var(--destaque); --info: var(--destaque-2); --warn: #f3d9a4; --bad: #ffa3a3;
```

**Regras de uso:**
- Botão principal é **branco** (`.botao-destaque` usa `--primario`).
- O destaque (branco) aparece **pequeno**: foco de input, traço do item ativo (menu
  lateral, linha selecionada da tabela, evento a conferir), contagem da pílula
  ativa, números-chave (relógio), switch ligado, marcadores de status e gráficos.
  Nunca como fundo de card.
- `--degrade` (com grão fino por cima) só em **um ponto focal por tela** — hoje,
  o banner "Conferir canhotos" do Início.
- Estado ativo = cinza mais claro + borda (`--card-2`/`--card-3`), não cor.
- `.card-destaque` é cinza elevado; o destaque vem de uma borda/traço branco.
- Tabelas encostam na borda do card (`.card:has(> .rolagem > .tabela)`),
  cabeçalho em `--cabeca`, linhas separadas por `--linha`, sem caixa alta.
- **Escalas sequenciais (heatmaps):** `color-mix(in srgb, var(--destaque) X%,
  var(--card-2))` em passos (28%, 62%, 100%). Ver `.grade-celula`.
- **Celular (≤700px):** topo com logo + botões redondos (busca
  recolhida, sino, avatar); títulos de 24px; pílulas e botões arredondados;
  menu flutuante embaixo; modais abrem como folha de baixo.

---

## 3. Tipografia

Uma família só: **Inter** (pesos 300–600), carregada do Google Fonts no
`index.html`. Fallback: `system-ui, sans-serif`.

| Peso | Uso |
|---|---|
| 300 | títulos grandes (hero da tela Entrar) |
| 400 | corpo de texto, títulos de tela, números grandes |
| 500 | título de card, nomes, valores, labels de botão |
| 600 | a palavra de destaque dentro de um título (`<b>` dentro de `<h1>`) |

Base do corpo: `13px`, `line-height: 1.45`. Tabela `12.5px`, títulos de card
`13px`, título de tela `18px` (`24px` no celular).

```css
.mini      { font-size: 11px; color: var(--texto-2); }  /* legenda padrão */
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

### Textura dither (a "assinatura pixel")
Funções em [`src/components/Dither.tsx`](../src/components/Dither.tsx): cada célula
de uma grade acende ou não comparando um brilho com uma matriz de Bayer 4×4 — o
grão de halftone das referências. Hoje só aparece **pequena**: `<LuaPixel>` no estado vazio (`<Vazio>`). Sem pontos
em fundos de card, foto ou tela.
No resto da interface a linguagem aparece só como forma: marcadores de status,
legendas e a grade de atividade são quadrados (`border-radius: 1px`), sem glow.
Sobre tudo há um grão de ruído muito leve (`body::before`, `overlay`); no login ele fica mais forte, sobre a luz desfocada.

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

A tela de login é preto com **luz branca desfocada** (`.brilho`) e grão fino por
cima, um card de vidro escuro e a frase **"focus on void"** no canto inferior
direito (`.entrar-focus`): o texto nítido com duas cópias desfocadas que se afastam
e convergem ao carregar, como uma lente entrando em foco. O app não tem fundo
decorativo: não há moldura, constelação nem pontos.

Ao autenticar com sucesso:
1. **Saída do formulário** (420ms): texto e card de login se dissolvem com
   leve blur + descida (`login-sai`); o pontinho do núcleo cresce e ganha glow
   (`ponto-acende`) — o ponto que vai abrir o sistema. O fundo fica e só apaga.
2. **Portal** (900ms, logo em seguida): o `<div class="app">` entra com um
   `clip-path: circle()` animado a partir do centro da tela
   (variáveis `--ox`/`--oy`, gravadas por `abrirPortal()` no submit) —
   o app "nasce" dali e se expande até cobrir a tela. Um anel branco
   (`::after`) acompanha a borda dessa expansão.
3. Só depois disso os cards da tela começam a entrar (`--atraso: 380ms` soma ao
   delay normal de `.entra`), para não competir visualmente com o portal.

Reaproveite esse padrão (abrir um elemento "de um ponto") se precisar de outra
transição com a mesma assinatura visual — a origem é definida em
`abrirPortal()` em `Entrar.tsx`. A deriva lenta da luz (`@keyframes brilho-deriva`)
é a única animação contínua da tela — tudo o resto entra uma vez e para, por isso o efeito nunca
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
