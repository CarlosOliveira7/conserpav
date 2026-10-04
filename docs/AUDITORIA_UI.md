# Auditoria de UI — Conserpav

**Data:** 2026-10-04  
**Objetivo:** Mapeamento minucioso de redundâncias estruturais, contêineres aninhados, bordas duplicadas e padrões "vibe coded" na interface do front-end antes da refatoração visual.

---

## 1. Mapeamento por Tela e Componente

### 1.1 Tela de Obras (`src/pages/ObrasPage.jsx` e `src/components/ProjectList.jsx`)

| Elemento / Trecho | Arquivo e Linha / Classe | Problema Encontrado | Padrão da Spec | Correção Proposta |
| :--- | :--- | :--- | :--- | :--- |
| Eyebrow "OBRAS" | `ObrasPage.jsx:12`<br>`.page-header-eyebrow` | Eyebrow em caixa alta repetindo o título "Obras" que fica logo abaixo. | §1.2 Rótulos redundantes | Remover eyebrow; manter apenas `h1` sóbrio com texto "Obras". |
| Botão "Cadastrar obra" | `ObrasPage.jsx:16`<br>`.register-button` | Largura 100% no desktop, cor verde competindo com ação primária. | §1.4 Botões | No desktop alinhar à direita do título com largura do conteúdo; no mobile manter 100%. |
| Painel externo "Obras cadastradas" | `ProjectList.jsx:13-16`<br>`.project-list-panel`, `.list-header` | Card externo com fundo, borda e raio contendo novos cards internos de cada obra (card dentro de card). | §1.1 Contêineres aninhados | Remover a moldura externa do painel; renderizar a lista diretamente com divisor `1px` entre as linhas. |
| Contador em pílula "2" | `ProjectList.jsx:16`<br>`.count-badge` | Pílula verde com borda e contador decorativo ao lado do título. | §1.2 Rótulos redundantes | Remover a pílula; exibir metadado simples "N obras cadastradas" em texto secundário quando relevante. |
| Rótulos de seção em caixa alta | `ProjectList.jsx:23, 29`<br>`.project-section-label` | Textos "OBRA SELECIONADA" e "OUTRAS OBRAS" em caixa alta com letter-spacing largo. | §1.2 Rótulos redundantes | Remover os separadores artificiais; a obra ativa se destaca por indicador de estado ("Ativa" + barra lateral). |
| Card de obra com borda dupla e glow | `src/index.css:113-117`<br>`.is-project-active` | `border: 2px solid #2e9b62; border-left-width: 6px; box-shadow: 0 0 0 3px rgba(46, 155, 98, 0.14), 0 8px 20px ...` (anel + glow + borda). | §1.1 Bordas estranhas | Substituir por borda de 1px padrão + barra lateral de 3px na cor primária sem anel ou sombra. |
| Fundo verde/azulado no ativo | `src/index.css:115`<br>`background: #edf8f1` | Quebra a superfície neutra da lista com fundo colorido saturado. | §1.1 Fundos quebrados | Usar a mesma superfície neutra ou variação monocromática muito sutil (`--surface-hover`). |
| Tile de ícone do prédio | `ProjectList.jsx:50`<br>`.entity-icon` | Ícone `Building2` em caixa quadrada colorida em cada linha. | §1.3 Ícones decorativos | Remover o tile; exibir o nome da obra diretamente com peso 600. |
| Nome centralizado com spacer | `ProjectList.jsx:51-52`<br>`.project-title-spacer` | Gambiarra de layout (`span.project-title-spacer`) para forçar centralização do nome da obra. | §1.5 Alinhamento | Remover spacer e centralização forçada; alinhar nome e metadados à esquerda. |
| Badge de período | `ProjectList.jsx:55-57`<br>`.period-badge-list` | Pílula com borda "PERÍODO: QUINZENAL". | §1.3 Badges decorativos | Texto secundário simples: "Fechamento quinzenal" na linha de metadados. |
| Botão "Selecionar obra" | `ProjectList.jsx:62-64`<br>`.mini-action` | Botão outlined com hover vermelho (`var(--tint-danger-bg)`), confundindo seleção com exclusão. | §1.4 Botões e hierarquia | Tornar a linha clicável com `aria-current="true"` na ativa e botão secundário neutro discreto. |
| Botão "Excluir" em destaque | `ProjectList.jsx:69`<br>`ConfirmButton` | Botão de exclusão com mesma borda e presença dos botões normais. | §1.4 Botões e hierarquia | Botão de texto discreto na cor de erro; confirmação em dois passos mantida. |

---

### 1.2 Tela de Equipe (`src/pages/EquipePage.jsx` e `src/components/EmployeeList.jsx`)

| Elemento / Trecho | Arquivo e Linha / Classe | Problema Encontrado | Padrão da Spec | Correção Proposta |
| :--- | :--- | :--- | :--- | :--- |
| Eyebrow "EQUIPE" | `EquipePage.jsx:19`<br>`.page-header-eyebrow` | Eyebrow duplicado acima do título "Funcionários". | §1.2 Rótulos redundantes | Remover eyebrow; manter `h1` "Equipe". |
| Botão "Cadastrar funcionário" | `EquipePage.jsx:23`<br>`.employee-add-toggle` | Botão largo ocupando 100% no desktop. | §1.4 Botões | Alinhar ao topo/cabeçalho no desktop; 100% apenas no mobile. |
| Cabeçalho redundante da lista | `EmployeeList.jsx:27-30`<br>`.list-header`, `.form-title` | Bloco "Equipe cadastrada" com pílula de contador verde. | §1.2 Rótulos redundantes | Remover título repetido e pílula; exibir lista limpa. |
| Avatar circular em toda linha | `EmployeeList.jsx:48-50`<br>`.entity-avatar` | Círculo colorido com iniciais gerando poluição visual em lista operacional. | §1.3 Ícones/badges decorativos | Exibir nome diretamente alinhado à esquerda com cargo e diária em colunas claras. |
| Valor da diária e alinhamento | `EmployeeList.jsx:59`<br>`.entity-rate` | Valor monetário misturado nas ações sem alinhamento tabular à direita. | §1.5 Alinhamento | Alinhar valor da diária à direita com `font-variant-numeric: tabular-nums`. |
| Estado recém-adicionado com pulso | `src/index.css:1488-1491`<br>`.employee-added-pulse` | Animação de pulso verde com glow (`box-shadow: 0 0 0 3px ...`) por 2.8 segundos. | §1.6 Efeitos e movimento | Remover animação de pulso e glow; scroll suave simples é suficiente. |

---

### 1.3 Tela de Chamada (`src/pages/ChamadaPage.jsx`)

| Elemento / Trecho | Arquivo e Linha / Classe | Problema Encontrado | Padrão da Spec | Correção Proposta |
| :--- | :--- | :--- | :--- | :--- |
| Eyebrow "FREQUÊNCIA DIÁRIA" | `ChamadaPage.jsx:91`<br>`.page-header-eyebrow` | Eyebrow em caixa alta repetindo o título da chamada. | §1.2 Rótulos redundantes | Remover eyebrow; título direto "Chamada". |
| Resumo com gradiente e chips | `ChamadaPage.jsx:100-113`<br>`.summary-chip-row` | Chips com bolinhas coloridas e raios arredondados redundantes; gradiente vermelho no cabeçalho. | §1.1 e §1.6 Efeitos | Resumo compacto e plano em uma linha sóbria: "X completas · Y meias · Z ausências". |
| Badges "INÍCIO" e "FIM" nas abas de dia | `ChamadaPage.jsx:186-196`<br>`.day-tab-start-badge` | Badges em caixa alta com ícone `CalendarCheck` dentro das abas de segunda e sábado. | §1.3 Badges decorativos | Remover badges artificiais; os dias da semana (Seg a Sáb) comunicam naturalmente o período. |
| Botões de chamada com glow | `src/index.css:964-987`<br>`.attendance-button:hover` | Glow colorido alto (`box-shadow: 0 7px 18px rgba(8, 120, 58, 0.32)`), elevação em hover. | §1.6 Efeitos e movimento | Superfície sólida sem sombra; distinção por texto/ícone claro legível sob sol. |

---

### 1.4 Tela de Relatórios (`src/pages/RelatoriosPage.jsx`)

| Elemento / Trecho | Arquivo e Linha / Classe | Problema Encontrado | Padrão da Spec | Correção Proposta |
| :--- | :--- | :--- | :--- | :--- |
| Eyebrow duplo e títulos repetidos | `RelatoriosPage.jsx:95, 125, 126` | Eyebrow "Relatórios" + Título "Relatórios e Fechamento" + Eyebrow "Fechamento da chamada" + Título "Relatório de pagamento". | §1.2 Rótulos redundantes | Manter UM único título claro na página ("Relatório de pagamento"). |
| Card de cabeçalho com molduras aninhadas | `RelatoriosPage.jsx:103-145`<br>`.report-panel`, `.report-head-row` | Moldura dentro de moldura com badges da obra duplicados. | §1.1 Contêineres aninhados | Estrutura plana de documento contínuo. |
| Tabela de relatório sem alinhamento tabular | `src/index.css:2520-2590`<br>`.report-table` | Valores de diária e totais sem alinhamento à direita e sem `tabular-nums`. | §1.5 Alinhamento | Alinhar valores monetários estritamente à direita com `font-variant-numeric: tabular-nums`. |

---

### 1.5 Tela de Gastos (`src/pages/GastosPage.jsx`) — Verificação de Navegação vs Documento

> **Nota sobre GastosPage (§2 da spec):**
> O Documento Técnico v2.0 mencionava a tela de Gastos como futura/não implementada, mas ela **de fato existe** no repositório, com endpoints dedicados no backend (`/api/expenses`), serviço (`expenses.service.js`) e tabela de banco de dados (`project_expenses`).
> **Conclusão:** Não é duplicata de Relatórios (Relatórios trata de diárias da equipe; Gastos trata de insumos/materiais/combustível da obra).
> **Recomendação:** **Manter a tela** e aplicar o mesmo saneamento visual sóbrio (eliminar card dentro de card, unificar lista, botões e alinhamentos).

| Elemento / Trecho | Arquivo e Linha / Classe | Problema Encontrado | Padrão da Spec | Correção Proposta |
| :--- | :--- | :--- | :--- | :--- |
| Eyebrow "CUSTOS" | `GastosPage.jsx:115` | Eyebrow repetindo o contexto do título "Gastos por obra". | §1.2 Rótulos redundantes | Remover eyebrow; título direto "Gastos". |
| Cards de resumo de gastos com glow | `GastosPage.jsx:128-142`<br>`.expense-summary-card` | Cards com elevação e gradientes leves. | §1.1 e §1.6 | Resumo sóbrio de totais em superfície plana com borda simples de 1px. |
| Ações de gastos com botões outlined | `GastosPage.jsx:280-305` | "Excluir" com borda vermelha e "Quitar" com mesmo peso. | §1.4 Botões | "Quitar" como ação secundária neutra; "Excluir" como texto perigoso discreto. |

---

### 1.6 Cabeçalho Global e Navegação (`AppHeader.jsx`, `BottomNav.jsx`, `TemaPage.jsx`)

| Elemento / Trecho | Arquivo e Linha / Classe | Problema Encontrado | Padrão da Spec | Correção Proposta |
| :--- | :--- | :--- | :--- | :--- |
| Rótulos de navegação em caixa alta | `AppHeader.jsx:39`<br>`{label.toUpperCase()}` | Rótulos como "OBRAS", "CHAMADA" forçados em caixa alta. | §1.2 Rótulos redundantes | Usar caixa de frase normal ("Obras", "Chamada", "Equipe"). |
| Ícones no desktop nav | `AppHeader.jsx:38`<br>`<Icon size={16} />` | Ícones em todos os links da barra superior no desktop. | §1.3 Ícones decorativos | No desktop usar apenas texto + indicador ativo; manter ícones na barra inferior mobile. |
| Botão "Sair" vermelho sólido | `AppHeader.jsx:46`<br>`.app-header-logout` | Botão vermelho preenchido chamando mais atenção que o conteúdo da página. | §1.4 Botões e hierarquia | Botão discreto com ícone neutro ou texto "Sair" com contraste suave e hover funcional. |
| Barra inferior com sombra difusa | `src/index.css:605`<br>`.bottom-nav` | `box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06);` | §1.6 Efeitos | Remover sombra difusa; manter apenas borda superior sólida de 1px (`border-top: 1px solid var(--line)`). |
| Botão voltar ao topo com pílula 999px e sombra | `src/index.css:645-648`<br>`.back-to-top` | `border-radius: 999px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);` | §1.1 e §1.6 | Raio consistente de 6px e borda simples de 1px. |

---

### 1.7 Telas de Acesso (`LoginPage.jsx` e `ForgotPasswordPage.jsx`)

| Elemento / Trecho | Arquivo e Linha / Classe | Problema Encontrado | Padrão da Spec | Correção Proposta |
| :--- | :--- | :--- | :--- | :--- |
| Fundo com gradiente na recuperação | `ForgotPasswordPage.css:7` | `background: linear-gradient(135deg, var(--red) 0%, var(--orange) 100%);` | §1.6 Efeitos | Fundo sólido neutro (`var(--surface)` ou `--paper`), idêntico à tela de login. |
| Animação `@keyframes slideUp` | `LoginPage.css:77`, `ForgotPasswordPage.css:44` | Animação de subida artificial de 0.4s nos cards de formulário. | §1.6 Efeitos | Remover animação; transição instantânea e funcional. |
| Glow e elevação no botão de entrar/recuperar | `LoginPage.css:165`, `ForgotPasswordPage.css:121` | `box-shadow: 0 6px 16px rgba(215, 25, 32, 0.25); transform: translateY(-2px);` | §1.6 Efeitos | Botão plano com transição de cor de fundo sem elevação nem sombra difusa. |
| Sombra gigante no card de login | `LoginPage.css:74`<br>`box-shadow: var(--shadow-panel)` | Sombra difusa de 46px (`0 18px 46px rgba(0,0,0,0.07)`). | §1.6 Efeitos | Borda sólida de 1px (`border: 1px solid var(--line)`) e raio de 8px. |

---

## 2. Padrões de Código "Vibe Coded" Catalogados

1. **Markup Semântico:**
   - Listas de obras e funcionários usam `div` e `p` soltos em vez de estruturas semânticas `ul > li` limpas.
   - Presença de tags cosméticas de preenchimento de espaço (ex.: `<span className="project-title-spacer" />`).
2. **Componentes Duplicados para Unificação:**
   - `PageHeader.jsx`: eliminar o `eyebrow` e o ícone supérfluo, mantendo apenas título e container de ações.
   - `Button.jsx`: criar componente unificado para variantes `primary`, `secondary` e `danger` (eliminando a dispersão entre `.primary-button`, `.register-button`, `.mini-action`, `.employee-action`, etc.).
   - `ListRow.jsx`: componente de linha de lista com divisor de 1px e indicador lateral para itens selecionados.
   - `EmptyState.jsx`: substituir mensagens soltas em `<p className="empty-box">` por componente padrão sóbrio de 1 linha.
3. **CSS Monolítico:**
   - `src/index.css` possui 3.379 linhas com seletores profundos (ex.: `.project-entity-row.is-project-active .entity-actions .mini-action.is-active-state`), dezenas de `!important` e valores fixos soltos.
   - Plano: extrair `src/tokens.css` e organizar estilos limpos por componente.

---

## 3. Próximos Passos (Fases da Spec)

- **Fase 2:** Criar os componentes base unificados (`PageHeader`, `Button`, `ListRow`, `Field`, `EmptyState`) e o arquivo `tokens.css`.
- **Fase 3:** Refatorar a **Tela de Obras** como piloto e apresentar o resultado para validação visual antes de seguir para as demais telas.
