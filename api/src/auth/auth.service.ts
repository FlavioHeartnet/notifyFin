import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { GOOGLE_OAUTH_CLIENT_FACTORY } from './google-oauth.provider';
import type { GoogleOAuthClientFactory } from './google-oauth.provider';
import type {
  AuthConfig,
  AuthSessionConfig,
  LoginCallbackResult,
  LoginStartResult,
  Titular,
} from './auth.types';

const TOKEN_ISSUER = 'notifyfin-api';
const TOKEN_AUDIENCE = 'notifyfin-app';
const DEFAULT_COOKIE_NAME = 'notifyfin_auth';
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const MIN_TOKEN_SECRET_LENGTH = 32;

interface AppTokenPayload extends JwtPayload {
  titular?: Titular;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(GOOGLE_OAUTH_CLIENT_FACTORY)
    private readonly googleClientFactory: GoogleOAuthClientFactory,
  ) {}

  startGoogleLogin(): LoginStartResult {
    const config = this.getConfig();
    const state = randomBytes(32).toString('base64url');
    const client = this.googleClientFactory.create(
      config.googleClientId,
      config.googleClientSecret,
      config.googleCallbackUrl,
    );

    const redirectUrl = client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
    });

    return {
      redirectUrl,
      state,
      cookieSecure: config.cookieSecure,
    };
  }

  async completeGoogleLogin(params: {
    code?: string;
    state?: string;
    expectedState?: string;
    error?: string;
  }): Promise<LoginCallbackResult> {
    const config = this.getConfig();

    if (params.error) {
      throw new BadRequestException('Falha na autenticação.');
    }

    if (!params.code || !params.state) {
      throw new BadRequestException('Falha na autenticação.');
    }

    if (!params.expectedState || params.expectedState !== params.state) {
      throw new UnauthorizedException('Falha na autenticação.');
    }

    const client = this.googleClientFactory.create(
      config.googleClientId,
      config.googleClientSecret,
      config.googleCallbackUrl,
    );

    let idToken: string | null | undefined;
    try {
      const tokenResponse = await client.getToken(params.code);
      idToken = tokenResponse.tokens.id_token;
    } catch {
      throw new UnauthorizedException('Falha na autenticação.');
    }

    if (!idToken) {
      throw new UnauthorizedException('Falha na autenticação.');
    }

    let titular: Titular;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.googleClientId,
      });
      titular = this.titularFromGooglePayload(ticket.getPayload());
    } catch {
      throw new UnauthorizedException('Falha na autenticação.');
    }

    const token = sign(
      {
        titular,
      },
      config.tokenSecret,
      {
        subject: titular.id,
        expiresIn: config.tokenTtlSeconds,
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      },
    );

    return {
      titular,
      token,
      cookieName: config.cookieName,
      cookieSecure: config.cookieSecure,
      tokenTtlSeconds: config.tokenTtlSeconds,
    };
  }

  verifyApplicationToken(token: string): Titular {
    const config = this.getSessionConfig();

    try {
      const payload = verify(token, config.tokenSecret, {
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      }) as AppTokenPayload;

      const titular = this.validateTokenTitular(payload.titular);
      if (payload.sub !== titular.id) {
        throw new UnauthorizedException('Não autenticado.');
      }

      return titular;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new UnauthorizedException('Não autenticado.');
    }
  }

  getSessionCookieName(): string {
    return process.env.APP_AUTH_COOKIE_NAME?.trim() || DEFAULT_COOKIE_NAME;
  }

  private getConfig(): AuthConfig {
    const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
    const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
    const googleCallbackUrl = process.env.GOOGLE_OAUTH_CALLBACK_URL?.trim();

    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      throw new ServiceUnavailableException('Autenticação indisponível.');
    }

    return {
      googleClientId,
      googleClientSecret,
      googleCallbackUrl,
      ...this.getSessionConfig(),
    };
  }

  private getSessionConfig(): AuthSessionConfig {
    const tokenSecret = process.env.APP_AUTH_TOKEN_SECRET?.trim();

    if (!tokenSecret || tokenSecret.length < MIN_TOKEN_SECRET_LENGTH) {
      throw new ServiceUnavailableException('Autenticação indisponível.');
    }

    return {
      tokenSecret,
      cookieName: this.getSessionCookieName(),
      cookieSecure: this.readBooleanEnv('APP_AUTH_COOKIE_SECURE', false),
      tokenTtlSeconds: this.readPositiveIntegerEnv(
        'APP_AUTH_TOKEN_TTL_SECONDS',
        DEFAULT_TOKEN_TTL_SECONDS,
      ),
    };
  }

  private titularFromGooglePayload(payload: unknown): Titular {
    if (!payload || typeof payload !== 'object') {
      throw new UnauthorizedException('Falha na autenticação.');
    }

    const claims = payload as Record<string, unknown>;
    const sub = claims.sub;
    const email = claims.email;
    const emailVerified = claims.email_verified;

    if (
      typeof sub !== 'string' ||
      sub.trim().length === 0 ||
      typeof email !== 'string' ||
      !this.isValidEmail(email) ||
      emailVerified !== true
    ) {
      throw new UnauthorizedException('Falha na autenticação.');
    }

    const titular: Titular = {
      id: `google:${sub}`,
      email,
    };

    if (typeof claims.name === 'string' && claims.name.trim().length > 0) {
      titular.name = claims.name;
    }

    if (
      typeof claims.picture === 'string' &&
      claims.picture.trim().length > 0
    ) {
      titular.picture = claims.picture;
    }

    return titular;
  }

  private validateTokenTitular(titular: unknown): Titular {
    if (!titular || typeof titular !== 'object') {
      throw new UnauthorizedException('Não autenticado.');
    }

    const tokenTitular = titular as Record<string, unknown>;
    if (
      typeof tokenTitular.id !== 'string' ||
      !tokenTitular.id.startsWith('google:') ||
      typeof tokenTitular.email !== 'string' ||
      !this.isValidEmail(tokenTitular.email)
    ) {
      throw new UnauthorizedException('Não autenticado.');
    }

    const currentTitular: Titular = {
      id: tokenTitular.id,
      email: tokenTitular.email,
    };

    if (typeof tokenTitular.name === 'string') {
      currentTitular.name = tokenTitular.name;
    }

    if (typeof tokenTitular.picture === 'string') {
      currentTitular.picture = tokenTitular.picture;
    }

    return currentTitular;
  }

  private isValidEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  private readBooleanEnv(name: string, defaultValue: boolean): boolean {
    const value = process.env[name]?.trim().toLowerCase();
    if (!value) {
      return defaultValue;
    }

    return ['1', 'true', 'yes', 'on'].includes(value);
  }

  private readPositiveIntegerEnv(name: string, defaultValue: number): number {
    const value = process.env[name]?.trim();
    if (!value) {
      return defaultValue;
    }

    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return defaultValue;
    }

    return parsedValue;
  }
}
