import { DynamicModule, Module } from '@nestjs/common';
import { PgBossQueue } from './pgboss-queue';
import { QUEUE_READINESS } from './queue-readiness';
import {
  QUEUE_RUNTIME_OPTIONS,
  QueueProcessRole,
  QueueRuntimeOptions,
} from './queue-runtime-options';

@Module({})
export class QueueModule {
  static forProcess(role: QueueProcessRole): DynamicModule {
    const options: QueueRuntimeOptions = Object.freeze({
      role,
      requiredOnStartup: role === 'worker',
    });

    return {
      module: QueueModule,
      providers: [
        {
          provide: QUEUE_RUNTIME_OPTIONS,
          useValue: options,
        },
        PgBossQueue,
        {
          provide: QUEUE_READINESS,
          useExisting: PgBossQueue,
        },
      ],
      exports: [QUEUE_READINESS],
    };
  }
}
