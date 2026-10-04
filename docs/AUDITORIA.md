# AUDITORIA — Conserpav v2.0 ➔ v3.0

**Data:** 2026-10-04  
**Status:** ✅ **TODOS OS ITENS FORAM AUDITADOS E RESOLVIDOS (Versão 3.0)**  
**Revisor:** Engenheiro sênior  
**Branch:** `refactor/feature-kaio-mvp`

---

## Sumário executivo

O projeto saiu de uma prova-de-conceito com Supabase e foi migrado para uma API Express + PostgreSQL própria. A refatoração completa das Fases 1 a 8 corrigiu todas as lacunas de segurança, qualidade, banco de dados, arquitetura e usabilidade. Todos os débitos técnicos e vulnerabilidades auditados foram saneados.

**Legenda de severidade:** 🔴 Crítica | 🟠 Alta | 🟡 Média | 🟢 Baixa/Info | ✅ Resolvido

---

## 1. Segurança — Autenticação e sessão

| # | Arquivo | Problema | Severidade | Resolução (v3.0) |
|---|---------|----------|-----------|------------------|
| S-01 | `server/src/auth.js` | `jwt.verify()` sem restrição de algoritmo. | 🔴 | ✅ **[RESOLVIDO]** Fixado exclusivamente em `{ algorithms: ['HS256'] }`. |
| S-02 | `src/lib/http.js` | Token JWT em `localStorage` sujeito a roubo via XSS. | 🔴 | ✅ **[RESOLVIDO]** Migrado para cookie `httpOnly; Secure; SameSite=Lax`. |
| S-03 | `server/src/config.js` | Expiração longa de token. | 🟠 | ✅ **[RESOLVIDO]** Reduzido para `8h` com rota explícita de logout que revoga o cookie. |
| S-04 | `server/src/index.js` | Senha mínima de 6 caracteres. | 🟠 | ✅ **[RESOLVIDO]** Senha mínima elevada para 8 caracteres na API e no script `create-user.js`. |
| S-05 | `server/src/services/auth.service.js` | Bcrypt custo 10. | 🟠 | ✅ **[RESOLVIDO]** Elevado para custo 12 com hash dummy para mitigar timing attacks. |
| S-06 | `server/src/events.js` | Broadcast SSE sem filtro de usuário (vazamento entre tenants). | 🔴 | ✅ **[RESOLVIDO]** Adicionado `owner_id` e SSE filtra eventos estritamente pelo ID do usuário autenticado. |
| S-07 | `server/src/app.js` | Limite de payload 100kb. | 🟢 | ✅ **[RESOLVIDO]** Reduzido para `express.json({ limit: '10kb' })`. |
| S-08 | `server/src/app.js` | Sem helmet e CORS sem credentials. | 🟠 | ✅ **[RESOLVIDO]** Adicionado `helmet()` e CORS configurado com `credentials: true` e allowlist explícita. |
| S-09 | `docker-compose.yml` | Segredo padrão em docker-compose. | 🟡 | ✅ **[RESOLVIDO]** Documentado no README que variáveis de ambiente em produção devem ser definidas no host. |
| S-10 a S-14 | `server/src/services/` | IDOR em todas as rotas de projetos, funcionários, gastos e chamadas. | 🔴 | ✅ **[RESOLVIDO]** Adicionado `owner_id` (FK users) e todas as operações validam estritamente o dono antes de ler/alterar. |
| S-15 | `src/lib/realtime.js` | Token em query string caso usasse EventSource. | 🟢 | ✅ **[RESOLVIDO]** SSE opera via `fetch` autenticado pelo cookie `httpOnly` nativo com `credentials: "include"`. |
| S-16 | `server/src/middleware/rateLimit.js` | Rate limiter em memória simples. | 🟡 | ✅ **[RESOLVIDO]** Integrado `express-rate-limit` (100 req/15min global e 10 req/15min em auth). |
| S-17 | `server/src/services/auth.service.js` | Não invalidava tokens antigos de reset de senha. | 🟠 | ✅ **[RESOLVIDO]** Tokens anteriores são invalidados via UPDATE antes da emissão de novos tokens. |
| S-18 | `server/src/logger.js` | Stack traces e dados sensíveis em logs. | 🟡 | ✅ **[RESOLVIDO]** Logger estruturado `pino` implementado com redaction de senhas, chaves Pix e tokens. |

---

## 2. Banco de dados

| # | Arquivo | Problema | Severidade | Resolução (v3.0) |
|---|---------|----------|-----------|------------------|
| D-01 | `database/migrations/002_owner_id.sql` | `projects` sem `owner_id`. | 🔴 | ✅ **[RESOLVIDO]** Coluna adicionada como `NOT NULL REFERENCES users(id) ON DELETE CASCADE`. |
| D-02 | `database/migrations/003_constraints_and_indexes.sql` | Sem validação de segunda-feira no banco. | 🟠 | ✅ **[RESOLVIDO]** Constraint `CHECK (EXTRACT(ISODOW FROM week_start) = 1)` adicionada. |
| D-03 | `database/migrations/003_constraints_and_indexes.sql` | `employees` sem `updated_at`. | 🟢 | ✅ **[RESOLVIDO]** Coluna adicionada com trigger de atualização automática. |
| D-04 | `database/migrations/003_constraints_and_indexes.sql` | Falta de índice composto em frequência. | 🟡 | ✅ **[RESOLVIDO]** Criado índice `attendance_records(employee_id, week_start)`. |
| D-05 | `database/migrations/004_slim_notify.sql` | NOTIFY enviava dados sensíveis (pix_key). | 🟠 | ✅ **[RESOLVIDO]** Payload de notificação limpo omitindo `pix_key` e incluindo `owner_id`. |
| D-06 | `database/migrations/002_owner_id.sql` | Unicidade global de nome da obra. | 🟡 | ✅ **[RESOLVIDO]** Unicidade alterada para `UNIQUE(owner_id, lower(name))`. |
| D-07 | `server/scripts/migrate.js` | Ausência de versionamento de migrações. | 🟠 | ✅ **[RESOLVIDO]** Runner versionado criado com controle via tabela `schema_migrations`. |
| D-08 | `server/src/db.js` | Parser NUMERIC convertendo para float. | 🟠 | ✅ **[RESOLVIDO]** Parser removido; cálculo financeiro migrado para centavos inteiros no servidor. |
| D-09 | `docker-compose.yml` | Senha padrão em desenvolvimento. | 🟢 | ✅ **[RESOLVIDO]** Documentado no README. |

---

## 3. Backend — Estrutura e qualidade

| # | Arquivo | Problema | Severidade | Resolução (v3.0) |
|---|---------|----------|-----------|------------------|
| B-01 a B-03 | `server/src/app.js` / `server.js` | Arquivo monolítico `index.js` sem camadas e sem graceful shutdown. | 🟠 | ✅ **[RESOLVIDO]** Dividido em `app.js`, `server.js`, `routes/`, `services/`, `schemas/`, com shutdown gracioso para SIGTERM/SIGINT. |
| B-04 | `server/src/schemas/` | Validação inline sem Zod. | 🟠 | ✅ **[RESOLVIDO]** Schemas estritos Zod para body, params e query em todos os endpoints. |
| B-05 | `server/src/errors/AppError.js` | Formato de erro não padronizado. | 🟡 | ✅ **[RESOLVIDO]** Padronizado para `{ error: { code, message } }` via classe `AppError`. |
| B-06 | `server/src/middleware/errorHandler.js` | Constraint 23514 e outras não tratadas. | 🟡 | ✅ **[RESOLVIDO]** Tratamento específico mapeando 23505, 23503, 23514 e 22P02. |
| B-07 | `server/src/db.js` | Parser de float para NUMERIC. | 🟠 | ✅ **[RESOLVIDO]** Parser global removido. |
| B-08 | `server/src/config.js` | JWT_SECRET sem validação de tamanho mínimo. | 🟡 | ✅ **[RESOLVIDO]** Boot falha se `JWT_SECRET` for menor que 32 bytes. |
| B-09 | `server/src/logger.js` | Ausência de logging estruturado. | 🟡 | ✅ **[RESOLVIDO]** Integrado `pino` com mascaramento de dados sensíveis. |
| B-10 | `server/scripts/create-user.js` | Senha mínima de 6 caracteres. | 🟡 | ✅ **[RESOLVIDO]** Aumentado para mínimo 8 caracteres com bcrypt custo 12. |
| B-11 | `server/src/events.js` | Falta de encerramento e reconexão segura em SSE. | 🟡 | ✅ **[RESOLVIDO]** Adicionado `closeEvents()` e isolamento por usuário. |
| B-12 | `server/src/schemas/attendance.schema.js` | Consulta de semanas sem limite. | 🟡 | ✅ **[RESOLVIDO]** Limite de 1 a no máximo 4 semanas por requisição validado no schema Zod. |
| B-13 | `Dockerfile.api` | Execução sob shell PID 1 e usuário root. | 🟠 | ✅ **[RESOLVIDO]** Atualizado para `USER node` e `CMD ["node", "src/server.js"]`. |
| B-14 | `server/src/routes/reports.routes.js` | Sem endpoint de fechamento no servidor. | 🟠 | ✅ **[RESOLVIDO]** Criado endpoint `GET /api/reports` com cálculo em centavos inteiros. |
| B-15 | `server/src/auth.js` | Algoritmo implícito no signToken. | 🟡 | ✅ **[RESOLVIDO]** Algoritmo fixado explicitamente em `HS256`. |

---

## 4. Frontend — Qualidade e segurança

| # | Arquivo | Problema | Severidade | Resolução (v3.0) |
|---|---------|----------|-----------|------------------|
| F-01 | `src/lib/http.js` | JWT em `localStorage`. | 🔴 | ✅ **[RESOLVIDO]** Migrado para cookie `httpOnly`. |
| F-02 e F-03 | `src/pages/RelatoriosPage.jsx` | Cálculo de pagamento no cliente em float duplicado. | 🟠 | ✅ **[RESOLVIDO]** Frontend agora consome o endpoint `GET /api/reports` do backend. |
| F-04 | `src/context/AppContext.jsx` | Cliques repetidos rápidos gerando corrida de estado em chamada. | 🟡 | ✅ **[RESOLVIDO]** Trava por célula com `pendingCells` impedindo requisições concorrentes. |
| F-06 | `src/components/DatePickerField.jsx` | Código duplicado de calendário e datepicker. | 🟡 | ✅ **[RESOLVIDO]** Extraído para componente reutilizável e utilitários centralizados em `dateUtils.js`. |
| F-07 e F-08 | `src/context/AppContext.jsx` | eslint-disable silenciando dependências de useEffect. | 🟡 | ✅ **[RESOLVIDO]** Dependências corrigidas e comentários supressores removidos. |
| F-10 | `src/lib/api.js` | `console.error` em respostas de erro da API. | 🟢 | ✅ **[RESOLVIDO]** Removido `console.error` da função `run()`. |
| F-11 | `src/context/AuthContext.jsx` | Comentários obsoletos de localStorage. | 🟢 | ✅ **[RESOLVIDO]** Atualizado para refletir cookies `httpOnly`. |
| F-12 | `src/pages/RelatoriosPage.jsx` | `reportReady` habilitado com zero funcionários. | 🟡 | ✅ **[RESOLVIDO]** Validação corrigida exigindo `activeEmployees.length > 0`. |
| F-13 e F-14 | `public/sw.js` | Cache de rotas de API e versionamento de estáticos. | 🟡 | ✅ **[RESOLVIDO]** Service Worker ignora qualquer rota `/api/*` e atualiza para cache v2. |

---

## 5. Resquícios do Supabase

| # | Arquivo | Ocorrência | Status |
|---|---------|-----------|--------|
| SB-01 a SB-07 | Vários | Comentários obsoletos mencionando Supabase. | ✅ **[RESOLVIDO]** Todos os comentários foram removidos ou atualizados. |

---

## 6. Acessibilidade

| # | Arquivo | Problema | Status |
|---|---------|----------|--------|
| A-01 | `src/components/DatePickerField.jsx` | Botão readOnly sem atributo `disabled`. | ✅ **[RESOLVIDO]** Atributo HTML nativo `disabled` aplicado quando `readOnly`. |
| A-02 | `src/components/ToastStack.jsx` | Notificações de toast para leitores de tela. | ✅ **[RESOLVIDO]** Container configurado com `role="status"` e `aria-live="polite"`. |

---

## 7. Checklist do Definition of Done (Final)

| Item | Status |
|------|:------:|
| Existe apenas UM Pool singleton | ✅ |
| Nenhum `new Pool/Client` fora de `db.js` (exceto LISTEN em `events.js`) | ✅ |
| Nenhuma query concatenada (100% parametrizadas) | ✅ |
| Toda entrada validada com Zod (body, params, query) | ✅ |
| Erros padronizados `{ error: { code, message } }` sem vazar internals | ✅ |
| Token fora do localStorage (cookie `httpOnly`) | ✅ |
| Rate limiting ativo (global e sensível) | ✅ |
| CORS restrito por allowlist com credentials | ✅ |
| Helmet ativo | ✅ |
| Proteção CSRF ativa para métodos mutáveis | ✅ |
| Usuário A não acessa dados do usuário B (IDOR eliminado) | ✅ |
| SSE autenticado, filtrado por dono e sem token na URL | ✅ |
| Nenhum resquício de Supabase | ✅ |
| Cálculo de pagamento com precisão inteira no servidor | ✅ |
| Testes automatizados passando (Vitest + Supertest) | ✅ |
| Pipeline CI ativo (GitHub Actions) | ✅ |
| Lint e Build passando 100% | ✅ |
| Documentação completa (README, DECISOES, SEGURANCA, MUDANCAS_V3) | ✅ |
