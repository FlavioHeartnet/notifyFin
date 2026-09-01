# NotifyFin API

Backend NestJS do NotifyFin. A aplicação exige configuração válida antes de iniciar e expõe as superfícies administrativa e pública em hostnames distintos.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npm run test:infra:up
npm run start:dev
```

O PostgreSQL local é efêmero e definido em `../compose.test.yaml`.

## Verificação

```bash
npm run test:infra:up
npm run lint
npm run test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm run test:infra:down
```

Os testes E2E usam PostgreSQL real em `127.0.0.1:55432`. O comando de subida aplica as migrações antes dos testes.

Em produção, `DATABASE_URL` deve usar PostgreSQL com `sslmode=require`, `verify-ca` ou `verify-full`. Migrações de produção falham imediatamente quando essa variável não está definida.

## Health checks

Na superfície administrativa:

- `GET /health/live`: confirma que o processo HTTP está funcional e não depende do banco.
- `GET /health/ready`: confirma que a API consegue consultar o PostgreSQL e que há migração aplicada; responde `503` de forma sanitizada quando indisponível.

## Exceção temporária de dependência

O Prisma 7.10 fixa `deepmerge-ts` 7.1.5, afetado por `GHSA-ggr8-5vv4-36mx`. O `package.json` força a versão 8.0.0 até o Prisma atualizar essa dependência. Geração do client, migrações, testes e build validam essa combinação; a exceção deve ser removida assim que houver correção upstream suportada.
