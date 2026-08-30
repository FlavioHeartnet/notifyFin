import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('HTTP surface foundation (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.ADMIN_HOSTNAME = 'admin.notifyfin.test';
    process.env.PUBLIC_HOSTNAME = 'public.notifyfin.test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.ADMIN_HOSTNAME;
    delete process.env.PUBLIC_HOSTNAME;
  });

  it('reports API liveness only on the administrative hostname', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .set('Host', 'admin.notifyfin.test')
      .expect(200)
      .expect({ status: 'ok' });

    await request(app.getHttpServer())
      .get('/health/live')
      .set('Host', 'public.notifyfin.test')
      .expect(404);
  });
});
