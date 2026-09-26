import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { sign } from 'jsonwebtoken';
import { AppModule } from './../src/app.module';

const VALID_ENV = {
  GOOGLE_OAUTH_CLIENT_ID: 'google-client-id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'google-client-secret',
  GOOGLE_OAUTH_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
  APP_AUTH_TOKEN_SECRET: '0123456789abcdef0123456789abcdef',
  APP_AUTH_COOKIE_NAME: 'notifyfin_auth',
  APP_AUTH_COOKIE_SECURE: 'false',
  APP_AUTH_TOKEN_TTL_SECONDS: '3600',
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv, ...VALID_ENV };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/titular/me (GET) retorna 401 sem sessão', () => {
    return request(app.getHttpServer()).get('/titular/me').expect(401);
  });

  it('/titular/me (GET) retorna o Titular atual com token válido', async () => {
    const token = sign(
      {
        titular: {
          id: 'google:123',
          email: 'titular@example.com',
          name: 'Titular',
        },
      },
      VALID_ENV.APP_AUTH_TOKEN_SECRET,
      {
        subject: 'google:123',
        expiresIn: 60,
        issuer: 'notifyfin-api',
        audience: 'notifyfin-app',
      },
    );

    await request(app.getHttpServer())
      .get('/titular/me')
      .set('Cookie', [`notifyfin_auth=${token}`])
      .expect(200)
      .expect({
        id: 'google:123',
        email: 'titular@example.com',
        name: 'Titular',
      });
  });

  it('/auth/google (GET) retorna 503 sanitizado quando configuração falta', async () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    const response = await request(app.getHttpServer())
      .get('/auth/google')
      .expect(503);

    expect(JSON.stringify(response.body)).not.toContain(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    expect(JSON.stringify(response.body)).not.toContain(
      VALID_ENV.GOOGLE_OAUTH_CLIENT_ID,
    );
  });

  it('/auth/google (GET) redireciona para o Google com cookie de state', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/google')
      .expect(302);

    expect(response.headers.location).toContain('accounts.google.com');
    expect(response.headers.location).toContain(
      'scope=openid%20email%20profile',
    );
    expect(response.headers['set-cookie']?.[0]).toContain(
      'notifyfin_google_oauth_state=',
    );
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
  });

  afterEach(async () => {
    process.env = originalEnv;
    await app.close();
  });
});
