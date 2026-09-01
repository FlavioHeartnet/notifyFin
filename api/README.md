# NotifyFin API

Backend NestJS do NotifyFin. A aplicação exige configuração válida antes de iniciar e expõe as superfícies administrativa e pública em hostnames distintos. Requer Node.js 22.12 ou superior.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npm run test:infra:up
npm run start:dev
# Em outro processo:
npm run start:worker:dev
```

O PostgreSQL local é efêmero e definido em `../compose.test.yaml`. A API e o worker são processos lógicos independentes produzidos pelo mesmo build.

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

Em produção, `DATABASE_URL` deve usar PostgreSQL com `sslmode=require`, `verify-ca` ou `verify-full`. Antes de iniciar API e worker, o release executa uma única vez:

```bash
npm run prisma:migrate:deploy
npm run queue:migrate:deploy
```

Os runtimes usam pg-boss com migração automática desativada e falham ou ficam não prontos quando o schema da fila não foi provisionado. Os entrypoints compilados são `node dist/main` e `node dist/worker`. Neste tracer bullet, o worker falha fechado na inicialização e é observado pelo estado do processo; uma prova independente de readiness após a inicialização permanece para o milestone operacional da #15.

## Health checks

Na superfície administrativa:

- `GET /health/live`: confirma que o processo HTTP está funcional e não depende do banco.
- `GET /health/ready`: confirma PostgreSQL e pg-boss independentemente; responde `503` de forma sanitizada, indicando cada dependência como `up` ou `down`.

## Exceção temporária de dependência

O Prisma 7.10 fixa `deepmerge-ts` 7.1.5, afetado por `GHSA-ggr8-5vv4-36mx`. O `package.json` força a versão 8.0.0 até o Prisma atualizar essa dependência. Geração do client, migrações, testes e build validam essa combinação; a exceção deve ser removida assim que houver correção upstream suportada.
