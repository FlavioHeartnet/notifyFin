import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  RUNTIME_CONFIG,
  RuntimeConfig,
} from '../src/platform/config/runtime-config';

describe('API readiness (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports ready when PostgreSQL is reachable', async () => {
    await request(app.getHttpServer())
      .get('/health/ready')
      .set('Host', 'admin.notifyfin.test')
      .expect(200)
      .expect({ status: 'ok', checks: { database: 'up' } });
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
      .expect({ status: 'error', checks: { database: 'down' } });

    expect(response.text).not.toContain('private-password');
    await unavailableApp.close();
  });

  it('reports unavailable when PostgreSQL is reachable but unmigrated', async () => {
    const unmigratedApp = await createAppWithDatabase(
      'postgresql://notifyfin:notifyfin_test@127.0.0.1:55432/notifyfin_unmigrated',
    );

    await request(unmigratedApp.getHttpServer())
      .get('/health/ready')
      .set('Host', 'admin.notifyfin.test')
      .expect(503)
      .expect({ status: 'error', checks: { database: 'down' } });

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
