import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DATABASE_READINESS } from '../database/database-readiness';
import type { DatabaseReadiness } from '../database/database-readiness';
import { HttpRoutePolicy } from '../http/http-route-policy';
import { QUEUE_READINESS } from '../queue/queue-readiness';
import type { QueueReadiness } from '../queue/queue-readiness';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_READINESS)
    private readonly databaseReadiness: DatabaseReadiness,
    @Inject(QUEUE_READINESS)
    private readonly queueReadiness: QueueReadiness,
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
    const [database, queue] = await Promise.allSettled([
      this.databaseReadiness.check(),
      this.queueReadiness.check(),
    ]);
    const checks = {
      database: database.status === 'fulfilled' ? 'up' : 'down',
      queue: queue.status === 'fulfilled' ? 'up' : 'down',
    } as const;

    if (database.status === 'rejected' || queue.status === 'rejected') {
      throw new ServiceUnavailableException({ status: 'error', checks });
    }

    return { status: 'ok', checks };
  }
}
