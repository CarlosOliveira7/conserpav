# Roteiro de Validação

Execute esta validação após configurar o PostgreSQL e a API e antes de liberar uma versão.

## Verificações automatizadas

```bash
npm run lint
npm run build
```

Os dois comandos devem terminar sem erros.

## Ambiente e autenticação

- [ ] A aplicação inicia com `npm run dev`.
- [ ] A tela de login é exibida para uma sessão inexistente.
- [ ] Um login válido abre a aplicação principal.
- [ ] Credenciais inválidas exibem uma mensagem de erro clara.
- [ ] Campos de e-mail e senha vazios são validados.
- [ ] O logout encerra a sessão e retorna à tela de login.
- [ ] O fluxo de recuperação envia o usuário para a URL configurada.
- [ ] A alteração de senha funciona com uma sessão válida.

## Dados da aplicação

- [ ] É possível criar, editar e excluir uma obra.
- [ ] É possível criar, editar e excluir um funcionário.
- [ ] A obra não aceita funcionários duplicados pelo mesmo nome.
- [ ] A chamada permite ausência, diária completa e meia diária.
- [ ] A navegação entre semanas preserva os registros anteriores.
- [ ] O relatório apresenta totais coerentes com a frequência marcada.
- [ ] A chave Pix pode ser copiada quando cadastrada.
- [ ] O período semanal ou quinzenal altera o fechamento conforme esperado.

## Persistência e segurança

- [ ] Uma atualização feita em outra aba aparece via Realtime.
- [ ] A atualização da página preserva os dados salvos.
- [ ] Usuário sem sessão não acessa dados protegidos.
- [ ] As variáveis de ambiente não aparecem no repositório.
- [ ] O build de produção funciona no domínio publicado.

## Evidências recomendadas

Para uma entrega profissional, registre a data da validação, o ambiente testado, o commit publicado e eventuais limitações conhecidas. Não inclua senhas, chaves ou tokens nas evidências.
