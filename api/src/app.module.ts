import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RuntimeConfigModule } from './platform/config/runtime-config.module';
import { DatabaseModule } from './platform/database/database.module';
import { HealthController } from './platform/health/health.controller';
import { HttpSurfaceGuard } from './platform/http/http-surface.guard';
import { QueueModule } from './platform/queue/queue.module';
import { WorkerReadinessModule } from './platform/worker/worker-readiness.module';

@Module({
  imports: [
    RuntimeConfigModule,
    DatabaseModule,
    QueueModule.forProcess('api'),
    WorkerReadinessModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpSurfaceGuard,
    },
  ],
})
export class AppModule {}
