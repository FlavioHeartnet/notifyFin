import { Test } from '@nestjs/testing';
import {
  RUNTIME_CONFIG,
  RuntimeConfig,
} from '../src/platform/config/runtime-config';
import { bootstrapWorker } from '../src/worker';
import { WorkerModule } from '../src/worker.module';

describe('Worker process (e2e)', () => {
  it('starts against the migrated queue and shuts down through Nest lifecycle', async () => {
    const worker = await bootstrapWorker();

    await expect(worker.close()).resolves.toBeUndefined();
  });

  it('refuses to start without a migrated pg-boss schema', async () => {
    const runtimeConfig: RuntimeConfig = {
      environment: 'test',
      port: 3000,
      administrativeHostname: 'admin.notifyfin.test',
      publicHostname: 'public.notifyfin.test',
      databaseUrl:
        'postgresql://notifyfin:notifyfin_test@127.0.0.1:55432/notifyfin_queue_unmigrated',
    };
    const worker = await Test.createTestingModule({ imports: [WorkerModule] })
      .overrideProvider(RUNTIME_CONFIG)
      .useValue(runtimeConfig)
      .compile();

    await expect(worker.init()).rejects.toThrow();
  });
});
