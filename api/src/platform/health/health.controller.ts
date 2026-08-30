import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DATABASE_READINESS } from '../database/database-readiness';
import type { DatabaseReadiness } from '../database/database-readiness';
import { HttpRoutePolicy } from '../http/http-route-policy';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_READINESS)
    private readonly databaseReadiness: DatabaseReadiness,
  ) {}

  @Get('live')
  @HttpRoutePolicy({
    surface: 'administrative',
    authentication: 'anonymous',
  })
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HttpRoutePolicy({
    surface: 'administrative',
    authentication: 'anonymous',
  })
  async readiness() {
    try {
      await this.databaseReadiness.check();
      return { status: 'ok', checks: { database: 'up' } };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { database: 'down' },
      });
    }
  }
}
