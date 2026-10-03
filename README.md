# Controle de Frequência de Obras

## Visão Geral

O Controle de Frequência de Obras gerencia obras, equipes, registros de presença e fechamento de pagamentos. A aplicação é composta por um frontend em React, uma API em Node.js/Express e um banco de dados **PostgreSQL**. A sincronização em tempo real usa `LISTEN/NOTIFY` do PostgreSQL repassado ao navegador por Server-Sent Events (SSE).

O sistema adota um modelo de acesso mono-usuário. Toda rota de dados exige um token JWT válido, e o navegador nunca se conecta diretamente ao banco.

> **Versão 2.0:** o backend deixou de usar o Supabase. Veja [Migração do Supabase](#migração-do-supabase) para o que mudou.

## Pré-requisitos

- **Node.js:** versão 18 ou superior.
- **PostgreSQL:** versão 13 ou superior (local, via Docker, ou gerenciado: Neon, Render, Railway, etc.).
- **Docker (opcional):** sobe banco e API com um único comando.

## Funcionalidades

- **Obras:** cadastre, edite e exclua obras do sistema.
- **Equipe:** mantenha funcionários com função, diária, obra e chave Pix.
- **Frequência:** registre ausência, diária completa ou meia diária por dia.
- **Histórico:** consulte semanas anteriores sem sobrescrever registros existentes.
- **Pagamentos:** consulte totais por funcionário e copie a chave Pix cadastrada.
- **Gastos por obra:** registre materiais/despesas, acompanhe valores em aberto, dê baixa e imprima o relatório de gastos pendentes.
- **Fechamento:** defina períodos semanais ou quinzenais por obra.
- **Tempo real:** acompanhe alterações feitas em outras abas ou dispositivos.
- **Conta:** recupere a senha por e-mail.
- **Interface:** experiência responsiva (mobile-first), acessível e instalável como PWA.

## Arquitetura

```
┌────────────┐  HTTPS/JSON + SSE   ┌──────────────┐   SQL / LISTEN   ┌────────────┐
│ React SPA  │ ──────────────────▶ │ API Express  │ ───────────────▶ │ PostgreSQL │
│ (Vercel)   │ ◀────────────────── │ (server/)    │ ◀─────────────── │            │
└────────────┘   Bearer JWT        └──────────────┘   NOTIFY         └────────────┘
```

### Tecnologias

- **Frontend:** React 18, Vite, React Router, lucide-react.
- **API:** Node.js, Express, `pg` (driver PostgreSQL), `jsonwebtoken`, `bcryptjs`, `nodemailer`.
- **Banco:** PostgreSQL com triggers `NOTIFY` para tempo real.
- **PWA:** `manifest.json` e service worker em `public/`.

### Estrutura

- **`src/`:** frontend (`components/`, `pages/`, `context/`, `lib/`).
  - **`src/lib/http.js`:** cliente HTTP e armazenamento do token.
  - **`src/lib/api.js`:** funções de acesso à API (mesmas assinaturas da versão anterior).
  - **`src/lib/realtime.js`:** assinatura SSE com reconexão automática.
- **`server/`:** API Node.js (`src/index.js` rotas, `src/auth.js` JWT, `src/events.js` SSE, `scripts/` migração e criação de usuário).
- **`database/schema.sql`:** schema oficial do PostgreSQL (idempotente).
- **`docker-compose.yml` e `Dockerfile.api`:** ambiente local com PostgreSQL + API.
- **`docs/`:** configuração e roteiro de validação.

## Instalação e execução

### Opção A — Docker (mais rápido)

```bash
docker compose up --build        # sobe PostgreSQL (5432) e API (3001), já aplicando o schema
docker compose exec api node scripts/create-user.js admin@exemplo.com suaSenha123
npm install
npm run dev                      # front-end em http://localhost:5173
```

### Opção B — PostgreSQL instalado na máquina

1. **Crie o banco:**
   ```sql
   CREATE USER conserpav WITH PASSWORD 'conserpav';
   CREATE DATABASE conserpav OWNER conserpav;
   ```
2. **Configure a API:** copie `server/.env.example` para `server/.env` e ajuste `DATABASE_URL` e `JWT_SECRET`.
3. **Instale as dependências:**
   ```bash
   npm run install:all
   ```
4. **Aplique o schema e crie o usuário:**
   ```bash
   npm run db:migrate
   npm run user:create -- admin@exemplo.com suaSenha123
   ```
5. **Inicie API e front-end** (dois terminais):
   ```bash
   npm run dev:api     # API em http://localhost:3001
   npm run dev         # front-end em http://localhost:5173 (proxy /api -> 3001)
   ```

Acesse `http://localhost:5173` e entre com o usuário criado.

### Variáveis de ambiente

**API (`server/.env`)**

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do PostgreSQL. |
| `DATABASE_SSL` | `true` em provedores que exigem SSL. |
| `JWT_SECRET` | Segredo longo e aleatório para assinar tokens. |
| `JWT_EXPIRES_IN` | Validade da sessão (padrão `7d`). |
| `CORS_ORIGIN` | Origens do front-end permitidas (separadas por vírgula). |
| `APP_URL` | URL do front-end, usada no link de recuperação de senha. |
| `SMTP_*` | Opcional. Sem SMTP, o link de recuperação aparece no console da API. |

**Front-end (`.env`)** — só em produção: `VITE_API_URL=https://sua-api.exemplo.com/api`.

## Utilização

1. **Obras:** cadastre a obra e escolha o fechamento semanal ou quinzenal.
2. **Equipe:** cadastre os funcionários com função, diária e chave Pix.
3. **Chamada:** toque no dia de cada funcionário para alternar ausência → diária completa → meia diária.
4. **Relatórios:** consulte o total por funcionário, copie a chave Pix e gere o PDF de fechamento.
5. **Configurações:** altere e-mail ou senha (exige a senha atual).

## Modelo de dados

- **`users`:** credenciais (e-mail e hash bcrypt da senha).
- **`password_resets`:** tokens de recuperação de senha (somente o hash é guardado; expiram em 1 hora).
- **`proprietarios`:** dados complementares do usuário.
- **`projects`:** obras e período de fechamento.
- **`employees`:** funcionários vinculados às obras.
- **`attendance_records`:** presença por funcionário, semana (`week_start` = segunda-feira) e dia.
- **`project_expenses`:** gastos vinculados a uma obra, com categoria, quantidade, valor unitário, data, observações e situação de baixa.

## Migração do Supabase

| Antes (Supabase) | Agora (PostgreSQL próprio) |
| --- | --- |
| `@supabase/supabase-js` no navegador | API REST própria (`server/`) + `fetch` |
| Supabase Auth | Tabela `users`, bcrypt e token JWT |
| RLS nas tabelas | Autorização na API (JWT obrigatório); o banco não é exposto ao navegador |
| Supabase Realtime | Triggers `NOTIFY` + SSE (`/api/events`) |
| E-mail de recuperação do Supabase | `nodemailer` (SMTP) com token de uso único |
| `supabase/schema.sql` | `database/schema.sql` |

**Migrar dados existentes:** exporte as tabelas `projects`, `employees` e `attendance_records` do Supabase (`pg_dump --data-only --table=...` ou CSV) e importe no novo banco após `npm run db:migrate`. Os usuários não são migrados (senhas ficam no Supabase Auth): crie-os com `npm run user:create`.

## Validação

```bash
npm run lint
npm run build
```

Roteiro funcional completo em [`docs/VALIDACAO.md`](./docs/VALIDACAO.md).

## Deploy

- **Front-end (Vercel):** importe o repositório, defina `VITE_API_URL` apontando para a API, build `npm run build`, saída `dist/`. Mantenha o [`vercel.json`](./vercel.json) para o roteamento SPA.
- **API + banco:** publique `Dockerfile.api` (Render, Railway, Fly.io, VPS) com um PostgreSQL gerenciado. Defina `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`, `CORS_ORIGIN` (domínio da Vercel) e `APP_URL`. O container aplica o schema ao iniciar.
- **Atenção:** a API precisa de processo contínuo (conexão SSE e `LISTEN`); não use funções serverless para ela.

## Convenções de desenvolvimento

- **Lint e build:** execute `npm run lint` e `npm run build` antes de publicar.
- **Segredos:** nunca versione `.env`, `server/.env` ou `JWT_SECRET`.
- **Schema:** mantenha `database/schema.sql` idempotente e documente migrações.

## Referências / Links Úteis

- [`docs/CONFIGURACAO.md`](./docs/CONFIGURACAO.md) — ambiente, autenticação e deploy.
- [`docs/VALIDACAO.md`](./docs/VALIDACAO.md) — roteiro operacional.
- [PostgreSQL](https://www.postgresql.org/docs/), [Express](https://expressjs.com/), [React](https://react.dev/), [Vercel](https://vercel.com/docs).
