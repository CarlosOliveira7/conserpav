# AUDITORIA — Conserpav v2.0

**Data:** 2026-10-04  
**Revisor:** Engenheiro sênior (auditoria automatizada + análise manual)  
**Branch auditada:** `refactor/feature-kaio-mvp`

---

## Sumário executivo

O projeto saiu de uma prova-de-conceito com Supabase e foi migrado manualmente para uma API Express + PostgreSQL própria. A migração é funcional, porém deixou várias lacunas de segurança, qualidade e arquitetura que precisam ser corrigidas antes de qualquer uso em produção. Os achados estão agrupados abaixo por área e ordenados por severidade.

**Legenda de severidade:** 🔴 Crítica | 🟠 Alta | 🟡 Média | 🟢 Baixa/Info

---

## 1. Segurança — Autenticação e sessão

| # | Arquivo | Linha | Problema | Severidade | Correção proposta |
|---|---------|-------|----------|-----------|-------------------|
| S-01 | `server/src/auth.js` | 17 | `jwt.verify()` não especifica o parâmetro `algorithms`. Sem essa restrição, um atacante pode forçar o algoritmo `none` (bypass total) ou `RS256` com uma chave pública qualquer. | 🔴 | Adicionar `{ algorithms: ['HS256'] }` como terceiro argumento de `jwt.verify()`. |
| S-02 | `src/lib/http.js` | 6–10 | Token JWT armazenado em `localStorage`. Qualquer script injetado (XSS) pode roubar o token e se passar pelo usuário indefinidamente. | 🔴 | Migrar para cookie `httpOnly; Secure; SameSite=Lax`, sem exposição ao JS. |
| S-03 | `server/src/config.js` | 17 | `JWT_EXPIRES_IN` padrão é `7d`. Um token de 7 dias comprometido permanece válido por até 7 dias sem possibilidade de revogação (não há refresh-token nem blocklist). | 🟠 | Reduzir para `8h` (decisão documentada) e registrar. Se quiser token curto + renovação, implementar refresh rotativo. |
| S-04 | `server/src/index.js` | 34 | `MIN_PASSWORD = 6`. Senha de 6 caracteres é muito fraca para uma aplicação com dados financeiros. Também viola a especificação, que exige mínimo 8. | 🟠 | Aumentar para 8 em `index.js` **e** em `server/scripts/create-user.js` (linha 7, que valida `< 6`). |
| S-05 | `server/src/index.js` | 119, 139 | `bcrypt.hash(password, 10)` — custo 10. O recomendado atual para `bcryptjs` em hardware moderno é 12+. | 🟠 | Elevar para `12` nas duas ocorrências (reset e troca de senha). Custo 10 existente no `create-user.js` linha 13 também. |
| S-06 | `server/src/events.js` | 17 | SSE broadcast **sem filtro de usuário**: qualquer autenticado recebe os eventos de **todos** os usuários (todos os projects, employees, attendance). Não há `owner_id` filtrado no NOTIFY. | 🔴 | Após adicionar `owner_id` em `projects`, enriquecer o payload do NOTIFY com `owner_id` e filtrar no `eventsHandler` enviando apenas para a conexão SSE do dono correto. |
| S-07 | `server/src/index.js` | 25 | `express.json({ limit: '100kb' })` — limite de 100 KB é 10× maior que o necessário para qualquer payload desta API, ampliando janela de ataque por flood. | 🟢 | Reduzir para `'10kb'`. |
| S-08 | `server/src/index.js` | 18–27 | CORS sem `credentials: true` — não impede cookie `httpOnly` (não há cookie agora), mas ao migrar será necessário. Sem `helmet`, sem cabeçalhos de segurança (`CSP`, `HSTS`, `X-Frame-Options`, etc.). | 🟠 | Adicionar `helmet()` antes do CORS; ajustar CORS para incluir `credentials: true` após migrar para cookie. |
| S-09 | `docker-compose.yml` | 26 | `JWT_SECRET: troque-este-segredo-em-producao` — segredo fraco e literal no `docker-compose.yml` versionado. Em desenvolvimento é aceitável, mas o valor é óbvio. | 🟡 | Documentar que o valor deve ser sobrescrito via variável do host; adicionar aviso no README; no futuro usar `docker-compose.override.yml` ou secrets do Docker. |
| S-10 | `server/src/index.js` | 175–177 | `GET /api/projects` retorna **todas** as obras, sem filtrar por usuário autenticado. Ausência de `owner_id` em `projects`: se houver dois usuários, um vê os dados do outro (IDOR). | 🔴 | Adicionar coluna `owner_id` (FK `users.id`) em `projects`; filtrar todas as queries com `WHERE owner_id = $req.user.id`. |
| S-11 | `server/src/index.js` | 236–243 | `GET /api/employees` retorna **todos** os funcionários sem filtrar por projeto do usuário autenticado (IDOR). | 🔴 | Filtrar por `project_id IN (SELECT id FROM projects WHERE owner_id = $1)`. |
| S-12 | `server/src/index.js` | 329–336 | `GET /api/expenses` retorna **todos** os gastos sem filtro de dono (IDOR). | 🔴 | Idem S-11. |
| S-13 | `server/src/index.js` | 404–436 | `GET/PUT /api/attendance` sem filtro de dono. Um usuário pode ler ou gravar frequência de funcionários de outro usuário. | 🔴 | Filtrar attendance pelos employee_ids que pertencem ao usuário. |
| S-14 | `server/src/index.js` | 194–216 | `PUT /api/projects/:id` e `DELETE /api/projects/:id` não verificam se o projeto pertence ao usuário autenticado antes de editar/excluir. | 🔴 | Adicionar `WHERE id = $id AND owner_id = $user_id` nas queries de UPDATE/DELETE. |
| S-15 | `src/lib/realtime.js` | 26 | Token JWT enviado **na query string** não (o header `Authorization` é enviado corretamente via `fetch`). Porém, se o `EventSource` nativo for adotado no futuro, o token iria na URL. Situação atual: OK. Documentar a decisão de usar `fetch` em vez de `EventSource`. | 🟢 | Documentar em `DECISOES.md`. |
| S-16 | `server/src/auth.js` | 26–44 | Rate limiter de login implementado **em memória** no processo. Em escalonamento horizontal (múltiplos processos/containers) o estado é perdido entre instâncias. Em reinicializações, o contador zera. | 🟡 | Usar `express-rate-limit` com store Redis/memória compartilhada ou, para mono-processo, manter a solução atual e documentar a limitação. |
| S-17 | `server/src/index.js` | 99 | `/api/auth/forgot` não invalida tokens anteriores do mesmo usuário ao emitir um novo. Um atacante que intercepte um link antigo ainda pode usá-lo se não expirou. | 🟠 | `UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL` antes de inserir o novo token. |
| S-18 | `server/src/index.js` | 441–442 | `console.error('[api] erro:', err)` pode vazar stack traces de SQL no stderr em produção. Em ambientes com log agregado, isso expõe schema interno. | 🟡 | Usar logging estruturado (pino) e nunca logar `err.stack` inteiro para erros de banco; logar apenas `err.message` + `err.code`. |

---

## 2. Banco de dados

| # | Arquivo | Linha | Problema | Severidade | Correção proposta |
|---|---------|-------|----------|-----------|-------------------|
| D-01 | `database/schema.sql` | 46–54 | `projects` não tem coluna `owner_id`. Sem ela, não há como fazer isolamento multi-tenant na API. | 🔴 | Adicionar `owner_id UUID NOT NULL REFERENCES users(id)` com migração que atribui ao único usuário existente. |
| D-02 | `database/schema.sql` | 75 | `attendance_records.week_start` não tem `CHECK` para garantir que é segunda-feira (`EXTRACT(ISODOW FROM week_start) = 1`). O banco aceita datas inválidas silenciosamente. | 🟠 | Adicionar constraint de check. |
| D-03 | `database/schema.sql` | 64 | `employees` não tem coluna `updated_at`. Algumas tabelas têm, outras não — inconsistência. | 🟢 | Adicionar `updated_at timestamptz NOT NULL DEFAULT now()` e trigger de atualização automática. |
| D-04 | `database/schema.sql` | 82 | Índice em `attendance_records(week_start)` existe, mas falta índice composto `(employee_id, week_start)` que é o padrão de acesso mais comum (query de frequência por funcionário+semana). | 🟡 | Adicionar `CREATE INDEX IF NOT EXISTS attendance_employee_week_idx ON attendance_records(employee_id, week_start)`. |
| D-05 | `database/schema.sql` | 108–134 | O payload do NOTIFY (`row_to_json(NEW/OLD)`) inclui **todos** os campos da linha, inclusive `pix_key` dos funcionários e potencialmente `password_hash` (se a tabela `users` tiver trigger no futuro). | 🟠 | Limitar o payload do NOTIFY a `{ id, table, eventType, owner_id }` — sem dados sensíveis. |
| D-06 | `database/schema.sql` | 50 | `closing_period` tem CHECK mas não há ENUM nem constraint de nome único POR DONO. Com `owner_id`, a unicidade de `name` deve ser `UNIQUE(name, owner_id)`. | 🟡 | Substituir `UNIQUE(name)` por `UNIQUE(name, owner_id)` após adicionar `owner_id`. |
| D-07 | `server/scripts/migrate.js` | 10–11 | `pool.query(sql)` executa o `schema.sql` inteiro como uma única chamada. Sem tabela de versão (`schema_migrations`), não há como saber quais migrações já foram aplicadas; migrações futuras só podem ser "idempotentes com IF NOT EXISTS", dificultando mudanças destrutivas. | 🟠 | Criar sistema de migrações versionadas (`001_baseline.sql`, `002_owner_id.sql`, …) com tabela `schema_migrations`. |
| D-08 | `database/schema.sql` | 7 | Tipo `NUMERIC` do `daily_rate` é parseado como `float` no `db.js` (`parseFloat(value)`) para compatibilidade com o front-end anterior (Supabase). Isso derrota o propósito de usar `NUMERIC` — precisão decimal pode ser perdida com float. | 🟠 | Retornar `NUMERIC` como string do banco (remover o parser de tipo 1700) e converter para centavos inteiros nos cálculos de relatório no servidor (spec §3.4). |
| D-09 | `docker-compose.yml` | 7–8 | Senha do PostgreSQL em desenvolvimento é `conserpav/conserpav` — aceitável para dev local, mas o mesmo valor vai para `DATABASE_URL` no mesmo arquivo; documentar que deve ser alterado em produção. | 🟢 | Adicionar comentário explícito e verificar que a string de `DATABASE_URL` de prod nunca usa esse valor. |

---

## 3. Backend — Estrutura e qualidade

| # | Arquivo | Linha | Problema | Severidade | Correção proposta |
|---|---------|-------|----------|-----------|-------------------|
| B-01 | `server/src/index.js` | 1–454 | Arquivo monolítico de 454 linhas: configuração do Express, todas as rotas, validação inline, tratamento de erros — tudo misturado. Impossível testar unidades isoladas. | 🟠 | Quebrar em: `app.js` (Express), `server.js` (listen + graceful shutdown), `routes/`, `middleware/`, `services/`. |
| B-02 | `server/src/index.js` | 450 | `app.listen()` dentro de `index.js` — impossível importar o app para testes sem subir o servidor. | 🟠 | Separar em `app.js` (exporta o app) e `server.js` (faz o listen). |
| B-03 | `server/src/index.js` | 450–452 | Sem tratamento de SIGTERM/SIGINT. No Dockerfile, `node src/index.js` não recebe SIGTERM diretamente (`CMD ["sh", "-c", "..."]` usa shell como PID 1). | 🟠 | Adicionar `process.on('SIGTERM', gracefulShutdown)` que fecha o HTTP server, conexões SSE e o pool. Usar `CMD ["node", "src/server.js"]` no Dockerfile (sem shell). |
| B-04 | `server/src/index.js` | 30–39 | Validação de entrada inline em cada rota, inconsistente entre rotas. Sem schema formal (Zod). Campos como `daily_rate` aceitam qualquer número sem limite superior; `week_start` não é validado como segunda-feira; `weeks=` não tem limite de quantidade. | 🟠 | Adotar Zod para validar e parsear todos os inputs. Centralizar schemas em `server/src/schemas/`. |
| B-05 | `server/src/index.js` | 37 | Formato de erro `{ error: message }` (string). Especificação pede `{ error: { code, message } }`. | 🟡 | Padronizar para `{ error: { code, message } }` usando classe `AppError`. |
| B-06 | `server/src/index.js` | 441–448 | Middleware de erro trata apenas 23505, 23503, 22P02. Código 23514 (CHECK violation) e outros erros de constraint não são tratados, retornando "Erro interno" genérico sem pista para o usuário. | 🟡 | Adicionar tratamento para 23514 (check constraint) → 400. |
| B-07 | `server/src/db.js` | 7 | `pg.types.setTypeParser(1700, parseFloat)` — configura globalmente o parser de NUMERIC para float, o que causa perda de precisão em valores decimais usados em cálculos financeiros. | 🟠 | Remover; retornar NUMERIC como string e calcular em centavos inteiros no servidor. |
| B-08 | `server/src/config.js` | 16–17 | Não valida força do `JWT_SECRET` (tamanho mínimo de 32 bytes). Um segredo fraco como `"abc"` passa na validação. | 🟡 | Verificar `config.jwtSecret.length >= 32` (ou em bytes) e `process.exit(1)` se insuficiente. |
| B-09 | `server/src/index.js` | — | Sem `pino` ou equivalente: apenas `console.log/error`. Em produção, logs não são estruturados e podem misturar dados sensíveis. | 🟡 | Adicionar `pino` com nível configurável por env; não logar `pix_key` completa nem `password_hash`. |
| B-10 | `server/scripts/create-user.js` | 7 | Valida `password.length < 6` — inconsistente com o mínimo da API (`MIN_PASSWORD = 6`, que já deveria ser 8). | 🟡 | Equalizar para 8 após corrigir S-04. |
| B-11 | `server/src/events.js` | 22 | Reconexão com delay fixo de 3 s sem backoff exponencial. Falhas consecutivas tentam reconectar 20 vezes por minuto, podendo sobrecarregar o banco. | 🟡 | Implementar backoff exponencial com jitter (ex.: 1s, 2s, 4s, 8s, teto em 60s). |
| B-12 | `server/src/index.js` | 409–415 | `GET /api/attendance?weeks=` aceita N datas sem limite de quantidade. Um cliente pode passar 100 semanas e executar uma query pesada. | 🟡 | Limitar a máximo 4 semanas (conforme spec §3.3). |
| B-13 | `Dockerfile.api` | 10 | `CMD ["sh", "-c", "node scripts/migrate.js && node src/index.js"]` — usa shell como PID 1; sinais SIGTERM não chegam ao Node. Também: sem usuário não-root. | 🟠 | Usar `ENTRYPOINT` com script de init ou separar migração do CMD; adicionar `USER node`. |
| B-14 | `server/src/index.js` | — | Sem endpoint `GET /api/reports`. O cálculo de pagamento por funcionário está inteiramente no front-end (`buildReport` em AppContext, `buildReportRows` em RelatoriosPage) usando float — violação da spec §3.4. | 🟠 | Criar `GET /api/reports?project_id=&week_start=&weeks=` calculando no servidor com NUMERIC/centavos. |
| B-15 | `server/src/auth.js` | 4–8 | `signToken` não fixa o algoritmo (`algorithm: 'HS256'`) na assinatura. O padrão `jsonwebtoken` é HS256, mas deixar implícito é uma prática insegura e pode mudar em versões futuras da lib. | 🟡 | Adicionar `{ algorithm: 'HS256' }` no `jwt.sign()`. |

---

## 4. Frontend — Qualidade e segurança

| # | Arquivo | Linha | Problema | Severidade | Correção proposta |
|---|---------|-------|----------|-----------|-------------------|
| F-01 | `src/lib/http.js` | 6–30 | JWT em `localStorage` — ver S-02. | 🔴 | Migrar para cookie `httpOnly`. |
| F-02 | `src/context/AppContext.jsx` | 632–645 | `buildReport` calcula totais com `employee.daily_rate / 2` usando float JS — perda de precisão. Ex.: `R$ 150,00 / 2 = R$ 74,99999...` em alguns casos. | 🟠 | Mover cálculo para o servidor (B-14); no front apenas exibir os valores recebidos. |
| F-03 | `src/pages/RelatoriosPage.jsx` | 186–204 | `buildReportRows` duplica exatamente a mesma lógica de `buildReport` (AppContext). Dois lugares calculando a mesma coisa com float. | 🟠 | Eliminar após criar endpoint de relatório no servidor. |
| F-04 | `src/context/AppContext.jsx` | 484–513 | `toggleAttendance`: sem debounce/serialização por célula. Se o usuário toca duas vezes rápido na mesma célula, dois `upsert` são disparados em sequência — o segundo pode chegar antes do primeiro, resultando em estado incorreto. | 🟡 | Serializar por chave de célula (fila ou `pendingCells` bloqueando novo toque até resolver). |
| F-05 | `src/App.jsx` | 39–45 | Roteamento de autenticação via `window.location.search` em vez de React Router (`<Route path="/?recover=true">`). Solução frágil; não funciona corretamente com PWA cache ou navegação histórico. | 🟡 | Usar `<Route path="/recover">` ou `useSearchParams`. |
| F-06 | `src/pages/ChamadaPage.jsx` | 342–355, `src/pages/RelatoriosPage.jsx` | `DatePickerField` e funções auxiliares (`isOutsideMonth`, `getMonthDate`, `shiftMonth`, `formatMonth`, `getCalendarDays`, `formatDisplayDate`) **duplicadas** nos dois arquivos. | 🟡 | Extrair para componente compartilhado `src/components/DatePickerField.jsx` e funções auxiliares em `src/lib/dateUtils.js`. |
| F-07 | `src/context/AppContext.jsx` | 118 | `// eslint-disable-next-line react-hooks/exhaustive-deps` suprimindo aviso de dependências ausentes no `useEffect` que sincroniza reportStartDate/End. Dependências faltando podem causar bugs ao trocar obra ou período. | 🟡 | Revisar e corrigir as dependências sem silenciar o linter. |
| F-08 | `src/context/AppContext.jsx` | 249 | Idem: `// eslint-disable-next-line react-hooks/exhaustive-deps` no `useEffect` de carregamento de attendance. `showError` não está nas deps. | 🟡 | Envolver `showError` em `useCallback` estável (já está) e adicionar às deps. |
| F-09 | `src/context/AppContext.jsx` | 56–704 | `AppContext` exporta ~30 valores, inclui todo o estado de obras, funcionários, gastos, frequência, relatório, período — um "mega-context" que força re-render de qualquer consumidor quando qualquer parte do estado muda. | 🟡 | Separar em sub-contextos (ProjectsContext, AttendanceContext, ExpensesContext) ou memoizar seletores com `useMemo`. |
| F-10 | `src/lib/api.js` | 14–21 | Função `run()` em `api.js` faz `console.error` sempre que a API retorna erro — pode vazar dados de resposta de erro no console do navegador (ex.: "E-mail ou senha incorretos" visível no DevTools em produção). | 🟢 | Remover `console.error` de `run()` ou logar apenas em dev (`import.meta.env.DEV`). |
| F-11 | `src/context/AuthContext.jsx` | 7–10 | Comentário menciona "JWT guardado em localStorage" como fato positivo da migração. Isso deve ser atualizado após migrar para cookie. | 🟢 | Atualizar comentário após F-01. |
| F-12 | `src/pages/RelatoriosPage.jsx` | 85 | `reportReady` verifica `rows.length === activeEmployees.length` — se `activeEmployees` for `[]`, `0 === 0` é `true` e o botão de imprimir fica habilitado com relatório vazio. | 🟡 | Adicionar `&& activeEmployees.length > 0`. |
| F-13 | `public/sw.js` | 5 | `CACHE_NAME = 'obra-frequencia-shell-v1'` — valor fixo. Ao atualizar o app, o SW antigo pode servir HTML/JS stale por até o próximo activate. Sem hash de versão automático. | 🟡 | Injetar versão via Vite (plugin ou manual) no nome do cache para forçar invalidação em cada deploy. |
| F-14 | `public/sw.js` | 26 | O filtro `url.origin !== self.location.origin` deixa de fora chamadas à API somente se ela estiver em domínio diferente. Se API e front estiverem no mesmo domínio (ex.: mesmo servidor), `/api/*` pode ser cacheada inadvertidamente. | 🟡 | Adicionar `|| url.pathname.startsWith('/api/')` para nunca cachear rotas de API independente de domínio. |
| F-15 | `src/context/AppContext.jsx` | 104–106 | `periodWeekStarts` e `reportWeekStarts` (linha 108–111) limitam a 2 semanas mas não há validação de que `getWeekStartsBetween` não retorna mais de 2 quando o usuário define datas fora do padrão. | 🟢 | `slice(0, 2)` já existe em `reportWeekStarts`; verificar se `periodWeekStarts` também precisa. |

---

## 5. Dependências

| # | Arquivo | Problema | Severidade | Correção |
|---|---------|----------|-----------|----------|
| DP-01 | `server/package.json` | Faltam: `helmet`, `express-rate-limit`, `zod`, `pino`. Necessários para hardening (spec §4.5, §4.3, §3.3, §3.2). | 🟠 | Adicionar nas fases correspondentes. |
| DP-02 | `package.json` | Sem `prettier`, `eslint-plugin-react-hooks` está presente mas sem `prettier`. Sem testes (`vitest`). | 🟡 | Adicionar nas fases 7 e de limpeza. |
| DP-03 | `server/package.json` | `bcryptjs ^2.4.3` é versão antiga (2021). Checar se há CVE (npm audit). | 🟡 | Rodar `npm audit` e atualizar se houver vulnerabilidade. |
| DP-04 | Ambos | Sem CI (GitHub Actions). Sem `npm audit` automatizado. | 🟠 | Criar `.github/workflows/ci.yml` na fase 7. |

---

## 6. Resquícios do Supabase

| # | Arquivo | Linha | Ocorrência | Ação |
|---|---------|-------|-----------|------|
| SB-01 | `src/context/AppContext.jsx` | 179 | Comentário `// antes usava supabase.channel(...)` — código morto como comentário. | Remover na fase de limpeza. |
| SB-02 | `src/lib/api.js` | 12–13 | Comentário menciona "migração Supabase → PostgreSQL próprio" — historicamente válido, mas poluição do código. | Remover. |
| SB-03 | `src/context/AuthContext.jsx` | 7–10 | Comentário idem sobre Supabase. | Remover. |
| SB-04 | `src/lib/realtime.js` | 6 | Comentário "mesmo formato que o Supabase Realtime usava". | Remover. |
| SB-05 | `src/lib/http.js` | 1 | Comentário "Substitui o antigo cliente Supabase". | Remover. |
| SB-06 | `database/schema.sql` | 5–9 | Comentários sobre migração do Supabase. Informativos, mas podem ser condensados. | Simplificar. |
| SB-07 | `server/src/db.js` | 4–5 | Comentário "herdado da versão Supabase/PostgREST" no parser de tipo. | Remover parser de tipo 1700 (D-08) e o comentário. |
| **Total:** | 0 imports de @supabase | — | Nenhuma dependência `@supabase/supabase-js` encontrada. Apenas comentários. | ✅ |

---

## 7. Git e histórico

| # | Achado | Severidade | Ação |
|---|--------|-----------|------|
| G-01 | Commits têm mensagens vagas ("Aprimora relatórios...", "Organiza os dados...") e emojis (✔ ✘ no console, não nos commits). Corpo dos commits vazio. | 🟢 | A partir de agora seguir política de commits da spec §11. Histórico antigo não será reescrito. |
| G-02 | Trailers `Co-authored-by: Copilot` em vários commits — proibido pela política da spec §11. | 🟢 | Não reescrever; não repetir daqui para frente. |
| G-03 | `README.md` foi deletado em `d03df38` ("Removendo o arquivo README.md do projeto"). O projeto fica sem documentação de entrada. | 🟡 | Recriar `README.md` na fase 8. |
| G-04 | Varredura de secrets no histórico git: nenhum secret real encontrado (apenas placeholders `troque-este-segredo` e `conserpav/conserpav`). | ✅ | Nenhuma rotação necessária. |

---

## 8. Acessibilidade e UX

| # | Arquivo | Linha | Problema | Severidade | Correção |
|---|---------|-------|----------|-----------|---------|
| A-01 | `src/pages/ChamadaPage.jsx` | 278 | Botão `DatePickerField` tem `aria-disabled` mas não `disabled` real. Usuários de teclado conseguem focar e ativar. | 🟡 | Usar `disabled` quando `readOnly`. |
| A-02 | `src/components/ToastStack.jsx` | — | Não verificado nesta auditoria — verificar se há `aria-live="polite"` no container de toasts. | 🟡 | Adicionar na fase 6. |
| A-03 | Geral | — | Sem `<label>` explícito em alguns campos (ex.: área de pix no relatório). | 🟢 | Revisar na fase 6. |

---

## 9. Checklist do Definition of Done (estado atual)

| Item | Status |
|------|--------|
| Existe apenas UM Pool | ✅ (pool em `db.js`, usado em `index.js` e scripts) |
| Nenhum `new Pool/Client` fora de `db.js` (exceto LISTEN) | ✅ (`events.js` tem `new pg.Client` — exceção legítima) |
| Nenhuma query concatenada | ✅ (todas parametrizadas) |
| Toda entrada validada | ❌ (validação incompleta; sem Zod; sem limite em `weeks`) |
| Erros padronizados sem vazar internals | 🟡 (parcial; stack pode vazar em dev) |
| Token fora do localStorage | ❌ |
| Rate limit ativo | 🟡 (parcial; em memória; sem `express-rate-limit` global) |
| CORS por allowlist | ✅ |
| Helmet ativo | ❌ |
| Usuário A não acessa dados do usuário B (IDOR) | ❌ (sem owner_id) |
| SSE autenticado | ✅ (`requireAuth` no handler) |
| SSE sem token em URL | ✅ (usa `fetch` com header) |
| SSE com heartbeat e cleanup | ✅ |
| SSE filtrado por dono | ❌ |
| Nenhum resquício de Supabase (imports) | ✅ |
| Nenhuma dependência sem uso | ✅ |
| `npm audit` sem altas/críticas | 🔍 (pendente execução) |
| RF01-RF10 funcionando | ✅ (funcional, mas cálculo de relatório em float) |
| Lint/build passando | 🔍 (pendente execução) |
| Documentação atualizada | ❌ (README ausente) |
| Histórico git limpo e procedural | ❌ (mensagens antigas não conformes) |

---

## 10. Resumo de prioridades por fase

### Fase 2 — Banco e conexão
- D-01 (`owner_id` em projects), D-02 (check week_start segunda), D-04 (índice composto), D-05 (payload NOTIFY), D-06 (unique por dono), D-07 (migrations versionadas), D-08 (NUMERIC → centavos), D-09 (doc docker-compose)

### Fase 3 — Backend estrutura
- B-01 (quebrar index.js), B-02 (separar app/server), B-03 (graceful shutdown), B-04 (Zod), B-05 (formato erro), B-06 (check constraint), B-07 (parser NUMERIC), B-08 (JWT_SECRET length), B-09 (pino), B-11 (backoff SSE), B-12 (limite weeks), B-13 (Dockerfile), B-14 (endpoint reports), B-15 (algoritmo JWT sign)

### Fase 4 — Auth e segurança
- S-01 (algoritmo jwt.verify), S-02+F-01 (cookie httpOnly), S-03 (JWT expiry 8h), S-04 (min password 8), S-05 (bcrypt custo 12), S-06+S-10–S-14 (IDOR / owner_id), S-07 (json limit), S-08 (helmet), S-09 (doc docker secret), S-16 (rate limiter), S-17 (invalidar tokens antigos reset), S-18 (logging)

### Fase 5 — Relatório no servidor
- B-14, F-02, F-03

### Fase 6 — Frontend
- F-04 (serializar clicks), F-05 (roteamento PWA), F-06 (DatePickerField duplicado), F-07+F-08 (eslint-disable deps), F-09 (mega-context), F-10 (console.error), F-11–F-15, A-01–A-03, SB-01–SB-07 (comentários Supabase), G-03 (README)

### Fase 7 — Testes e CI
- DP-02 (vitest), DP-04 (GitHub Actions)

### Fase 8 — Documentação
- G-03 (README), DECISOES.md, SEGURANCA.md

---

*Gerado em 2026-10-04. Atualizar ao longo das fases conforme itens forem resolvidos.*
