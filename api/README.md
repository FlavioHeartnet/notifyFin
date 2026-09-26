# NotifyFin API

API NestJS do NotifyFin.

## Setup local

```bash
npm install
npm run start:dev
```

A API escuta em `http://localhost:3000` por padrão.

## Login do Titular com Google OAuth 2.0

Configure as variáveis de ambiente antes de iniciar a API:

```bash
export GOOGLE_OAUTH_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
export GOOGLE_OAUTH_CLIENT_SECRET="seu-client-secret"
export GOOGLE_OAUTH_CALLBACK_URL="http://localhost:3000/auth/google/callback"
export APP_AUTH_TOKEN_SECRET="gere-um-valor-aleatorio-com-32-ou-mais-caracteres"

# opcionais
export APP_AUTH_COOKIE_NAME="notifyfin_auth"
export APP_AUTH_COOKIE_SECURE="false"
export APP_AUTH_TOKEN_TTL_SECONDS="604800"
```

Não coloque credenciais reais no repositório. Em produção, use HTTPS e defina `APP_AUTH_COOKIE_SECURE=true`.

### URLs autorizadas no Google Cloud Console

Para uso local, cadastre no OAuth Client do Google:

- **Authorized redirect URI**: `http://localhost:3000/auth/google/callback`
- **Authorized JavaScript origin**: `http://localhost:3000` (se houver cliente web local chamando a API diretamente)

### Fluxo de uso

1. Abra `GET http://localhost:3000/auth/google` no navegador.
2. A API redireciona para o Google e grava um cookie temporário de `state` (`HttpOnly`, `SameSite=Lax`).
3. No callback, a API valida o `id_token`, exige `email_verified=true` e cria um token de sessão próprio em cookie `HttpOnly`.
4. Chame `GET http://localhost:3000/titular/me` com o cookie de sessão para obter o Titular atual.

O endpoint autenticado também aceita `Authorization: Bearer <token>` para facilitar clientes e testes.

## Testes

```bash
npm run test
npm run test:e2e
npm run build
npm run lint
```
