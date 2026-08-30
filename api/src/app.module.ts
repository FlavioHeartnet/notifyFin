import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RuntimeConfigModule } from './platform/config/runtime-config.module';
import { HealthController } from './platform/health/health.controller';
import { HttpSurfaceGuard } from './platform/http/http-surface.guard';

@Module({
  imports: [RuntimeConfigModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpSurfaceGuard,
    },
  ],
})
export class AppModule {}
