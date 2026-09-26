import { OAuth2Client } from 'google-auth-library';
import type { TokenPayload } from 'google-auth-library';

export const GOOGLE_OAUTH_CLIENT_FACTORY = Symbol(
  'GOOGLE_OAUTH_CLIENT_FACTORY',
);

export interface GoogleOAuthTicket {
  getPayload(): TokenPayload | undefined;
}

export interface GoogleOAuthClient {
  generateAuthUrl(options: {
    access_type?: string;
    prompt?: string;
    scope: string[];
    state: string;
  }): string;
  getToken(code: string): Promise<{ tokens: { id_token?: string | null } }>;
  verifyIdToken(options: {
    idToken: string;
    audience: string;
  }): Promise<GoogleOAuthTicket>;
}

export interface GoogleOAuthClientFactory {
  create(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): GoogleOAuthClient;
}

export class DefaultGoogleOAuthClientFactory implements GoogleOAuthClientFactory {
  create(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): GoogleOAuthClient {
    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }
}
