import { Controller, Get } from '@nestjs/common';
import { HttpRoutePolicy } from '../http/http-route-policy';

@Controller('health')
export class HealthController {
  @Get('live')
  @HttpRoutePolicy({
    surface: 'administrative',
    authentication: 'anonymous',
  })
  liveness() {
    return { status: 'ok' };
  }
}
