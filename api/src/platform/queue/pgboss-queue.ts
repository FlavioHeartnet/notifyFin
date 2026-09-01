import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PgBoss } from 'pg-boss';
import { RUNTIME_CONFIG } from '../config/runtime-config';
import type { RuntimeConfig } from '../config/runtime-config';
import type { QueueReadiness } from './queue-readiness';
import { QUEUE_RUNTIME_OPTIONS } from './queue-runtime-options';
import type { QueueRuntimeOptions } from './queue-runtime-options';

@Injectable()
export class PgBossQueue
  implements QueueReadiness, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PgBossQueue.name);
  private activeBoss?: PgBoss;
  private starting?: Promise<PgBoss>;

  constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(QUEUE_RUNTIME_OPTIONS)
    private readonly options: QueueRuntimeOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.options.requiredOnStartup) {
      await this.ensureStarted();
      return;
    }

    await this.ensureStarted().catch(() => undefined);
  }

  async check(): Promise<void> {
    const boss = await this.ensureStarted();
    const schemaVersion = await boss.schemaVersion();

    if (schemaVersion === null) {
      throw new Error('Queue schema is not installed');
    }
  }

  async onModuleDestroy(): Promise<void> {
    const boss =
      this.activeBoss ?? (await this.starting?.catch(() => undefined));
    if (!boss) {
      return;
    }

    await boss.stop({ graceful: true, timeout: 10_000 });
    this.activeBoss = undefined;
  }

  private ensureStarted(): Promise<PgBoss> {
    if (this.activeBoss) {
      return Promise.resolve(this.activeBoss);
    }

    if (this.starting) {
      return this.starting;
    }

    const boss = new PgBoss({
      connectionString: this.config.databaseUrl,
      connectionTimeoutMillis: 3_000,
      application_name: `notifyfin-${this.options.role}`,
      createSchema: false,
      migrate: false,
      schedule: this.options.role === 'worker',
      supervise: this.options.role === 'worker',
    });
    boss.on('error', () => {
      this.logger.error('Queue runtime error');
    });

    this.starting = boss
      .start()
      .then(() => {
        this.activeBoss = boss;
        return boss;
      })
      .catch(async (error: unknown) => {
        await boss
          .stop({ close: true, graceful: false, timeout: 1_000 })
          .catch(() => undefined);
        throw error;
      })
      .finally(() => {
        this.starting = undefined;
      });

    return this.starting;
  }
}
