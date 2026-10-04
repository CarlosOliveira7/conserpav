# Registro de Mudanças — Conserpav v3.0

Versão de consolidação, refatoração e hardening do sistema de Controle de Frequência de Obras da Conserpav.

---

## 1. Banco de Dados e Conexão
- **Runner de Migrações Versionadas**: Criada a tabela `schema_migrations` e o runner `server/scripts/migrate.js` executando scripts transacionais em `database/migrations/`.
- **Isolamento de Proprietário (`owner_id`)**: Adicionada a coluna `owner_id` em `projects` e constraint de unicidade por dono (`projects_owner_name_unique`).
- **Validação de Calendário no Banco**: Criada constraint `CHECK (EXTRACT(ISODOW FROM week_start) = 1)` em `attendance_records`.
- **Índices de Performance**: Criado índice composto `attendance_records(employee_id, week_start)` e índice em `projects(owner_id)`.
- **Triggers de Atualização e NOTIFY Seguro**: Adicionados triggers para manter `updated_at` atualizado e trigger de NOTIFY limpo (com `owner_id` e sem `pix_key`).
- **Precisão Numérica**: Removido o parser que convertia `NUMERIC` para `float` no driver `pg`.

## 2. Backend e Arquitetura em Camadas
- **Desacoplamento do Monólito**: `server/src/index.js` dividido em `app.js` (configuração do Express) e `server.js` (boot e shutdown gracioso).
- **Graceful Shutdown**: Tratamento de sinais `SIGINT`/`SIGTERM` fechando conexões HTTP, streams SSE e o pool do banco de dados.
- **Camada de Serviços e Repositórios**: Criados módulos de serviço em `server/src/services/` isolando regras de negócio e checagem de autorização contra IDOR.
- **Validação de Entrada com Zod**: Criados schemas estritos para todas as rotas em `server/src/schemas/`.
- **Tratamento de Erros Centralizado**: Classe `AppError` e middleware de formatação `{ error: { code, message } }`, mapeando violações de constraints do PostgreSQL.
- **Logging Estruturado**: Integrado `pino` com mascaramento automático de campos sensíveis.

## 3. Autenticação e Segurança
- **Migração para Cookies `httpOnly`**: Sessão transferida de `localStorage` para cookies seguros.
- **Hardening de JWT**: Algoritmo `HS256` fixado na emissão e na validação.
- **Custo Bcrypt 12**: Criptografia de senhas fortalecida com 12 rodadas e dummy hash para prevenção de timing attacks.
- **Rate Limiting**: Limitadores de taxa global e específico para rotas de autenticação via `express-rate-limit`.
- **Proteção CSRF**: Middleware exigindo cabeçalho customizado e verificação de origem.
- **Cabeçalhos de Segurança**: Integração de `helmet` e CORS restrito a origens confiáveis com `credentials: true`.
- **Isolamento Multi-tenant em SSE**: Server-Sent Events agora distribuem dados apenas aos clientes com mesmo `owner_id`.
- **Privacidade em Logs**: E-mails mascarados em saídas de terminal e logs de scripts.

## 4. Servidor de Relatórios (RF06 / RF07)
- **Endpoint `GET /api/reports`**: Cálculo consolidado e detalhado de diárias executado diretamente no backend em centavos inteiros, eliminando imprecisões de ponto flutuante no navegador.

## 5. Frontend e UI
- **Consolidação de Componentes**: `DatePickerField` e utilitários de calendário extraídos para componentes reutilizáveis compartilhados entre Chamada e Relatórios.
- **Acessibilidade Aprimorada**: Utilização de atributo `disabled` nativo e `aria-live` em notificações toast.
- **Resolução de Concorrência**: Trava no botão de chamada evitando inconsistências em cliques repetidos rápidos.
- **Service Worker Endurecido**: Descarte explícito de rotas `/api/*` no cache e versionamento limpo de estáticos.
- **Limpeza de Código**: Remoção de comentários legados do Supabase e refatoração de dependências de hooks React.

## 6. Qualidade, Testes e CI
- **Suíte de Testes com Vitest e Supertest**: Testes unitários para utilitários de calendário e testes de integração com mock do banco testando rotas da API.
- **Integração Contínua**: Pipeline do GitHub Actions configurado para lint, build e testes automatizados a cada push ou pull request.
