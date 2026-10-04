# Conserpav — Controle de Frequência e Fechamento de Obras

Sistema para gestão de frequência, fechamento de pagamentos e controle de despesas de equipes de obras da empresa **Conserpav**. Desenvolvido como projeto acadêmico do curso de Análise e Desenvolvimento de Sistemas (ADS) do **Centro Universitário UNIBALSAS**.

## Sobre o Projeto

O sistema centraliza o acompanhamento das obras e equipes, substituindo registros manuais de frequência e cálculos feitos em cadernos ou planilhas. Com os registros organizados por período, os responsáveis podem consultar o histórico e gerar o fechamento de pagamentos com os valores devidos a cada funcionário.

### Funcionalidades

- Cadastro de obras com período de fechamento semanal ou quinzenal.
- Cadastro de funcionários, funções, valores de diária e chaves Pix.
- Registro de diárias completas, meias diárias e ausências.
- Cálculo automático dos pagamentos e consulta do histórico por período.
- Geração e impressão do relatório de pagamento.
- Registro e acompanhamento de despesas por obra.
- Sincronização de atualizações entre dispositivos.

## Participantes

Projeto desenvolvido no curso de Análise e Desenvolvimento de Sistemas do Centro Universitário UNIBALSAS.

- Kaio Moreira Morais (RA 25.1.06774): análise de requisitos e documentação técnica.
- Andrei Pereira Lima (RA 25.1): desenvolvimento front-end.
- Carlos Oliveira Lopes (RA 25.1.07350): desenvolvimento back-end.
- Priscila Ferreira Dias Santos (RA 25.1.01585): desenvolvimento back-end.
- Ywd Rhavell Ferreira Carvalho (RA 25.1.02815): engenharia de software e testes.

## Links do Projeto

- **Lean Canvas:** [Acessar no Canva](https://www.canva.com/design/DAHUJp4ClcA/TFKSxVYON0W8lTrb1oURlQ/edit?ui=eyJBIjp7fX0)
- **Repositório:** [github.com/CarlosOliveira7/conserpav](https://github.com/CarlosOliveira7/conserpav)

---

## Arquitetura

O navegador executa uma aplicação React que se comunica por HTTPS com uma API REST em Express. A API autentica as sessões por cookies `httpOnly`, valida entradas com Zod e acessa o PostgreSQL por meio de um `pg.Pool` compartilhado. Eventos de atualização são distribuídos por Server-Sent Events (SSE), alimentados por notificações PostgreSQL (`LISTEN/NOTIFY`).

- **Front-end:** React 18, Vite 5, React Router 6 e Lucide. Aplicação responsiva com suporte a PWA e impressão de relatórios.
- **Back-end:** Node.js e Express, organizado em rotas, middlewares e serviços. Inclui Helmet, proteção CSRF, rate limiting, logging com Pino e encerramento gracioso.
- **Banco de dados:** PostgreSQL 16, migrações transacionais versionadas, constraints e triggers.

---

## Execução do Projeto

### Pré-requisitos
- Node.js >= 18.0.0
- Docker e Docker Compose (para banco de dados e execução em contêineres)
- PostgreSQL 16 instalado (caso não utilize o Docker)

---

### Docker Compose

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

### Desenvolvimento Local Manual

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
   npm run user:create -- <email> <senha>
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

## Scripts

- `npm run dev`: inicia o servidor Vite do front-end.
- `npm run dev:api`: inicia a API Express em modo de desenvolvimento.
- `npm run build`: compila o front-end para `dist/`.
- `npm run lint`: executa o ESLint em `src/`.
- `npm test`: executa os testes do front-end e do servidor.
- `npm run db:migrate`: aplica as migrações pendentes.
- `npm run user:create -- <email> <senha>`: cria ou redefine um usuário administrador.
- `npm run install:all`: instala as dependências do front-end e do back-end.

## Variáveis de Ambiente

As configurações do backend ficam centralizadas no arquivo `server/.env`:

- `DATABASE_URL` (obrigatória): string de conexão com o PostgreSQL.
- `JWT_SECRET` (obrigatória): chave de assinatura JWT com pelo menos 32 caracteres.
- `DATABASE_SSL` (opcional): habilita SSL para a conexão com o banco (`true` ou `false`).
- `PORT` (opcional): porta da API; padrão `3001`.
- `CORS_ORIGIN` (opcional): origens permitidas, separadas por vírgula.
- `APP_URL` (opcional): URL pública do front-end, usada em links de e-mail.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` (opcionais): configuração do envio de e-mails para recuperação de senha.

As variáveis devem ser configuradas em `server/.env`, com base em `server/.env.example`.

## Rotas da API

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

## Documentação Complementar

- [Relatório de Auditoria](docs/AUDITORIA.md)
- [Decisões de Arquitetura (ADRs)](docs/DECISOES.md)
- [Guia de Segurança e Hardening](docs/SEGURANCA.md)
- [Registro de Mudanças da Versão 3.0](docs/MUDANCAS_V3.md)
