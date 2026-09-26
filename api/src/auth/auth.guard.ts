import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { parseCookies } from './cookie.utils';
import type { RequestWithTitular } from './auth.types';

@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTitular>();
    const token =
      this.extractBearerToken(request) ?? this.extractCookieToken(request);

    if (!token) {
      throw new UnauthorizedException('Não autenticado.');
    }

    request.titular = this.authService.verifyApplicationToken(token);
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }

    return token;
  }

  private extractCookieToken(request: Request): string | undefined {
    const cookies = parseCookies(request.headers.cookie);
    return cookies[this.authService.getSessionCookieName()];
  }
}
