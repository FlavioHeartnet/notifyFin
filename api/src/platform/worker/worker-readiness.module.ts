import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PrismaWorkerReadiness } from './prisma-worker-readiness';
import { WORKER_READINESS } from './worker-readiness';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaWorkerReadiness,
    {
      provide: WORKER_READINESS,
      useExisting: PrismaWorkerReadiness,
    },
  ],
  exports: [WORKER_READINESS],
})
export class WorkerReadinessModule {}
