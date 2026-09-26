import { Controller, Get, Headers, Query, Res } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { parseCookies } from './cookie.utils';

const OAUTH_STATE_COOKIE_NAME = 'notifyfin_google_oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_STATE_CALLBACK_PATH = '/auth/google/callback';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  startGoogleLogin(@Res() response: Response): void {
    const login = this.authService.startGoogleLogin();

    response.cookie(OAUTH_STATE_COOKIE_NAME, login.state, {
      ...this.stateCookieOptions(login.cookieSecure),
      maxAge: OAUTH_STATE_TTL_MS,
    });
    response.redirect(login.redirectUrl);
  }

  @Get('google/callback')
  async completeGoogleLogin(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = parseCookies(cookieHeader);
    const result = await this.authService.completeGoogleLogin({
      code,
      state,
      error,
      expectedState: cookies[OAUTH_STATE_COOKIE_NAME],
    });

    response.clearCookie(
      OAUTH_STATE_COOKIE_NAME,
      this.stateCookieOptions(result.cookieSecure),
    );
    response.cookie(result.cookieName, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: result.cookieSecure,
      maxAge: result.tokenTtlSeconds * 1000,
      path: '/',
    });

    return { titular: result.titular };
  }

  private stateCookieOptions(secure: boolean): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: OAUTH_STATE_CALLBACK_PATH,
    };
  }
}
