import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { HttpRoutePolicy } from './http-route-policy';

@Injectable()
export class HttpSurfaceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride(HttpRoutePolicy, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!policy) {
      throw new ForbiddenException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const requestHostname = this.normalizeHostname(request.headers.host);
    const configuredHostname = this.configuredHostnameFor(policy.surface);

    if (!configuredHostname || requestHostname !== configuredHostname) {
      throw new NotFoundException();
    }

    return true;
  }

  private configuredHostnameFor(surface: 'administrative' | 'public') {
    const value =
      surface === 'administrative'
        ? process.env.ADMIN_HOSTNAME
        : process.env.PUBLIC_HOSTNAME;

    return value?.trim().toLowerCase();
  }

  private normalizeHostname(host: string | undefined) {
    return host?.split(':', 1)[0]?.trim().toLowerCase();
  }
}
