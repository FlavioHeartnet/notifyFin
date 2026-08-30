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

Os testes E2E usam PostgreSQL real em `127.0.0.1:55432`.

## Health checks

Na superfície administrativa:

- `GET /health/live`: confirma que o processo HTTP está funcional e não depende do banco.
- `GET /health/ready`: confirma que a API consegue consultar o PostgreSQL; responde `503` de forma sanitizada quando indisponível.
