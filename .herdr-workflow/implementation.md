# Implementation: Login do Titular com Google OAuth 2.0

## Arquivos alterados

- `api/package.json` / `api/package-lock.json`
  - Adicionadas dependências `google-auth-library`, `jsonwebtoken` e tipos de JWT.
- `api/src/app.module.ts`
  - Importa o novo `AuthModule`.
- `api/src/main.ts`
  - Ajuste pequeno para satisfazer lint (`void bootstrap()`).
- `api/src/auth/auth.module.ts`
  - Novo módulo de autenticação.
- `api/src/auth/auth.controller.ts`
  - Expõe `GET /auth/google` e `GET /auth/google/callback`.
- `api/src/auth/auth.service.ts`
  - Configuração via variáveis de ambiente, geração/validação do fluxo OAuth, validação do perfil Google e emissão/verificação do JWT da aplicação.
- `api/src/auth/google-oauth.provider.ts`
  - Provider/factory injetável para `OAuth2Client`, facilitando testes sem rede.
- `api/src/auth/auth.guard.ts`
  - Guard para token em cookie ou `Authorization: Bearer`.
- `api/src/auth/current-titular.decorator.ts`
  - Decorator para acessar o Titular atual no request.
- `api/src/auth/titular.controller.ts`
  - Expõe `GET /titular/me` autenticado.
- `api/src/auth/auth.types.ts`
  - Tipos mínimos de autenticação/Titular.
- `api/src/auth/cookie.utils.ts`
  - Parser mínimo de cookies para evitar nova dependência.
- `api/src/auth/auth.service.spec.ts`
  - Testes unitários de sucesso, configuração ausente, falhas OAuth/perfil e tokens.
- `api/test/app.e2e-spec.ts`
  - Testes e2e de sessão ausente, token válido, configuração ausente e início do OAuth.
- `api/README.md`
  - Documentação das variáveis, URLs autorizadas no Google Cloud Console e uso local.

## Decisões e raciocínio

- Mantida implementação stateless e mínima: o Titular atual é derivado das claims validadas do Google e persistido apenas no JWT de sessão da aplicação.
- O cookie de sessão é `HttpOnly`, `SameSite=Lax`, `Secure` configurável e com TTL configurável.
- O `state` OAuth é aleatório, curto e salvo em cookie temporário `HttpOnly` para proteção do callback.
- Erros de configuração e autenticação usam mensagens genéricas, sem interpolar nomes/valores de secrets, tokens ou payloads externos.
- `APP_AUTH_TOKEN_SECRET` é obrigatório e precisa ter ao menos 32 caracteres para reduzir risco de tokens fracos.
- O endpoint autenticado principal segue o vocabulário do domínio: `GET /titular/me`.

## Validação executada

- `cd api && npm run test`
- `cd api && npm run test:e2e`
- `cd api && npm run lint`
- `cd api && npm run build`

Todos passaram.

## Riscos / pontos em aberto

- Não há persistência nem revogação de sessão; logout/revogação exigiriam armazenamento ou lista de bloqueio.
- O callback retorna JSON com o Titular; se houver frontend dedicado, pode ser necessário adicionar redirecionamento configurável após login.
- A política atual aceita qualquer Conta Google com `email_verified=true`; allowlist/domínio corporativo pode ser adicionada depois se o produto exigir.
