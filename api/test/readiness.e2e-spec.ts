import { INestApplication, INestApplicationContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  RUNTIME_CONFIG,
  RuntimeConfig,
} from '../src/platform/config/runtime-config';
import { bootstrapWorker } from '../src/worker';

describe('API readiness (e2e)', () => {
  let app: INestApplication<App>;
  let worker: INestApplicationContext;

  beforeAll(async () => {
    worker = await bootstrapWorker();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await worker.close();
  });

  it('reports ready when PostgreSQL, pg-boss and a worker are available', async () => {
    await request(app.getHttpServer())
      .get('/health/ready')
      .set('Host', 'admin.notifyfin.test')
      .expect(200)
      .expect({
        status: 'ok',
        checks: { database: 'up', queue: 'up', worker: 'up' },
      });
  });

  it('reports unavailable without exposing connection errors', async () => {
    const unavailableApp = await createAppWithDatabase(
      'postgresql://notifyfin:private-password@127.0.0.1:1/notifyfin_test',
    );

    await request(unavailableApp.getHttpServer())
      .get('/health/live')
      .set('Host', 'admin.notifyfin.test')
      .expect(200)
      .expect({ status: 'ok' });

    const response = await request(unavailableApp.getHttpServer())
      .get('/health/ready')
      .set('Host', 'admin.notifyfin.test')
      .expect(503)
      .expect({
        status: 'error',
        checks: { database: 'down', queue: 'down', worker: 'down' },
      });

    expect(response.text).not.toContain('private-password');
    await unavailableApp.close();
  });

  it('reports database up and queue and worker down when pg-boss is unmigrated', async () => {
    const queueUnmigratedApp = await createAppWithDatabase(
      'postgresql://notifyfin:notifyfin_test@127.0.0.1:55432/notifyfin_queue_unmigrated',
    );

    await request(queueUnmigratedApp.getHttpServer())
      .get('/health/ready')
      .set('Host', 'admin.notifyfin.test')
      .expect(503)
      .expect({
        status: 'error',
        checks: { database: 'up', queue: 'down', worker: 'down' },
      });

    await queueUnmigratedApp.close();
  });

  it('reports unavailable when PostgreSQL is reachable but unmigrated', async () => {
    const unmigratedApp = await createAppWithDatabase(
      'postgresql://notifyfin:notifyfin_test@127.0.0.1:55432/notifyfin_unmigrated',
    );

    await request(unmigratedApp.getHttpServer())
      .get('/health/ready')
      .set('Host', 'admin.notifyfin.test')
      .expect(503)
      .expect({
        status: 'error',
        checks: { database: 'down', queue: 'down', worker: 'down' },
      });

    await unmigratedApp.close();
  });
});

async function createAppWithDatabase(databaseUrl: string) {
  const runtimeConfig: RuntimeConfig = {
    environment: 'test',
    port: 3000,
    administrativeHostname: 'admin.notifyfin.test',
    publicHostname: 'public.notifyfin.test',
    databaseUrl,
  };
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RUNTIME_CONFIG)
    .useValue(runtimeConfig)
    .compile();
  const app: INestApplication<App> = moduleFixture.createNestApplication();
  await app.init();
  return app;
}
