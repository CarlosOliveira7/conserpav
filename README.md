# Conserpav — Controle de Frequência e Fechamento de Obras

Sistema para gestão de frequência, fechamento de pagamentos e controle de despesas de equipes de obras da empresa **Conserpav**. Desenvolvido como projeto acadêmico do curso de Análise e Desenvolvimento de Sistemas (ADS) do **Centro Universitário UNIBALSAS**.

---

## 🏗 Arquitetura do Sistema

```
                  ┌──────────────────────────────────────────────┐
                  │          Navegador / Dispositivo PWA         │
                  │             (React 18 + Vite SPA)            │
                  └──────────────────────┬───────────────────────┘
                                         │  HTTPS / Cookies httpOnly / SSE
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             API REST Express.js              │
                  │   Camadas: Routes ➔ Middlewares ➔ Services   │
                  │   Segurança: Helmet, Rate-Limit, CSRF, Zod   │
                  └──────────────────────┬───────────────────────┘
                                         │  pg.Pool (Singleton) + LISTEN Client
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │              PostgreSQL 16                   │
                  │   Constraints, Triggers e pg_notify          │
                  └──────────────────────────────────────────────┘
```

- **Frontend**: Single Page Application em React 18, Vite 5, React Router 6 e Lucide Icons. Mobile-first com suporte a Progressive Web App (PWA) e impressão direta de relatórios.
- **Backend**: API REST em Node.js (Express), estruturada em camadas com validação estrita (Zod), autenticação via cookies `httpOnly`, logging com Pino e encerramento gracioso (graceful shutdown).
- **Banco de Dados**: PostgreSQL 16 com sistema de migrações transacionais versionadas (`schema_migrations`), triggers de tempo real (`LISTEN/NOTIFY`) e constraints de integridade relacional.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js >= 18.0.0
- Docker e Docker Compose (para banco de dados e execução em contêineres)
- PostgreSQL 16 instalado (caso não utilize o Docker)

---

### Opção 1: Execução Local com Docker Compose

Suba o banco de dados e a API automaticamente:

```bash
docker compose up -d
```

O banco de dados estará pronto na porta `5432` e a API na porta `3001`. Em seguida, instale as dependências e inicie o frontend:

```bash
npm install
npm run dev
```

Acesse a aplicação em `http://localhost:5173`.

---

### Opção 2: Desenvolvimento Local Manual

1. **Instalar dependências de todo o projeto:**
   ```bash
   npm run install:all
   ```

2. **Configurar as variáveis de ambiente:**
   Crie o arquivo `server/.env` baseado no exemplo:
   ```bash
   cp server/.env.example server/.env
   ```

3. **Executar as migrações do banco de dados:**
   ```bash
   npm run db:migrate
   ```

4. **Criar um usuário administrador inicial:**
   ```bash
   npm run user:create -- admin@conserpav.com.br MinhaSenhaForte123
   ```

5. **Iniciar os servidores de desenvolvimento:**
   - **Backend** (em um terminal):
     ```bash
     npm run dev:api
     ```
   - **Frontend** (em outro terminal):
     ```bash
     npm run dev
     ```

---

## 📋 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite (Frontend) |
| `npm run dev:api` | Inicia a API Express em modo watch com Node.js |
| `npm run build` | Compila o frontend para produção (`dist/`) |
| `npm run lint` | Executa a verificação estática de código com ESLint |
| `npm test` | Executa a suíte de testes unitários e de integração (Vitest) |
| `npm run db:migrate` | Aplica migrações versionadas pendentes no banco |
| `npm run user:create -- <email> <senha>` | Cria ou redefine senha de um administrador |
| `npm run install:all` | Instala dependências do frontend e do backend |

---

## 🔒 Variáveis de Ambiente

As configurações do backend ficam centralizadas no arquivo `server/.env`:

| Variável | Obrigatória | Descrição | Exemplo |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Sim | String de conexão com o PostgreSQL | `postgres://user:pass@localhost:5432/conserpav` |
| `DATABASE_SSL` | Não | Habilita SSL para conexão de banco (`true`/`false`) | `false` |
| `JWT_SECRET` | Sim | Chave de assinatura JWT (mínimo 32 caracteres) | `sua-chave-secreta-com-pelo-menos-32-chars` |
| `PORT` | Não | Porta do servidor da API (padrão: 3001) | `3001` |
| `CORS_ORIGIN` | Não | Origens permitidas separadas por vírgula | `http://localhost:5173` |
| `APP_URL` | Não | URL pública do frontend para links de e-mail | `http://localhost:5173` |
| `SMTP_HOST` | Não | Servidor SMTP para recuperação de senha | `smtp.provedor.com` |
| `SMTP_PORT` | Não | Porta SMTP | `587` |
| `SMTP_USER` | Não | Usuário do SMTP | `usuario@provedor.com` |
| `SMTP_PASS` | Não | Senha do SMTP | `senha` |
| `SMTP_FROM` | Não | Remetente de e-mails do sistema | `nao-responda@conserpav.com.br` |

---

## 🗺 Mapa de Rotas da API

### Públicas / Saúde
- `GET  /api/health` — Verificação de status e conexão com o banco

### Autenticação (`/api/auth`)
- `POST /api/auth/login` — Autenticação por e-mail e senha (emite cookie `httpOnly`)
- `POST /api/auth/logout` — Encerra a sessão e limpa o cookie
- `GET  /api/auth/me` — Retorna dados do usuário autenticado
- `POST /api/auth/forgot` — Solicita e-mail de recuperação de senha
- `POST /api/auth/reset` — Redefine a senha com o token recebido
- `PUT  /api/auth/password` — Altera a senha do usuário autenticado
- `PUT  /api/auth/email` — Altera o e-mail do usuário autenticado

### Obras (`/api/projects`)
- `GET    /api/projects` — Lista obras do usuário autenticado
- `POST   /api/projects` — Cria nova obra (`semanal` ou `quinzenal`)
- `PUT    /api/projects/:id` — Atualiza nome e período da obra
- `DELETE /api/projects/:id` — Remove obra e seus dados vinculados em cascata

### Funcionários (`/api/employees`)
- `GET    /api/employees` — Lista funcionários das obras do usuário
- `POST   /api/employees` — Cadastra funcionário com diária e chave Pix
- `PUT    /api/employees/:id` — Atualiza funcionário
- `DELETE /api/employees/:id` — Remove funcionário

### Frequência e Chamada (`/api/attendance`)
- `GET /api/attendance?weeks=` — Consulta marcações das semanas informadas
- `PUT /api/attendance` — Grava marcação diária (`absent`, `full`, `half`)

### Gastos (`/api/expenses`)
- `GET    /api/expenses` — Lista despesas registradas
- `POST   /api/expenses` — Registra novo gasto por obra
- `PUT    /api/expenses/:id` — Atualiza gasto existente
- `DELETE /api/expenses/:id` — Remove registro de gasto

### Relatórios (`/api/reports`)
- `GET /api/reports?project_id=&weeks=&start_date=&end_date=` — Devolve relatório consolidado e por trabalhador calculado no servidor

### Tempo Real (`/api/events`)
- `GET /api/events` — Stream Server-Sent Events (SSE) autenticado e isolado por usuário

---

## 📚 Documentação Complementar

- [Relatório de Auditoria](docs/AUDITORIA.md)
- [Decisões de Arquitetura (ADRs)](docs/DECISOES.md)
- [Guia de Segurança e Hardening](docs/SEGURANCA.md)
- [Registro de Mudanças da Versão 3.0](docs/MUDANCAS_V3.md)
