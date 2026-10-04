# Inventário de UI, Telas e Controles de Formulário — Conserpav

Documento de inventário exaustivo gerado em conformidade com a especificação de varredura de todas as telas, eliminação de redundâncias estruturais e padronização dos controles de formulário (`select`, `input`, `textarea`, radio, pickers).

---

## 1. Telas, Rotas e Componentes Utilizados

| Rota / Tela | Arquivo da Página | Componentes Utilizados | Status e Finalidade |
|---|---|---|---|
| `/login` | `src/pages/LoginPage.jsx` | Tags nativas (`form`, `input`, `button`, `img`, `a`) | Formulário de autenticação por e-mail e senha. |
| `/?recover=true` | `src/pages/ForgotPasswordPage.jsx` | Tags nativas (`form`, `input`, `button`, `a`) | Modo 1: Solicitação de link de redefinição por e-mail. |
| `/?recover=true&token=...` | `src/pages/ForgotPasswordPage.jsx` | Tags nativas (`form`, `input`, `button`, `a`) | Modo 2: Redefinição de senha com token recebido no e-mail. |
| `/obras` (raiz `/`) | `src/pages/ObrasPage.jsx` | `PageHeader`, `ProjectForm`, `ProjectList`, `Plus`, `Building2` | Gestão de obras: cadastro inline e listagem com modal de edição. |
| `/chamada` | `src/pages/ChamadaPage.jsx` | `PageHeader`, `ProjectSelect`, `DatePickerField`, `ChevronLeft`, `ChevronRight`, `CalendarCheck`, `HardHat`, `Link` | Registro de frequência diária da obra selecionada por semana/quinzena. |
| `/equipe` | `src/pages/EquipePage.jsx` | `PageHeader`, `ProjectSelect`, `EmployeeForm`, `EmployeeList`, `UserPlus`, `Users` | Gestão de funcionários: cadastro vinculado a obra e listagem de operários. |
| `/relatorios` | `src/pages/RelatoriosPage.jsx` | `PageHeader`, `ProjectSelect`, `DatePickerField`, `ReportRow` (inline), `FileBarChart2`, `Copy`, `Check`, `Printer` | Fechamento quinzenal/semanal de diárias, cópia de Pix e impressão de folha. |
| `/gastos` | `src/pages/GastosPage.jsx` | `PageHeader`, `ProjectSelect`, `Wallet`, `Plus`, `Trash2`, `PencilLine`, `Printer`, `CheckCircle2` | Lançamento de despesas/materiais de obra, cálculo de total e relatório impresso. |
| `/tema` | `src/pages/TemaPage.jsx` | `PageHeader`, `Palette`, `Sun`, `Moon` | Seleção de tema visual (Claro / Escuro). |
| *(Wildcard `*`)* | `src/App.jsx` | `<Navigate to="/obras" replace />` | Rota 404/inexistente redireciona para `/obras`. |
| *(Layout Shell)* | `src/App.jsx` | `AppHeader`, `BottomNav`, `PageTransition`, `ToastStack`, `BackToTop`, `LoadingScreen`, `ErrorScreen` | Estrutura persistente: cabeçalho desktop, barra inferior mobile, toasts e status. |

---

## 2. Ocorrências dos Padrões do Catálogo por Tela

### 2.1 `LoginPage.jsx` (`src/pages/LoginPage.jsx` e `LoginPage.css`)
- **Card e Sombras:** `.login-card` com `box-shadow: var(--shadow-panel)` e animação `@keyframes slideUp` com `translateY(20px)`.
- **Efeitos de Hover:** `.login-button:hover` com `transform: translateY(-2px)` e `box-shadow: 0 6px 16px rgba(215, 25, 32, 0.25)`.
- **Tipografia e Caixa Alta:** `.login-brand-text p` com `letter-spacing: 0.15em`, `text-transform: uppercase`, `font-size: 0.7rem`.
- **Correção Proposta:** Remover `@keyframes slideUp`, remover elevação e glow de sombra no hover do botão; simplificar o card para superfície plana com borda de 1px e sombra sutil.

### 2.2 `ForgotPasswordPage.jsx` (`src/pages/ForgotPasswordPage.jsx` e `ForgotPasswordPage.css`)
- **Gradiente Decorativo:** Fundo da tela inteira com `background: linear-gradient(135deg, var(--red) 0%, var(--orange) 100%)`.
- **Card e Sombras:** `.forgot-card` com `box-shadow: var(--shadow-panel)` e animação `@keyframes slideUp`.
- **Efeitos de Hover:** `.forgot-button:hover` com `transform: translateY(-2px)` e sombra colorida `rgba(215, 25, 32, 0.3)`.
- **Correção Proposta:** Substituir o fundo gradiente por fundo sólido neutro (`var(--surface)`); unificar estilos dos formulários com os do restante do app; remover elevação no botão.

### 2.3 `ObrasPage.jsx` e `ProjectList.jsx`
- **Eyebrow Redundante:** `<PageHeader eyebrow="Obras" title="Obras" />` — o eyebrow repete o h1 e a rota ativa.
- **Card dentro de Card:** `.project-list-panel` (painel pai com borda e background) contendo múltiplos `.entity-row.project-entity-row` (cards filhos com borda, sombra e raio de 14px).
- **Borda Dupla / Anel de Destaque:** `.project-entity-row.is-project-active` com `box-shadow: 0 0 0 3px rgba(46, 155, 98, 0.14), 0 8px 20px rgba(46, 155, 98, 0.1)`.
- **Rótulos em Caixa Alta:** `.project-section-label` ("OBRA SELECIONADA", "OUTRAS OBRAS") com `text-transform: uppercase`, `letter-spacing: 0.08em`.
- **Badges e Contadores em Pílula:** `.count-badge` com raio `999px`; `.period-badge` com raio `999px` e `text-transform: uppercase`.
- **Ícones em Caixinhas:** `.entity-icon` encapsulando `<Building2>` em caixa colorida circular/arredondada.
- **Correção Proposta:** Remover eyebrow do header; transformar a lista em superfície única plana com divisores horizontais (`border-bottom: 1px solid var(--line)`); substituir o anel de glow por barra lateral indicadora de 3px verde (`var(--green)`) e tag "Ativa"; remover caixa alta nos rótulos de seção.

### 2.4 `ChamadaPage.jsx`
- **Eyebrow Redundante:** `<PageHeader eyebrow="Frequência diária" title="Chamada da Quinzena" />`.
- **Chips e Pílulas:** `.summary-chip-row` com `.summary-chip` (raio `999px`), cada um com `.chip-dot` circular colorido.
- **Badges em Caixa Alta:** `<span className="day-tab-start-badge day-tab-start">INÍCIO</span>` e `<span className="day-tab-start-badge day-tab-end">FIM</span>`.
- **Rótulos Minúsculos em Caixa Alta:** `.attendance-date-field > span` (`font-size: 0.45rem`, uppercase); `.attendance-report-dates label span` (`font-size: 0.50rem`, uppercase).
- **Vulnerabilidade de Zoom iOS:** `.attendance-report-dates input` com `font-size: 0.58rem` (~9.3px), provocando auto-zoom do Safari no toque.
- **Botões de Frequência:** `.attendance-button` com gradientes, cantos de 13px e preenchimento animado.
- **Correção Proposta:** Remover eyebrow; transformar chips em texto informativo sóbrio ou barra de métricas plana; padronizar inputs de data para `font-size: 16px` no mobile; limpar badges de início/fim mantendo apenas indicador discreto.

### 2.5 `EquipePage.jsx` e `EmployeeList.jsx`
- **Eyebrow Redundante:** `<PageHeader eyebrow="Equipe" title="Funcionários" />`.
- **Card dentro de Card:** Linhas de funcionários renderizadas como cards individuais `.entity-row` com sombra e raio independente.
- **Avatares com Gradiente:** `.avatar` e `.entity-avatar` com `linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)`.
- **Animações Decorativas:** `.entity-row.is-newly-added` com `animation: employee-added-pulse 1.4s ease-in-out 2`.
- **Contador em Pílula:** `.count-badge` ao lado do título.
- **Correção Proposta:** Remover eyebrow; transformar lista em tabela/lista plana com divisores; usar cores sólidas para os avatares; remover animação de pulso.

### 2.6 `RelatoriosPage.jsx`
- **Eyebrows Redundantes:** `<PageHeader eyebrow="Relatórios" title="Relatórios e Fechamento" />` e `<p className="eyebrow">Fechamento da chamada</p>`.
- **Card dentro de Card:** `.panel.report-panel` contém o card `.total-consolidado-card` (superfície dentro de superfície).
- **Rótulos em Caixa Alta:** `.total-consolidado-label` com `text-transform: uppercase`, `letter-spacing: 0.06em`; `.print-closing-badge` com `text-transform: uppercase`.
- **Correção Proposta:** Eliminar eyebrows; unificar bloco consolidado como rodapé/resumo integrado sem caixa de card destacada com fundo especial.

### 2.7 `GastosPage.jsx`
- **Eyebrow Redundante:** `<PageHeader eyebrow="Custos" title="Gastos por obra" />`.
- **Card dentro de Card:** `.form-card` renderizado acima de `.panel.expense-list-panel`, que por sua vez contém múltiplas linhas `.expense-row` com bordas e fundos individuais.
- **Chips e Badges:** `.summary-chip-row.expense-summary` com pílulas arredondadas de raio `999px`.
- **Correção Proposta:** Remover eyebrow; estruturar a lista de gastos com divisores de 1px sem cards internos; unificar botões com o padrão do sistema.

### 2.8 `TemaPage.jsx`
- **Eyebrow Redundante:** `<PageHeader eyebrow="Aparência" title="Tema" />`.
- **Ícones em Caixinhas Coloridas:** `.theme-option-icon` com raio `999px` e sombras.
- **Correção Proposta:** Remover eyebrow; simplificar os botões de seleção de tema com superfícies planas e contorno sóbrio.

### 2.9 `AppHeader.jsx`, `BottomNav.jsx` e `ProjectSelect.jsx`
- **Forçamento de Caixa Alta:** `AppHeader.jsx` utiliza `label.toUpperCase()` em todos os links desktop (`src/components/AppHeader.jsx:39`).
- **Seletor Customizado:** `ProjectSelect.jsx` implementa dropdown complexo com divs e botões, rótulo em caixa alta "SELECIONAR EMPRESA" em vez do padrão semântico "Obra", e borda `2px solid #aeb8c3`.
- **Correção Proposta:** Remover `.toUpperCase()` dos itens de navegação (usar Title Case ou caixa de frase); padronizar o seletor de obra como um controle padronizado com label "Obra".

---

## 3. Inventário Completo de Controles de Formulário

### 3.1 Elementos `<select>`
| # | Arquivo | Linha | Contexto | Estilização Atual | Defeito Identificado |
|---|---|---|---|---|---|
| 1 | `src/components/EmployeeForm.jsx` | 97 | Obra vinculada (cadastro) | `.field` (`src/index.css`) | Sem `appearance: none`, seta nativa inconsistente, sem altura mínima de 44px garantida |
| 2 | `src/components/EditEmployeeModal.jsx` | 91 | Obra vinculada (edição) | `.field` (`src/index.css`) | Sem `appearance: none`, seta nativa inconsistente, sem altura mínima de 44px garantida |
| 3 | `src/components/ProjectSelect.jsx` | 37-67 | Obra ativa (Chamada/Equipe/Gastos/Relatórios) | Componente customizado (div + botões + menu flutuante) | Rótulo em caixa alta ("SELECIONAR EMPRESA"), borda dura de 2px, não utiliza elemento semântico de formulário |

### 3.2 Elementos `<input>`
| # | Arquivo | Linha | Tipo | id / name | Estilização Atual | Defeito Identificado |
|---|---|---|---|---|---|---|
| 1 | `src/pages/LoginPage.jsx` | 67 | `email` | `email` | `.form-group input` (`LoginPage.css`) | Estilo isolado/duplicado, não usa componente compartilhado |
| 2 | `src/pages/LoginPage.jsx` | 81 | `password` | `password` | `.form-group input` (`LoginPage.css`) | Estilo isolado/duplicado, não usa componente compartilhado |
| 3 | `src/pages/ForgotPasswordPage.jsx` | 88 | `email` | `recovery-email` | `.form-group input` (`ForgotPasswordPage.css`) | Estilo duplicado, falta regra anti-zoom no mobile |
| 4 | `src/pages/ForgotPasswordPage.jsx` | 112 | `password` | `new-password` | `.form-group input` (`ForgotPasswordPage.css`) | Estilo duplicado, falta regra anti-zoom no mobile |
| 5 | `src/pages/ForgotPasswordPage.jsx` | 125 | `password` | `confirm-password` | `.form-group input` (`ForgotPasswordPage.css`) | Estilo duplicado, falta regra anti-zoom no mobile |
| 6 | `src/pages/GastosPage.jsx` | 169 | `text` | `expense-description` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 7 | `src/pages/GastosPage.jsx` | 182 | `text` | `expense-category` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 8 | `src/pages/GastosPage.jsx` | 195 | `date` | `expense-spentAt` | `.field` (`index.css`) | Indicador nativo de calendário não padronizado |
| 9 | `src/pages/GastosPage.jsx` | 207 | `number` | `expense-quantity` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 10 | `src/pages/GastosPage.jsx` | 220 | `number` | `expense-unitValue` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 11 | `src/pages/GastosPage.jsx` | 235 | `number` | `expense-total` | `.field` (`index.css`) | ReadOnly com fundo e estilo genérico |
| 12 | `src/components/EmployeeForm.jsx` | 51 | `text` | `employee-name` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 13 | `src/components/EmployeeForm.jsx` | 66 | `text` | `employee-role` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 14 | `src/components/EmployeeForm.jsx` | 81 | `number` | `employee-rate` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 15 | `src/components/EmployeeForm.jsx` | 120 | `text` | `employee-pix` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 16 | `src/components/ProjectForm.jsx` | 29 | `text` | `project-name` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 17 | `src/components/ProjectForm.jsx` | 51 | `radio` | `closing-period` | `.period-option` com gradiente | Gradiente decorativo e sombra quando selecionado |
| 18 | `src/components/EditEmployeeModal.jsx` | 45 | `text` | `edit-employee-name` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 19 | `src/components/EditEmployeeModal.jsx` | 60 | `text` | `edit-employee-role` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 20 | `src/components/EditEmployeeModal.jsx` | 75 | `number` | `edit-employee-rate` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 21 | `src/components/EditEmployeeModal.jsx` | 110 | `text` | `edit-employee-pix` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 22 | `src/components/EditProjectModal.jsx` | 38 | `text` | `edit-project-name` | `.field` (`index.css`) | Sem `min-height: 44px` explícito |
| 23 | `src/components/EditProjectModal.jsx` | 56 | `radio` | `edit-closing-period` | `.period-option` com gradiente | Gradiente decorativo e sombra quando selecionado |

### 3.3 Elementos `<textarea>`
| # | Arquivo | Linha | id | Estilização Atual | Defeito Identificado |
|---|---|---|---|---|---|
| 1 | `src/pages/GastosPage.jsx` | 248 | `expense-notes` | `.field.field-textarea` (`index.css`) | Estilização manual inline sem componente padronizado |

### 3.4 Seletores de Período e Data Customizados
| # | Arquivo | Linha | Componente | Finalidade | Defeito Identificado |
|---|---|---|---|---|---|
| 1 | `src/components/DatePickerField.jsx` | 59-108 | `DatePickerField` | Seleção de data na Chamada e Relatórios | Rótulo em caixa alta e vermelho (`.report-date-label`); input oculto associado com fonte de 9.3px causando auto-zoom no Safari iOS |
| 2 | `src/components/ProjectForm.jsx` | 50-66 | Segmented/Radio | Escolha semanal vs quinzenal | Feito com labels + radio buttons usando gradiente vermelho e sombras coloridas |
| 3 | `src/components/EditProjectModal.jsx` | 50-66 | Segmented/Radio | Escolha semanal vs quinzenal na edição | Duplicação do mesmo padrão de gradiente vermelho do ProjectForm |

---

## 4. Plano de Padronização para as Próximas Fases

1. **Tokens de Formulário e CSS Base:**
   - Criar variáveis unificadas para campos (`--field-height: 44px`, `--field-font-size: 16px`, `--field-radius: 6px`, `--field-border: var(--line)`).
   - Configurar `appearance: none;` para `<select>` com seta SVG discreta via `background-image`.
2. **Criação dos Componentes Base Compartilhados:**
   - `src/components/ui/Field.jsx` — Container semântico com `<label>`, hint e mensagem de erro acessível.
   - `src/components/ui/Input.jsx` — Input estilizado com altura mínima de 44px e fonte de 16px no mobile.
   - `src/components/ui/Select.jsx` — `<select>` nativo estilizado com seta customizada e acessibilidade completa.
   - `src/components/ui/Textarea.jsx` — Textarea padronizado com redimensionamento vertical.
   - `src/components/ui/SegmentedControl.jsx` — Controle segmentado plano (sem gradientes ou anéis duplos) para escolhas binárias.
3. **Migração Sequencial Tela por Tela:**
   - Um commit por tela, testando `npm run lint` e `npm run build` a cada passo.
