# Diretrizes e Implementações de Segurança — Conserpav v3.0

Este documento resume as medidas de hardening e segurança implementadas no sistema de Controle de Frequência de Obras da Conserpav.

---

## 1. Autenticação e Gestão de Sessão
- **Custo do Hash de Senhas**:
  - Utilização da biblioteca `bcryptjs` com custo (work factor) configurado para **12 rodadas**.
  - No fluxo de login, para e-mails inexistentes, executa-se um hash dummy idêntico para garantir comparação em tempo constante e mitigar ataques de enumeração de usuários por timing.
  - Mensagens de erro padronizadas ("E-mail ou senha incorretos") impedindo inferência de existência de conta.
- **JWT com Algoritmo Estrito**:
  - Assinatura e verificação fixadas exclusivamente em `HS256`.
  - Rejeição de tokens com `alg: none` ou trocas de chave simétrica/assimétrica.
  - Validação de inicialização: falha imediatamente o boot da API se `JWT_SECRET` contiver menos de 32 bytes/caracteres.
- **Armazenamento em Cookie `httpOnly`**:
  - Removido o armazenamento de credenciais no `localStorage`.
  - Cookie de autenticação configurado com:
    - `httpOnly: true` (inibe acesso via scripts maliciosos XSS).
    - `secure: true` em ambiente de produção (força HTTPS).
    - `sameSite: "lax"` (mitigação base contra CSRF).
    - Expiração automática em 8 horas.

---

## 2. Proteção de Rede e Cabeçalhos HTTP
- **Helmet**:
  - Middleware ativo configurando cabeçalhos de segurança padrão: CSP, HSTS, X-Content-Type-Options, X-Frame-Options (DENY), Referrer-Policy.
- **Remoção de Identificação de Servidor**:
  - `x-powered-by` desabilitado no Express.
- **CORS Estrito com Credenciais**:
  - Allowlist explícita via variável de ambiente `CORS_ORIGIN`. Nenhuma origem com wildcard (`*`) associada a `credentials: true`.
- **Proteção CSRF**:
  - Middleware de checagem obrigatória do cabeçalho customizado `X-Requested-With: XMLHttpRequest` e validação estrita da origem (`Origin` / `Referer`) para requisições de alteração de dados (`POST`, `PUT`, `DELETE`).

---

## 3. Controle de Taxa (Rate Limiting) e Prevenção de Força Bruta
- **Limitador Global**:
  - 100 requisições por IP a cada 15 minutos via `express-rate-limit`.
- **Limitador de Autenticação**:
  - Limite estrito de 10 tentativas por IP a cada 15 minutos nos endpoints `/api/auth/login`, `/api/auth/forgot`, `/api/auth/reset`, `/api/auth/password` e `/api/auth/email`.

---

## 4. Isolamento de Dados e Prevenção de IDOR
- **Multi-Tenant Seguro**:
  - Coluna `owner_id` obrigatória na tabela `projects`.
  - O backend nunca confia em parâmetros fornecidos pelo cliente sem cruzar com `req.user.id`.
  - Exclusão, atualização e listagem de obras, funcionários, gastos e chamadas exigem verificação de vínculo com o usuário logado antes de qualquer operação.
- **Server-Sent Events (SSE) Filtrado**:
  - Clientes conectados a `GET /api/events` são mapeados por usuário.
  - O despachador de eventos transmite notificações apenas para conexões pertencentes ao mesmo `owner_id` da linha alterada.
  - Dados sensíveis (como `pix_key` e credenciais) são omitidos dos payloads do trigger de tempo real.

---

## 5. Validação de Entrada Estrita com Zod
- Validação no middleware antes de atingir os controladores.
- Rejeição de campos extras com `.strict()` nos payloads.
- Validação formal de:
  - Formato e obrigatoriedade de identificadores UUID.
  - Data de início de semana (`week_start`) garantidamente uma segunda-feira (ISO 1).
  - Valores numéricos positivos e com limites superiores para valores financeiros (`daily_rate` e gastos).
  - Quantidade máxima de semanas consultadas simultaneamente (até 4).
  - Sanitização de e-mails em lowercase e trim.

---

## 6. Privacidade e Logs Estruturados
- Logger `pino` configurado com política de redaction para ocultar senhas, hashes, tokens, e dados bancários/pix.
- Mascaramento de endereços de e-mail em scripts de terminal e console do servidor (ex.: `c***@exemplo.com`).
