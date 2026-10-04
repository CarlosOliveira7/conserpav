# Registro de Decisões de Arquitetura (ADR) — Conserpav v3.0

## ADR 01: Isolamento Multi-tenant com `owner_id`
* **Contexto**: O sistema original permitia que qualquer usuário autenticado visualizasse e alterasse dados de outros usuários se soubesse os identificadores (vulnerabilidade IDOR).
* **Decisão**: Adicionada a coluna `owner_id` (FK `users`) em `projects`. Todos os relacionamentos descendentes (`employees`, `attendance_records`, `project_expenses`) herdam o escopo do proprietário através de `project_id`. A unicidade do nome da obra passou a ser por dono (`UNIQUE(owner_id, lower(name))`). Todas as consultas na camada de serviços filtram estritamente pelo `req.user.id`.
* **Consequências**: Eliminação completa de IDOR. Cada encarregado ou administrador só tem acesso às suas próprias obras e equipes.

## ADR 02: Sessão Segura com Cookie `httpOnly` e Algoritmo JWT Fixo
* **Contexto**: O token JWT era armazenado em `localStorage`, ficando exposto a ataques de Cross-Site Scripting (XSS). Além disso, `jwt.verify` não fixava algoritmos permitidos, permitindo potenciais ataques de bypass `none` algorithm.
* **Decisão**: 
  - Token JWT fixado no algoritmo `HS256` na assinatura e na verificação (`algorithms: ['HS256']`).
  - Sessão entregue em cookie `httpOnly`, `Secure` (em produção) e `SameSite=Lax`.
  - Remoção do token do `localStorage` no frontend.
  - Rota de logout (`POST /api/auth/logout`) que limpa o cookie no navegador.
* **Consequências**: Tokens protegidos contra leitura via scripts JS maliciosos no cliente.

## ADR 03: Cálculo de Fechamento de Pagamento no Servidor com Centavos Inteiros
* **Contexto**: O cálculo de diárias e valores a receber era realizado no frontend com tipos `float` do JavaScript e o driver do Postgres convertia `NUMERIC` para float, gerando risco de imprecisão e perda de centavos em operações financeiras.
* **Decisão**: Criado o endpoint dedicado `GET /api/reports?project_id=&weeks=&start_date=&end_date=`. Toda a lógica de cálculo (diária completa = 1, meia diária = 0.5, ausente = 0) é calculada no servidor usando aritmética de centavos inteiros (`Math.round(rate * 100)`). O frontend apenas exibe os resultados formatados.
* **Consequências**: Garantia de integridade matemática e consistência em relatórios impressos.

## ADR 04: Sistema de Migrações Versionadas com `schema_migrations`
* **Contexto**: O script de migração anterior executava o arquivo `schema.sql` inteiro de uma vez, sem rastreabilidade de versões aplicadas nem suporte a transações por etapa.
* **Decisão**: Implementado o runner `server/scripts/migrate.js` que lê arquivos sequenciais (`001_baseline.sql`, `002_owner_id.sql`, etc.) em `database/migrations/`, executa cada um dentro de uma transação `BEGIN/COMMIT` e registra o arquivo na tabela `schema_migrations`.
* **Consequências**: Histórico reproduzível do banco de dados e execução segura de novas migrações sem conflito.

## ADR 05: Proteção Contra CSRF (Cross-Site Request Forgery)
* **Contexto**: Com o uso de cookies para autenticação, navegadores anexam cookies automaticamente em requisições cross-origin, exigindo proteção contra CSRF.
* **Decisão**: Middleware `csrfProtection` aplicado a todas as rotas com métodos mutáveis (`POST`, `PUT`, `DELETE`). Exige a presença do cabeçalho customizado `X-Requested-With: XMLHttpRequest` e valida a origem (`Origin` ou `Referer`) contra a lista permitida em `CORS_ORIGIN`.
* **Consequências**: Proteção eficaz e transparente para Single Page Applications sem sobrecarga de tokens dinâmicos por sessão.

## ADR 06: SSE com Filtragem por Dono
* **Contexto**: Notificações PostgreSQL (LISTEN/NOTIFY) transmitiam eventos de alterações de tabela indiscriminadamente para todos os navegadores conectados via Server-Sent Events.
* **Decisão**: O trigger do banco adiciona `owner_id` e limpa campos sensíveis (`pix_key`) no payload de notificação. O handler de SSE no Express (`eventsHandler`) associa a conexão ao ID do usuário autenticado e despacha os eventos apenas se `owner_id` for correspondente.
* **Consequências**: Tempo real mantido com isolamento total entre tenants.
