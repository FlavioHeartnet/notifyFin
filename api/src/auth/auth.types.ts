import type { Request } from 'express';

export interface Titular {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthSessionConfig {
  tokenSecret: string;
  cookieName: string;
  cookieSecure: boolean;
  tokenTtlSeconds: number;
}

export interface AuthConfig extends AuthSessionConfig {
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
}

export interface LoginStartResult {
  redirectUrl: string;
  state: string;
  cookieSecure: boolean;
}

export interface LoginCallbackResult {
  titular: Titular;
  token: string;
  cookieName: string;
  cookieSecure: boolean;
  tokenTtlSeconds: number;
}

export interface RequestWithTitular extends Request {
  titular?: Titular;
}
