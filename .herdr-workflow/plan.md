# Plan: Login do Titular com Google OAuth 2.0

## Discovery notes

- `.herdr-workflow/discovery.md` não existe neste checkout; plano baseado em `.herdr-workflow/issue.txt`, `CONTEXT.md` e inspeção da API.
- A API NestJS atual é o starter mínimo (`AppModule`, `AppController`, `AppService`), sem persistência, módulos de autenticação ou configuração centralizada.
- Não há ADRs em `docs/adr/` no checkout.

## Implementation steps

1. **Adicionar dependências mínimas**
   - Em `api/package.json`/`package-lock.json`, adicionar bibliotecas para OAuth/token:
     - `google-auth-library` para gerar URL OAuth, trocar `code` por tokens e validar `id_token` do Google.
     - `jsonwebtoken` e `@types/jsonwebtoken` para emitir/verificar token de sessão da aplicação.
   - Evitar credenciais hardcoded; toda configuração via `process.env`.

2. **Criar módulo de autenticação**
   - Novo diretório sugerido: `api/src/auth/`.
   - Arquivos sugeridos:
     - `auth.module.ts`
     - `auth.controller.ts`
     - `auth.service.ts`
     - `auth.guard.ts`
     - `current-titular.decorator.ts` ou tipos auxiliares equivalentes.
   - Importar `AuthModule` em `AppModule` sem alterar o endpoint raiz existente além do necessário.

3. **Definir configuração por variáveis de ambiente**
   - Variáveis obrigatórias:
     - `GOOGLE_OAUTH_CLIENT_ID`
     - `GOOGLE_OAUTH_CLIENT_SECRET`
     - `GOOGLE_OAUTH_CALLBACK_URL` (ex.: `http://localhost:3000/auth/google/callback`)
     - `APP_AUTH_TOKEN_SECRET` (mínimo recomendado: 32+ caracteres aleatórios)
   - Variáveis opcionais com defaults seguros/local-friendly:
     - `APP_AUTH_COOKIE_NAME=notifyfin_auth`
     - `APP_AUTH_COOKIE_SECURE=false` em local; `true` em produção
     - `APP_AUTH_TOKEN_TTL_SECONDS=604800`
   - Validar configuração no uso dos endpoints de auth; retornar `503 Service Unavailable` com mensagem genérica quando faltar configuração, sem expor nomes de segredos ou valores.

4. **Implementar início do OAuth**
   - Endpoint: `GET /auth/google`.
   - Gerar `state` criptograficamente aleatório.
   - Salvar `state` em cookie temporário `HttpOnly`, `SameSite=Lax`, curta duração (ex.: 10 minutos); `Secure` controlado por env.
   - Redirecionar (`302`) para o Google com:
     - `scope=openid email profile`
     - `response_type=code`
     - `redirect_uri=GOOGLE_OAUTH_CALLBACK_URL`
     - `state`.

5. **Implementar callback do Google**
   - Endpoint: `GET /auth/google/callback`.
   - Tratar `error`, ausência de `code` e ausência/divergência de `state` com respostas 400/401 sanitizadas.
   - Trocar `code` por tokens usando `google-auth-library`.
   - Validar `id_token` com audience `GOOGLE_OAUTH_CLIENT_ID`.
   - Validar perfil mínimo do Titular:
     - `sub` presente;
     - `email` presente e formato básico válido;
     - `email_verified === true`;
     - `name`/`picture` opcionais e tratados defensivamente.
   - Criar representação mínima do Titular a partir das claims do Google, sem banco por enquanto:
     - `id: google:<sub>` ou equivalente estável;
     - `email`, `name`, `picture` quando disponíveis.
   - Emitir token JWT da aplicação com `sub`, dados mínimos do Titular, `iat`, `exp`, `iss`/`aud` fixos.
   - Gravar token em cookie de sessão `HttpOnly`, `SameSite=Lax`, `Secure` configurável; limpar cookie de `state`.
   - Responder com payload seguro (ex.: `{ titular: ... }` ou redirecionamento local se decidido); não retornar segredos nem tokens em logs.

6. **Implementar endpoint autenticado do Titular atual**
   - Endpoint sugerido: `GET /titular/me` para manter vocabulário do domínio.
   - Proteger com guard que aceita token do cookie `APP_AUTH_COOKIE_NAME`; opcionalmente aceitar `Authorization: Bearer` para facilitar clientes/testes, mantendo cookie como fluxo principal.
   - Verificar assinatura, expiração, issuer/audience; retornar `401 Unauthorized` para token ausente, inválido ou expirado.
   - Retornar somente dados do Titular atual derivados do token, sem claims internas sensíveis.

7. **Tratamento de erros e segurança**
   - Usar exceções Nest (`BadRequestException`, `UnauthorizedException`, `ServiceUnavailableException`) com mensagens genéricas.
   - Não interpolar client secret, tokens Google, JWT ou env values em mensagens de erro.
   - Evitar logs de payloads completos do provedor.
   - Usar `crypto.randomBytes` para `state` e segredos temporários.

8. **Testes automatizados**
   - Unitários (`api/src/auth/*.spec.ts`):
     - gera URL de login com state e escopos corretos;
     - configuração ausente retorna erro sanitizado;
     - callback de sucesso valida ID token e emite cookie/token;
     - falhas: `state` inválido, `code` ausente, erro do Google, email não verificado, perfil sem `sub`/`email`;
     - verificação de token válido/inválido/expirado.
   - E2E (`api/test/app.e2e-spec.ts` ou novo spec):
     - `GET /titular/me` sem sessão retorna 401;
     - `GET /titular/me` com JWT válido retorna Titular atual;
     - `GET /auth/google` sem env obrigatório retorna 503 sem expor segredos;
     - opcional: `GET /auth/google` com env válido retorna 302 para domínio Google.
   - Mockar `google-auth-library` ou encapsular o cliente Google em provider injetável para testes determinísticos sem chamadas externas.

9. **Documentação**
   - Atualizar `api/README.md` (ou raiz + referência para API) com:
     - variáveis de ambiente e exemplos sem credenciais reais;
     - URL autorizada no Google Cloud Console: `http://localhost:3000/auth/google/callback` para local;
     - origem JavaScript autorizada local se aplicável: `http://localhost:3000`;
     - fluxo de uso local: instalar deps, exportar envs, `npm run start:dev`, abrir `/auth/google`, chamar `/titular/me` com cookie;
     - nota sobre `APP_AUTH_COOKIE_SECURE=true` em produção atrás de HTTPS.

## Validation strategy

Executar a partir de `api/`:

1. `npm install` (após alteração de dependências, para atualizar lockfile se necessário).
2. `npm run test`
3. `npm run test:e2e`
4. `npm run lint`
5. `npm run build`

Também revisar manualmente que:

- `git diff` não contém client IDs/secrets reais.
- Mensagens de erro não incluem valores de env, tokens Google ou JWT.
- `Set-Cookie` usa `HttpOnly`, `SameSite=Lax`, `Max-Age` e `Secure` conforme env.

## Rollback notes

- Remover `AuthModule` do `AppModule`.
- Excluir arquivos em `api/src/auth/` e specs relacionados.
- Reverter alterações em `api/package.json`, `api/package-lock.json`, `api/README.md` e e2e specs.
- Remover variáveis de ambiente configuradas no ambiente local/deploy.
- Sem migrações ou dados persistidos esperados, pois a implementação planejada usa JWT stateless e não cria registros em banco.

## Open questions

1. O login deve aceitar qualquer Conta Google com email verificado ou haverá allowlist/domínio permitido para o Titular?
2. Após o callback, a API deve responder JSON ou redirecionar para uma URL de frontend? Se redirecionar, qual variável/env deve definir o destino?
3. O token stateless em cookie é suficiente neste estágio ou há requisito de revogação/sessões persistidas?
4. O endpoint preferido para o Titular atual é `GET /titular/me` ou a equipe prefere `GET /auth/me`?
