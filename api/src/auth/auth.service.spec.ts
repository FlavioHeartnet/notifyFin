import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import { AuthService } from './auth.service';
import {
  GOOGLE_OAUTH_CLIENT_FACTORY,
  GoogleOAuthClient,
  GoogleOAuthClientFactory,
} from './google-oauth.provider';

const VALID_ENV = {
  GOOGLE_OAUTH_CLIENT_ID: 'google-client-id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'google-client-secret',
  GOOGLE_OAUTH_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
  APP_AUTH_TOKEN_SECRET: '0123456789abcdef0123456789abcdef',
  APP_AUTH_COOKIE_NAME: 'notifyfin_auth',
  APP_AUTH_COOKIE_SECURE: 'false',
  APP_AUTH_TOKEN_TTL_SECONDS: '3600',
};

describe('AuthService', () => {
  let service: AuthService;
  let googleClient: jest.Mocked<GoogleOAuthClient>;
  let googleFactory: jest.Mocked<GoogleOAuthClientFactory>;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv, ...VALID_ENV };
    googleClient = {
      generateAuthUrl: jest.fn((options) => {
        return `https://accounts.google.com/o/oauth2/v2/auth?state=${options.state}&scope=${options.scope.join(
          '%20',
        )}`;
      }),
      getToken: jest.fn(),
      verifyIdToken: jest.fn(),
    };
    googleFactory = {
      create: jest.fn(() => googleClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: GOOGLE_OAUTH_CLIENT_FACTORY,
          useValue: googleFactory,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('gera URL de login Google com state e escopos esperados', () => {
    const result = service.startGoogleLogin();

    expect(result.state).toHaveLength(43);
    expect(result.redirectUrl).toContain(`state=${result.state}`);
    expect(googleFactory.create.mock.calls[0]).toEqual([
      VALID_ENV.GOOGLE_OAUTH_CLIENT_ID,
      VALID_ENV.GOOGLE_OAUTH_CLIENT_SECRET,
      VALID_ENV.GOOGLE_OAUTH_CALLBACK_URL,
    ]);
    expect(googleClient.generateAuthUrl.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        scope: ['openid', 'email', 'profile'],
        state: result.state,
      }),
    );
  });

  it('falha de forma sanitizada quando a configuração está ausente', () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    expect(() => service.startGoogleLogin()).toThrow(
      ServiceUnavailableException,
    );

    try {
      service.startGoogleLogin();
    } catch (error) {
      expect(String(error)).not.toContain('GOOGLE_OAUTH_CLIENT_SECRET');
      expect(String(error)).not.toContain(VALID_ENV.GOOGLE_OAUTH_CLIENT_ID);
    }
  });

  it('valida callback, perfil Google e emite token da aplicação', async () => {
    googleClient.getToken.mockResolvedValue({
      tokens: { id_token: 'google-id-token' },
    });
    googleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: '123',
        email: 'titular@example.com',
        email_verified: true,
        name: 'Titular',
        picture: 'https://example.com/avatar.png',
      }),
    });

    const result = await service.completeGoogleLogin({
      code: 'oauth-code',
      state: 'state',
      expectedState: 'state',
    });

    expect(googleClient.getToken.mock.calls[0]).toEqual(['oauth-code']);
    expect(googleClient.verifyIdToken.mock.calls[0]).toEqual([
      {
        idToken: 'google-id-token',
        audience: VALID_ENV.GOOGLE_OAUTH_CLIENT_ID,
      },
    ]);
    expect(result.titular).toEqual({
      id: 'google:123',
      email: 'titular@example.com',
      name: 'Titular',
      picture: 'https://example.com/avatar.png',
    });
    expect(service.verifyApplicationToken(result.token)).toEqual(
      result.titular,
    );
  });

  it('rejeita callback sem code ou com state divergente', async () => {
    await expect(
      service.completeGoogleLogin({ state: 'state', expectedState: 'state' }),
    ).rejects.toThrow('Falha na autenticação.');

    await expect(
      service.completeGoogleLogin({
        code: 'oauth-code',
        state: 'state',
        expectedState: 'other-state',
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(googleClient.getToken.mock.calls).toHaveLength(0);
  });

  it('rejeita falha do Google, token ausente e perfil inválido', async () => {
    googleClient.getToken.mockRejectedValueOnce(new Error('upstream failed'));

    await expect(
      service.completeGoogleLogin({
        code: 'oauth-code',
        state: 'state',
        expectedState: 'state',
      }),
    ).rejects.toThrow(UnauthorizedException);

    googleClient.getToken.mockResolvedValueOnce({ tokens: {} });

    await expect(
      service.completeGoogleLogin({
        code: 'oauth-code',
        state: 'state',
        expectedState: 'state',
      }),
    ).rejects.toThrow(UnauthorizedException);

    googleClient.getToken.mockResolvedValueOnce({
      tokens: { id_token: 'google-id-token' },
    });
    googleClient.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: '123',
        email: 'titular@example.com',
        email_verified: false,
      }),
    });

    await expect(
      service.completeGoogleLogin({
        code: 'oauth-code',
        state: 'state',
        expectedState: 'state',
      }),
    ).rejects.toThrow(UnauthorizedException);

    googleClient.getToken.mockResolvedValueOnce({
      tokens: { id_token: 'google-id-token' },
    });
    googleClient.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: 'titular@example.com',
        email_verified: true,
      }),
    });

    await expect(
      service.completeGoogleLogin({
        code: 'oauth-code',
        state: 'state',
        expectedState: 'state',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('verifica token válido e rejeita token inválido ou expirado', () => {
    const validToken = sign(
      { titular: { id: 'google:123', email: 'titular@example.com' } },
      VALID_ENV.APP_AUTH_TOKEN_SECRET,
      {
        subject: 'google:123',
        expiresIn: 60,
        issuer: 'notifyfin-api',
        audience: 'notifyfin-app',
      },
    );
    const expiredToken = sign(
      { titular: { id: 'google:123', email: 'titular@example.com' } },
      VALID_ENV.APP_AUTH_TOKEN_SECRET,
      {
        subject: 'google:123',
        expiresIn: -1,
        issuer: 'notifyfin-api',
        audience: 'notifyfin-app',
      },
    );

    expect(service.verifyApplicationToken(validToken)).toEqual({
      id: 'google:123',
      email: 'titular@example.com',
    });
    expect(() => service.verifyApplicationToken('invalid-token')).toThrow(
      UnauthorizedException,
    );
    expect(() => service.verifyApplicationToken(expiredToken)).toThrow(
      UnauthorizedException,
    );
  });
});
