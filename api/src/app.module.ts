import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './platform/health/health.controller';
import { HttpSurfaceGuard } from './platform/http/http-surface.guard';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpSurfaceGuard,
    },
  ],
})
export class AppModule {}
