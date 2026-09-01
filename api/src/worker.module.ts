import { Module } from '@nestjs/common';
import { RuntimeConfigModule } from './platform/config/runtime-config.module';
import { QueueModule } from './platform/queue/queue.module';

@Module({
  imports: [RuntimeConfigModule, QueueModule.forProcess('worker')],
})
export class WorkerModule {}
