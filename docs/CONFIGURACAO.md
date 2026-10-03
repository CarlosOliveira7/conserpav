# Configuração

Este documento descreve a configuração do banco PostgreSQL, da API, da autenticação e do ambiente de publicação.

## 1. Banco de dados

1. Crie um banco PostgreSQL (local, Docker ou gerenciado).
2. Defina `DATABASE_URL` em `server/.env`.
3. Aplique o schema: `npm run db:migrate` (pode ser repetido com segurança).

## 2. Usuário administrador

O sistema é mono-usuário e **não tem cadastro público**. Crie o usuário pelo terminal:

```bash
npm run user:create -- admin@exemplo.com suaSenha123
```

Rodar o comando de novo para o mesmo e-mail redefine a senha.

## 3. Variáveis de ambiente

Veja `server/.env.example` (API) e `.env.example` (front-end). Em desenvolvimento, o front-end não precisa de `.env`: o Vite encaminha `/api` para `http://localhost:3001`.

Gere um `JWT_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 4. Recuperação de senha

1. O usuário pede o link em "Esqueci minha senha".
2. A API grava um token de uso único (válido por 1 hora) e envia o link por e-mail via SMTP.
3. Sem `SMTP_HOST`, o link é impresso no console da API (útil em desenvolvimento).
4. `APP_URL` deve apontar para o domínio do front-end, pois compõe o link enviado.

## 5. Publicação

- **Front-end:** Vercel, com `VITE_API_URL=https://sua-api.exemplo.com/api`.
- **API:** `Dockerfile.api` em um serviço de processo contínuo. Defina `CORS_ORIGIN` com o domínio da Vercel.
- Após o primeiro deploy, valide login, chamada e tempo real no domínio de produção.

## Solução de problemas

### "Não foi possível conectar ao servidor."

Confirme que a API está rodando (`GET /api/health` deve responder `{"ok":true}`) e que `VITE_API_URL` (produção) ou o proxy do Vite (desenvolvimento) aponta para ela.

### Erro de CORS em produção

Inclua o domínio exato do front-end (com `https://`, sem barra final) em `CORS_ORIGIN`.

### Login sempre falha

Confirme que o usuário existe (`npm run user:create`). Após muitas tentativas erradas a API bloqueia temporariamente o login (15 minutos).

### Atualizações em tempo real não chegam

Proxies reversos não podem armazenar a resposta de `/api/events` em buffer (a API já envia `X-Accel-Buffering: no`). Verifique também se o PostgreSQL permite `LISTEN` (conexões via pooler em modo transação, como o PgBouncer, não permitem — use a conexão direta).

### E-mail de recuperação não chega

Confira `SMTP_*`, a pasta de spam e os logs da API.
