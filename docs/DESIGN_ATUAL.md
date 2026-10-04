# Levantamento de Design Atual — Conserpav v3.0

**Data:** 2026-10-04  
**Objetivo:** Mapeamento completo de cores, tipografia e elementos com "cara de IA" antes da refatoração visual.

---

## 1. Cores em Uso (Agrupadas por Papel)

### 1.1 Tema Claro (Light)

| Papel | Variável / Notação | Valores Hex / RGBA encontrados | Onde é usado |
| :--- | :--- | :--- | :--- |
| **Primária** | `--red` | `#d71920` | Botões principais, acentos da marca, foco |
| **Primária Dark / Hover** | `--red-dark` | `#ac1218`, `#c91520`, `#b4232c`, `#9f1722`, `#8f1720` | Hover de botões, gradientes de cabeçalho |
| **Primária Tint (Fundo)** | `--tint-danger-bg` | `#fff0f0`, `#fff1f2`, `#ffe0e2` | Alertas de erro, badges de ausência |
| **Primária Tint (Borda)** | `--tint-danger-border`| `#e4aaaa` | Borda de cards de erro/ausência |
| **Fundo de Página** | `--paper` | `#f7f7f5` | `body`, fundo do viewport geral |
| **Superfície Principal** | `--surface` | `#ffffff` (`#fff`) | Cards, painéis, inputs, modais |
| **Superfície Alternativa** | `--surface-alt` | `#fafafa`, `#f4f2ee` | Form cards, linhas alternadas |
| **Controles Neutros** | `--control-bg` | `#f4f4f4` | Chips inativos, estado desabilitado |
| **Hover de Superfície** | `--surface-hover` | `#fffafa` | Hover sutil em linhas de tabela |
| **Linhas e Bordas** | `--line` | `#dedede` | Bordas gerais de cards e divisores |
| **Linhas Suaves** | `--line-soft` | `#c7c7c7` | Bordas de placeholders e caixas tracejadas |
| **Texto Principal** | `--ink` | `#121212`, `#111111` | Títulos, rótulos principais, valores |
| **Texto Secundário** | `--ink-soft` | `#4a4a4a`, `#4f4f4f` | Subtítulos, labels informativos |
| **Texto Mutado** | `--muted` | `#676767`, `#5c5e61` | Legendas, datas secundárias |
| **Texto Suave / Terciário**| `--muted-soft` | `#999999`, `#a5a7aa` | Placeholders, textos desativados |
| **Sucesso (Base)** | `--green` | `#238a55` | Ações de confirmação |
| **Sucesso (Texto Escuro)** | `--tint-success-text`| `#18623d`, `#176b42`, `#146138`, `#08783a`, `#05632f` | Texto de presença completa, status ativo |
| **Sucesso (Fundo Tint)** | `--tint-success-bg` | `#eff9f2`, `#e9f9ef`, `#edf8f1`, `#d9f7e5` | Botão presença completa, linha ativa |
| **Sucesso (Bordas)** | `--tint-count-border` | `#9bd9b0`, `#2e9b62`, `#b7e8c9`, `#8bd5a6` | Borda de presença e destaque de obra |
| **Aviso / Meia-diária (Base)**| `--orange` | `#e98722`, `#f4ad52` | Meia diária, avisos pendentes |
| **Aviso (Texto Escuro)** | `--tint-warning-text`| `#562c00`, `#a56a00`, `#a85c00` | Texto de meia presença |
| **Aviso (Fundo Tint)** | `--tint-warning-bg` | `#fff8ee`, `#fff0ee` | Fundo de botão meia diária |
| **Erro / Ausência** | `--tint-danger-text`| `#a80d14`, `#c62828`, `#b00000`, `#ef4136` | Ausente na chamada, mensagens de erro |
| **Informativo / Azul** | — | `#2874d4`, `#4d8bd8`, `#74a9ed`, `#eaf2ff` | Links, badges neutros secundários |
| **Papel de Operário** | `--worker` | `#4b7b89` | Ícones de função e equipe |

---

### 1.2 Tema Escuro (Dark)

| Papel | Variável / Notação | Valores Hex / RGBA | Onde é usado |
| :--- | :--- | :--- | :--- |
| **Primária** | `--red` | `#ff5b62` | Botões, acentos da marca em tema escuro |
| **Primária Clara / Hover** | `--red-dark` | `#ff9da1`, `#ffb8bd` | Hover de botões, links ativos |
| **Primária Tint (Fundo)** | `--tint-danger-bg` | `rgba(255, 91, 98, 0.14)` | Alertas e presença ausente |
| **Primária Tint (Borda)** | `--tint-danger-border`| `rgba(255, 91, 98, 0.4)` | Bordas de cards de erro/ausência |
| **Fundo de Página** | `--paper` | `#16171a` | Fundo do viewport geral |
| **Superfície Principal** | `--surface` | `#1f2024` | Cards, painéis, inputs, modais |
| **Superfície Alternativa** | `--surface-alt` | `#1a1b1e` | Form cards, linhas alternadas |
| **Controles Neutros** | `--control-bg` | `#2a2b30` | Chips inativos, controles neutros |
| **Hover de Superfície** | `--surface-hover` | `#26272c` | Hover de itens de lista |
| **Linhas e Bordas** | `--line` | `#34363c` | Bordas e divisores |
| **Linhas Suaves** | `--line-soft` | `#40424a` | Bordas tracejadas e caixas secundárias |
| **Texto Principal** | `--ink` | `#f3f1ee` | Títulos e textos de alto contraste |
| **Texto Secundário** | `--ink-soft` | `#d6d8dc` | Subtítulos e labels |
| **Texto Mutado** | `--muted` | `#a7abb3` | Legendas e metadados |
| **Texto Suave / Terciário**| `--muted-soft` | `#85878f`, `#82858d` | Placeholders e notas neutras |
| **Sucesso (Base / Texto)** | `--green` / `--tint-success-text` | `#3ecf8e`, `#86e6b5`, `#9ce9b8` | Texto de presença completa, status ativo |
| **Sucesso (Fundo Tint)** | `--tint-success-bg` | `rgba(62, 207, 142, 0.14)` | Botão presença completa |
| **Sucesso (Bordas)** | `--tint-count-border` | `rgba(62, 207, 142, 0.4)`, `#4db57b` | Borda presença e obra ativa |
| **Aviso (Base / Texto)** | `--orange` / `--tint-warning-text` | `#ffab5c`, `#e2954f`, `#ffcd9a` | Meia presença |
| **Aviso (Fundo Tint)** | `--tint-warning-bg` | `rgba(255, 171, 92, 0.14)` | Fundo botão meia diária |
| **Papel de Operário** | `--worker` | `#7fb3c4` | Ícones de função e equipe |

---

## 2. Tipografia e Escalas

### 2.1 Famílias Tipográficas
- **DM Sans** (`sans-serif`): Carregada com pesos `400, 500, 600, 700`. Usada no corpo do texto, botões e formulários.
- **Fraunces** (`serif`): Carregada com pesos `600, 700`. Usada em:
  - `h1, h2, h3` genéricos (`src/index.css:205`)
  - `.brand h1` (`src/index.css:252`)
  - `.app-header-brand-name` (`src/index.css:478`)
  - `.panel-header h2` (`src/index.css:738`)
  - `.report-title` (`src/index.css:2463`)
  - `.modal-header h3` (`src/index.css:2735`)
  - `@media print .report-header-text h1` (`src/index.css:3049`)
  - `.login-brand-text h1` (`src/pages/LoginPage.css:50`)

### 2.2 Tamanhos de Fonte Atuais (Dispersão Encontrada)
Foram identificados mais de **35 tamanhos arbitrários** em `rem`:
- Micro: `0.45rem`, `0.5rem`, `0.58rem`, `0.62rem`, `0.65rem`, `0.66rem`, `0.68rem`
- Pequenos: `0.7rem`, `0.72rem`, `0.74rem`, `0.75rem`, `0.78rem`, `0.8rem`, `0.82rem`, `0.84rem`, `0.85rem`, `0.88rem`, `0.89rem`
- Corpo / Médios: `0.9rem`, `0.95rem`, `0.96rem`, `1rem`, `1.02rem`, `1.04rem`, `1.05rem`, `1.06rem`, `1.12rem`, `1.15rem`, `1.18rem`
- Títulos: `1.2rem`, `1.25rem`, `1.3rem`, `1.35rem`, `1.5rem`, `1.6rem`, `1.75rem`, `1.9rem`, `2rem`, `2.1rem`

---

## 3. Elementos "Genéricos de IA" Encontrados (A Remover/Substituir)

### 3.1 Gradientes Decorativos
1. `src/pages/ForgotPasswordPage.css:7`: `.forgot-password-page`  
   `background: linear-gradient(135deg, var(--red) 0%, var(--orange) 100%);`
2. `src/index.css:901`: `.attendance-summary-header`  
   `background: linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%);`
3. `src/index.css:2060`: `.nav-tab.active`  
   `background: linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%);`

### 3.2 Glows, Sombras Difusas e Elevações Excessivas
1. `src/pages/LoginPage.css:165`: `.login-button:hover`  
   `box-shadow: 0 6px 16px rgba(215, 25, 32, 0.25); transform: translateY(-2px);`
2. `src/pages/LoginPage.css:74`: `.login-card`  
   `box-shadow: var(--shadow-panel);` (sombra de 46px de difusão)
3. `src/pages/ForgotPasswordPage.css:121`: `.forgot-button:hover`  
   `box-shadow: 0 4px 12px rgba(215, 25, 32, 0.3); transform: translateY(-2px);`
4. `src/index.css:116`: `.project-entity-row.is-project-active`  
   `box-shadow: 0 0 0 3px rgba(46, 155, 98, 0.14), 0 8px 20px rgba(46, 155, 98, 0.1);`
5. `src/index.css:903`: `.attendance-summary-header`  
   `box-shadow: 0 6px 16px rgba(215, 25, 32, 0.22);`
6. `src/index.css:964, 969, 981, 987`: `.attendance-button.status-full:hover`, `.attendance-button.status-half:hover`  
   `box-shadow: 0 7px 18px rgba(8, 120, 58, 0.32);`
7. `src/index.css:2065`: `.nav-tab.active`  
   `box-shadow: 0 4px 10px rgba(11, 59, 115, 0.18);`
8. `src/index.css:2274`: `.action-sheet`  
   `box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);`
9. `src/index.css:2822`: `.toast`  
   `box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);`

### 3.3 Animações Gratuitas
1. `src/pages/LoginPage.css:77`: `.login-card`  
   `animation: slideUp 0.4s ease-out;` com `@keyframes slideUp`
2. `src/pages/ForgotPasswordPage.css:44`: `.forgot-card`  
   `animation: slideUp 0.4s ease-out;` com `@keyframes slideUp`
3. `src/index.css:414, 418`: `.page-enter`, `.page-leave`  
   `animation: page-enter 0.22s ease both;` / `page-leave 0.14s ease both;`
4. `src/index.css:1488`: `.employee-added-pulse`  
   `animation: employee-added-pulse 1.4s ease-in-out 2;`

### 3.4 Pílulas Gigantescas (`border-radius: 999px`) e Raios Inconsistentes
1. `src/index.css`: Mais de 10 ocorrências de `border-radius: 999px` em:
   - Badges de contagem
   - Botões de alternância
   - Chips de dia da semana
   - Indicadores de status
2. Raios inconsistentes variando entre `4px`, `6px`, `8px`, `9px`, `10px`, `11px`, `12px`, `13px`, `14px`, `0.55rem`, `0.6rem`, `0.7rem`, `1rem` e `1.5rem`.

### 3.5 Simetria Forçada e Elevação em Hover
- Quase todos os botões e cards aplicam `transform: translateY(-2px)` no hover.

### 3.6 Letter-spacing Decorativo / "Chique"
- Ocorrências de `letter-spacing: 0.15em`, `0.13em`, `0.1em`, `0.08em` em títulos e rótulos secundários forçando estilo de marketing.

---

## 4. Plano de Padronização para as Próximas Fases

1. **Tokens (`src/tokens.css`)**:
   - Centralizar todas as cores identificadas em variáveis estritas no `:root` e `[data-theme="dark"]`.
   - Escala de espaçamento padrão: `4px (0.25rem)`, `8px (0.5rem)`, `12px (0.75rem)`, `16px (1rem)`, `24px (1.5rem)`, `32px (2rem)`.
   - Escala tipográfica enxuta: `12px (0.75rem)`, `14px (0.875rem)`, `16px (1rem)`, `20px (1.25rem)`, `24px (1.5rem)`.
   - Raio de borda padrão: `4px` (controles e inputs) e `6px` a `8px` (painéis e modais). Eliminar `999px` generalizado.
   - Sombra: Uma única sombra utilitária discreta `0 1px 3px rgba(0,0,0,0.08)` ou nenhuma (apenas borda sólida de 1px).
2. **Remoção de Fontes Decorativas em Telas Internas**:
   - Manter `Fraunces` exclusivamente na logomarca `CONSERPAV` no cabeçalho/login.
   - Migrar todos os títulos e cabeçalhos internos (`h1`, `h2`, `h3`, modais, relatórios) para `DM Sans` com peso `600`, conferindo aspecto sóbrio de ferramenta de trabalho.
3. **Remoção de Efeitos "IA"**:
   - Substituir gradientes por fundos sólidos ou bordas destacadas.
   - Substituir animações de slide-up e transições lentas por transições funcionais de estado (100–150ms).
   - Respeitar `@media (prefers-reduced-motion: reduce)`.
