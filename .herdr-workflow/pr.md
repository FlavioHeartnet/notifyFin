# Implementar login do Titular com Google OAuth 2.0

## Summary

- Adiciona `AuthModule` à API NestJS com fluxo mínimo Google OAuth 2.0:
  - `GET /auth/google` inicia autenticação e grava cookie temporário de `state`.
  - `GET /auth/google/callback` valida callback, `state`, `id_token` e perfil Google.
  - `GET /titular/me` retorna o Titular atual autenticado.
- Emite/verifica token JWT de sessão da aplicação via cookie `HttpOnly` ou `Authorization: Bearer`.
- Configura tudo por variáveis de ambiente e usa mensagens de erro genéricas para configuração ausente/falhas de autenticação.
- Documenta setup local, variáveis e URLs autorizadas no `api/README.md`.
- Adiciona testes unitários e e2e para sucesso e falhas relevantes.

## Test plan

Validação registrada em `.herdr-workflow/validation.md`:

- `cd api && npm ci`
- `cd api && npm test -- --runInBand`
- `cd api && npm run test:e2e -- --runInBand`
- `cd api && npm run build`

Revisão também registrou:

- `cd api && npm run lint` ✅
- `cd api && npm audit --omit=dev --json` ⚠️ vulnerabilidades existentes/transitivas em dependências de produção (`@nestjs/platform-express`/`multer` e `qs`), não específicas da implementação de auth.

## Risk / rollback

- Riscos:
  - Sessões são stateless em JWT; não há revogação/logout server-side nesta entrega.
  - O callback retorna JSON; um frontend futuro pode precisar de redirecionamento configurável pós-login.
  - Qualquer Conta Google com `email_verified=true` é aceita; allowlist/domínio pode ser necessário depois.
- Rollback:
  - Remover `AuthModule` de `api/src/app.module.ts`.
  - Reverter/remover `api/src/auth/`, testes relacionados, dependências adicionadas e documentação de OAuth.
  - Remover variáveis de ambiente configuradas no ambiente de execução.
  - Não há migração ou dado persistido para desfazer.

## Reviewer notes

- Não foram encontradas credenciais reais no diff; exemplos e testes usam placeholders/dados dummy.
- Variáveis obrigatórias: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_CALLBACK_URL`, `APP_AUTH_TOKEN_SECRET`.
- Variáveis opcionais: `APP_AUTH_COOKIE_NAME`, `APP_AUTH_COOKIE_SECURE`, `APP_AUTH_TOKEN_TTL_SECONDS`.
- Sugestões não bloqueantes da revisão: restringir algoritmo JWT explicitamente (`HS256`), limpar cookie temporário de `state` também em falhas de callback, e acompanhar as vulnerabilidades transitivas reportadas pelo audit.
- O checkout local está em `master`, embora o workflow indique `agent/google-auth-login`; confirmar a branch antes de publicar o PR.
