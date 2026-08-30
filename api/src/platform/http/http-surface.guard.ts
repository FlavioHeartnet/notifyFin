import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RUNTIME_CONFIG } from '../config/runtime-config';
import type { RuntimeConfig } from '../config/runtime-config';
import { HttpRoutePolicy } from './http-route-policy';

@Injectable()
export class HttpSurfaceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

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
    return surface === 'administrative'
      ? this.config.administrativeHostname
      : this.config.publicHostname;
  }

  private normalizeHostname(authority: string | undefined) {
    const match = authority?.trim().match(/^([^:]+)(?::([0-9]{1,5}))?$/);

    if (!match) {
      return undefined;
    }

    const port = match[2] === undefined ? undefined : Number(match[2]);
    if (port !== undefined && (port < 1 || port > 65535)) {
      return undefined;
    }

    return match[1].toLowerCase();
  }
}
