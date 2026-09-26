# Discovery — Google OAuth login do Titular

## Escopo entendido

Implementar na API NestJS login do **Titular** via Google OAuth 2.0, com:

- endpoint para iniciar autenticação;
- endpoint de callback do Google;
- validação do perfil retornado pelo Google;
- sessão/token seguro da aplicação;
- endpoint autenticado que retorna o Titular atual;
- tratamento seguro de configuração ausente e falhas de autenticação;
- configuração por variáveis de ambiente, sem credenciais no repositório;
- testes automatizados de sucesso e falhas relevantes;
- documentação de variáveis, URLs autorizadas e uso local;
- implementação mínima e compatível com a arquitetura existente.

## Estrutura atual relevante

Repositório extremamente inicial, gerado a partir do starter NestJS:

```text
api/
  package.json
  package-lock.json
  src/
    app.controller.ts
    app.controller.spec.ts
    app.module.ts
    app.service.ts
    main.ts
  test/
    app.e2e-spec.ts
    jest-e2e.json
```

Arquivos de contexto/documentação:

```text
CONTEXT.md
README.md
docs/agents/domain.md
docs/agents/issue-tracker.md
docs/research/*.md
```

Não há `docs/adr/` no checkout atual. O vocabulário de domínio define **Titular** como a pessoa cujas contas, transações e metas financeiras são acompanhadas. Evitar termos como “usuário final”, “cliente” etc. quando nomear conceitos de domínio.

## Estado da aplicação NestJS

- `api/src/app.module.ts`: módulo raiz com `AppController` e `AppService` apenas.
- `api/src/app.controller.ts`: `GET /` retorna `Hello World!`.
- `api/src/app.service.ts`: serviço trivial.
- `api/src/main.ts`: cria app e escuta em `process.env.PORT ?? 3000`.
- Não existe camada de autenticação, persistência, configuração tipada, DTOs, guards, decorators, filtros globais, banco de dados ou módulo de domínio do Titular.

## Dependências atuais

Produção (`api/package.json`):

- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/platform-express`
- `reflect-metadata`
- `rxjs`

Desenvolvimento/testes:

- Jest/ts-jest/supertest
- ESLint + Prettier
- TypeScript
- Nest testing/CLI/schematics

Não existem dependências de OAuth, Passport, JWT, cookies, config ou validação. `package-lock.json` também não indica `passport`, `jwt`, `oauth`, `@nestjs/config`, etc.

## Convenções observadas

- TypeScript com `module: nodenext`, `target: ES2023`, `strictNullChecks: true`.
- Testes unitários ficam sob `api/src/**/*.spec.ts`.
- Testes e2e ficam sob `api/test/*.e2e-spec.ts`.
- Scripts relevantes:
  - `npm run build`
  - `npm run lint`
  - `npm run test`
  - `npm run test:e2e`
- ESLint está configurado com `recommendedTypeChecked` e Prettier. Regras importantes:
  - `@typescript-eslint/no-explicit-any`: off
  - `@typescript-eslint/no-floating-promises`: warn
  - `@typescript-eslint/no-unsafe-argument`: warn
- `api/.gitignore` já ignora arquivos `.env*` locais e `node_modules`, `dist`, `coverage`.
- Não há `.env.example` atualmente.

## Possíveis abordagens compatíveis com implementação mínima

Como o projeto ainda não possui autenticação nem persistência, a implementação mais simples deve provavelmente criar um módulo novo e autocontido, por exemplo `src/auth/`, sem mexer muito no starter.

### Opção sem Passport, com poucas dependências

Implementar o fluxo OAuth diretamente:

1. `GET /auth/google`:
   - validar presença de variáveis obrigatórias;
   - gerar `state` seguro com `crypto.randomBytes`;
   - guardar/assinar o `state` em cookie temporário HttpOnly/SameSite ou embutir estado assinado;
   - redirecionar para `https://accounts.google.com/o/oauth2/v2/auth` com `client_id`, `redirect_uri`, `scope=openid email profile`, `response_type=code`, `state`.
2. `GET /auth/google/callback`:
   - validar `state`;
   - trocar `code` por tokens em `https://oauth2.googleapis.com/token` via `fetch` nativo do Node 18+;
   - buscar perfil em `https://www.googleapis.com/oauth2/v3/userinfo` ou validar `id_token` se biblioteca apropriada for adicionada;
   - validar perfil: `sub` presente, `email` presente, `email_verified === true` se usado, e nome/foto opcionais;
   - emitir token da aplicação assinado com segredo local (`crypto.createHmac`) ou JWT.
3. `GET /titular/me` ou `GET /auth/me`:
   - guard de Bearer token;
   - retornar o Titular atual derivado do token.

Esta opção minimiza dependências, mas exige cuidado na assinatura/expiração do token e na validação do `id_token`/perfil. Se apenas `userinfo` for usado, os testes devem mockar chamadas HTTP externas.

### Opção com dependências padrão Nest

Adicionar dependências como:

- `@nestjs/config` para configuração por ambiente;
- `@nestjs/jwt` e `jsonwebtoken`/dependência transitiva para token da aplicação;
- opcionalmente `passport`, `@nestjs/passport`, `passport-google-oauth20`, `passport-jwt`.

É mais convencional, mas adiciona mais superfície ao projeto. Dado o critério de “implementação mínima”, a equipe deve decidir se Passport é necessário ou se fluxo manual + JWT/HMAC basta.

## Arquivos provavelmente alterados/adicionados

Prováveis alterações:

- `api/package.json` e `api/package-lock.json` — se forem adicionadas dependências como `@nestjs/config`, `@nestjs/jwt`, Passport etc.
- `api/src/app.module.ts` — importar novo módulo de autenticação/configuração.
- `api/README.md` ou README raiz — documentar variáveis, URLs autorizadas no Google Cloud Console e uso local.
- Possível `.env.example` em `api/` — seguro, sem segredos reais, para documentar nomes de variáveis.

Prováveis novos arquivos:

```text
api/src/auth/auth.module.ts
api/src/auth/auth.controller.ts
api/src/auth/auth.service.ts
api/src/auth/auth.guard.ts
api/src/auth/current-titular.decorator.ts        # opcional
api/src/auth/google-oauth.service.ts             # opcional para isolar chamadas Google
api/src/auth/auth.config.ts                      # opcional
api/src/auth/*.spec.ts
api/test/auth.e2e-spec.ts                        # ou expandir app.e2e-spec.ts
```

Se optar por separar o endpoint do Titular:

```text
api/src/titular/titular.module.ts
api/src/titular/titular.controller.ts
```

Como não há persistência, o “Titular atual” provavelmente terá de ser uma representação mínima derivada do perfil Google/token, por exemplo `id/sub`, `email`, `name`, `picture`. Persistência de cadastro de Titular seria uma extensão arquitetural maior e não parece existir no projeto.

## Variáveis de ambiente esperadas

Sugestão de nomes claros e mínimos:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` ou derivar de `APP_URL` + path fixo
- `AUTH_TOKEN_SECRET` ou `JWT_SECRET`
- `AUTH_TOKEN_TTL_SECONDS` ou similar, opcional com default seguro/curto
- `APP_URL` ou `FRONTEND_URL`, se o callback precisar redirecionar para uma UI após criar o token
- `PORT` já é usado por `main.ts`

Critério importante: erro de configuração ausente deve retornar mensagem genérica/segura e nunca ecoar valores de segredos.

## Endpoints sugeridos

Nomes mínimos e explícitos:

- `GET /auth/google` — inicia OAuth com redirect para Google.
- `GET /auth/google/callback` — recebe callback do Google.
- `GET /titular/me` — autenticado, retorna Titular atual.

Alternativa mais concentrada: `GET /auth/me`. Porém o critério fala em Titular atual; `/titular/me` alinha melhor ao vocabulário de domínio.

## Testes relevantes a adicionar

Unitários:

- construção correta da URL de autorização Google sem expor segredo;
- erro seguro quando variáveis obrigatórias estão ausentes;
- validação de perfil Google válido;
- rejeição de perfil sem `sub`;
- rejeição de perfil sem `email` ou com `email_verified=false`, se essa regra for adotada;
- emissão e validação de token/sessão;
- rejeição de token ausente, inválido ou expirado.

E2E:

- `GET /auth/google` retorna redirect 302 para domínio Google quando configurado;
- `GET /auth/google` retorna erro seguro se config ausente;
- `GET /auth/google/callback` com falha do Google/code inválido retorna erro seguro;
- `GET /titular/me` sem Bearer token retorna 401;
- `GET /titular/me` com token válido retorna dados do Titular.

Para evitar chamada real ao Google nos testes, isolar o cliente Google em service injetável e mockável.

## Riscos e pontos de atenção

- **Sem persistência atual**: não há modelagem/cadastro do Titular. Criar banco/repositório seria maior que o necessário. Para implementação mínima, o Titular atual pode vir do token gerado a partir do Google.
- **Validação de OAuth**: trocar `code` por tokens e confiar apenas em `userinfo` é simples, mas validar `id_token` com bibliotecas oficiais é mais robusto. Decidir o equilíbrio mínimo/seguro.
- **CSRF no callback**: o parâmetro `state` deve ser gerado e validado; não omitir.
- **Segredos em logs/erros**: mensagens de erro não devem incluir `client_secret`, token do Google, token da aplicação ou env bruto.
- **Cookies vs Bearer token**: o critério aceita sessão/token. Bearer token é mais simples para API; cookie HttpOnly pode ser mais seguro para browser, mas requer mais decisões de frontend/CORS.
- **Dependências não instaladas localmente**: `node_modules` não existe no checkout usado; comandos npm falharam antes de `npm install`/`npm ci`.
- **README atual é o padrão do Nest**: documentação de uso local provavelmente deve substituir/adicionar seção específica do projeto.
- **TypeScript NodeNext**: atenção a imports/interop de libs CommonJS se Passport/JWT forem usados.

## Validação executada durante discovery

Comando executado:

```bash
cd api && npm test -- --runInBand
```

Resultado:

```text
sh: 1: jest: not found
```

Interpretação: dependências não estão instaladas (`node_modules` ausente ou incompleto). Não indica falha dos testes existentes.

## Comandos sugeridos para validação após implementação

A partir de `api/`:

```bash
npm ci
npm run build
npm run lint
npm run test -- --runInBand
npm run test:e2e -- --runInBand
```

Se forem adicionadas dependências, confirmar que `package-lock.json` foi atualizado de forma reprodutível.

## Estado do Git no discovery

```text
## agent/google-auth-login
```

Sem alterações rastreadas antes da criação deste artefato de discovery.
