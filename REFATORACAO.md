# REFATORACAO.md

## Contexto

**Estrutura original:**
```
index.js          ← servidor monolítico (todas as rotas + lógica + fetch)
public/index.html ← 993 linhas com HTML, CSS e JS embutidos no mesmo arquivo
package.json
```

---

## Problemas Encontrados

### 1. Números Mágicos

Valores literais sem nomes espalhados pelo código, sem comunicar intenção:

| Local | Valor | Contexto |
|---|---|---|
| `index.js` | `100` | tamanho da página na API |
| `index.js` | `4` | tamanho do pack de draft |
| `index.js` | `2` | tamanho do deck da CPU |
| `index.js` | `20` | quantidade de feitiços retornados |
| `index.js` | `50` | valor base de atributos |
| `index.js` | `80`, `20` | bônus e variação de HP |
| `index.js` | `90`, `85`, `80`, `75` | poder por casa de Hogwarts |
| `index.js` | `3000` | porta do servidor |
| `public/index.html` (JS inline) | `800`, `700` | delays de animação |
| `public/index.html` (JS inline) | `600`, `500`, `400` | durações de animação |
| `public/index.html` (JS inline) | `5` | quantidade de feitiços do jogador |

### 2. Nomes sem Significado

Variáveis com nomes de uma ou duas letras sem expressar intenção:

| Nome original | Problema |
|---|---|
| `d` | resposta fetch (Response object) |
| `r` | dado JSON parseado |
| `tmp` | lista temporária de cartas/feitiços |
| `pg` | número da página |
| `pw` | poder do personagem |
| `mg` | magia do personagem |
| `df` | defesa do personagem |
| `obj` | objeto carta sendo construído |
| `x`, `y` | índices no loop de embaralhamento |
| `c`, `a` | personagens no front-end inline |

### 3. Funções com Múltiplas Responsabilidades

As rotas `/api/pack` e `/api/cpu-deck` em `index.js` faziam tudo dentro de uma única função anônima:
- Construção da URL com concatenação de string
- Fetch à API externa
- Iteração e filtragem de personagens
- Cálculo de atributos (`pw`, `mg`, `df`, `hp`)
- Montagem do objeto carta
- Embaralhamento do array
- Retorno da resposta

### 4. Código Duplicado (DRY)

A lógica de cálculo de atributos (`pw`, `mg`, `df`, `hp`) e o algoritmo de embaralhamento (Fisher-Yates) estavam copiados literalmente entre `/api/pack` e `/api/cpu-deck`.

### 5. Code Smells Gerais

- `var` em todas as declarações de variáveis (nenhum `const`/`let`)
- Construção de URL por concatenação: `'https://api.potterdb.com/v1/characters?page[number]=' + pg`
- Todo o CSS e JavaScript da aplicação embutido em `public/index.html` (993 linhas)
- `console.log` usado para logar erros em vez de `console.error`
- Operadores `==` em comparações
- Projeto escrito em CommonJS (`require`) sem tipagem

---

## Decisões Tomadas

### Etapa 1 — Migração para TypeScript + ESM

**Decisão:** migrar o back-end de `index.js` (CommonJS, sem tipagem) para TypeScript com ES Modules.

**Justificativa:** o projeto já tinha `tsconfig.json`, `eslint.config.mjs` e tipos instalados (`@types/express`, `@types/node`), indicando que a intenção era usar TypeScript. A migração permite checar tipos em tempo de desenvolvimento e elimina toda uma classe de erros em tempo de execução.

**Configurações aplicadas:**
- `tsconfig.json`: `module: NodeNext`, `moduleResolution: NodeNext`, `allowImportingTsExtensions: true`, `noEmit: true`
- `package.json`: adicionado `"type": "module"` para ESM nativo
- Script `dev`: `node --watch src/index.ts` (Node.js 24 suporta TypeScript nativamente)
- Imports com extensão `.ts` explícita (exigência do Node.js ESM nativo)

---

### Etapa 2 — Extração de Constantes

**Decisão:** criar `src/constants.ts` com todas as constantes nomeadas.

**Arquivo criado:** [`src/constants.ts`](src/constants.ts)

Constantes extraídas:

```ts
APP_PORT            // porta do servidor (3005)
POTTER_API_BASE     // URL base da PotterDB API
PACK_PAGE_SIZE      // tamanho da página da API (100)
MAX_PAGES           // total de páginas disponíveis (8)
DRAFT_PACK_SIZE     // cartas apresentadas no draft (4)
CPU_DECK_SIZE       // personagens no deck da CPU (2)
SPELLS_PAGE_SIZE    // tamanho da página de feitiços (100)
TOTAL_SPELLS_POOL   // feitiços retornados ao jogo (20)
BASE_STAT           // valor base de atributos (50)
HP_BASE_BONUS       // bônus fixo de HP (80)
HP_RANDOM_RANGE     // variação aleatória de HP (20)
BASE_SPELL_DAMAGE   // dano base de feitiço (30)
HOUSE_POWER         // mapa casa → poder
SPECIES_MAGIC       // mapa espécie → magia
ANCESTRY_DEFENSE    // mapa linhagem → defesa
SPELL_DAMAGE        // mapa categoria → dano do feitiço
```

No front-end (`public/js/game.js`), as constantes de animação foram extraídas para o topo do arquivo:

```js
PLAYER_SPELLS_COUNT       // feitiços disponíveis ao jogador (5)
SPELL_ANIMATION_DELAY     // delay após feitiço do jogador (800ms)
CPU_ATTACK_DELAY          // delay do ataque da CPU (700ms)
HIT_ANIMATION_DURATION    // duração da animação de acerto (600ms)
BATTLE_ANIMATION_DURATION // duração da animação de batalha (500ms)
LOADING_COMPLETE_DELAY    // delay antes do fade de loading (400ms)
LOADING_FADE_DURATION     // duração do fade de loading (600ms)
```

---

### Etapa 3 — Separação de Responsabilidades (Back-end)

**Decisão:** dividir o `index.js` monolítico em módulos por responsabilidade.

**Estrutura criada:**

```
src/
├── index.ts                ← apenas cria o app Express e chama app.listen()
├── constants.ts            ← todas as constantes da aplicação
├── routes/
│   ├── characters.ts       ← rota GET /api/pack
│   ├── spells.ts           ← rota GET /api/spells
│   └── game.ts             ← rota POST /api/cpu-deck
└── services/
    ├── potterApi.ts        ← fetchCharactersPage(), fetchSpells()
    └── statsCalculator.ts  ← buildCharacterCard(), buildSpellCard(), shuffle()
```

Cada arquivo tem uma única responsabilidade clara.

---

### Etapa 4 — Eliminação de Código Duplicado

**Decisão:** extrair o cálculo de atributos e o embaralhamento para `src/services/statsCalculator.ts`.

Funções criadas e reutilizadas em ambas as rotas (`characters.ts` e `game.ts`):

- `calculatePower(house)` — consulta `HOUSE_POWER` ou retorna `BASE_STAT`
- `calculateMagic(species)` — consulta `SPECIES_MAGIC` ou retorna `BASE_STAT`
- `calculateDefense(ancestry)` — consulta `ANCESTRY_DEFENSE` ou retorna `BASE_STAT`
- `calculateHp(defense)` — `defense + random(HP_RANDOM_RANGE) + HP_BASE_BONUS`
- `buildCharacterCard(characterData)` — monta o objeto `CharacterCard` completo
- `buildSpellCard(spellData)` — monta o objeto `SpellCard` completo
- `shuffle<T>(array)` — algoritmo Fisher-Yates genérico, uma única implementação

---

### Etapa 5 — Separação de Responsabilidades (Front-end)

**Decisão:** extrair o conteúdo de `public/index.html` (993 linhas) em arquivos separados por responsabilidade.

**Antes:** tudo em um único arquivo HTML com `<style>` e `<script>` inline.

**Depois:**

```
public/
├── index.html       ← estrutura HTML pura, sem CSS ou JS inline
├── css/
│   └── style.css    ← todos os estilos extraídos do <style>
└── js/
    ├── api.js       ← fetchPack(), fetchSpells(), fetchCpuDeck()
    ├── render.js    ← renderCard(), renderPack(), renderSpells(), renderDeckBadges()
    └── game.js      ← estado do jogo, lógica de batalha, draft, fim de jogo
```

---

### Etapa 6 — Renomeação de Variáveis e Funções

Todas as variáveis com nomes sem significado foram renomeadas:

| Antes | Depois | Contexto |
|---|---|---|
| `d` | `response` | resposta do fetch |
| `r` | `data` | JSON parseado |
| `tmp` | `cards` / `spellCards` | lista temporária |
| `pg` | `randomPage` | número da página |
| `pw` | `power` | atributo poder |
| `mg` | `magic` | atributo magia |
| `df` | `defense` | atributo defesa |
| `obj` | `card` / objeto estruturado | objeto sendo montado |
| `x` | `i` | índice no loop Fisher-Yates |
| `y` | `j` | índice aleatório no loop |
| `c` / `a` | `cpuCharacter` / `playerCharacter` | personagens na batalha |

---

### Etapa 7 — Code Smells Gerais

| Problema | Solução aplicada |
|---|---|
| `var` em todas as declarações | Substituído por `const` e `let` conforme mutabilidade |
| Concatenação de string para URL | Substituído por template literal: `` `${POTTER_API_BASE}/characters?page[number]=${page}` `` |
| HTML construído por concatenação | Substituído por template literals multi-linha em `renderCard()` |
| `console.log` para erros | Substituído por `console.error` nas rotas |
| Operador `==` | Substituído por `===` em todas as comparações |
