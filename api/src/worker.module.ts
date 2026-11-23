import { Module } from '@nestjs/common';
import { RuntimeConfigModule } from './platform/config/runtime-config.module';
import { QueueModule } from './platform/queue/queue.module';
import { WorkerHeartbeat } from './platform/worker/worker-heartbeat';

@Module({
  imports: [RuntimeConfigModule, QueueModule.forProcess('worker')],
  providers: [WorkerHeartbeat],
})
export class WorkerModule {}
