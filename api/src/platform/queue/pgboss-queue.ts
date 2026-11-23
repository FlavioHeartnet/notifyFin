import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { fromPrisma, PgBoss } from 'pg-boss';
import { RUNTIME_CONFIG } from '../config/runtime-config';
import type { RuntimeConfig } from '../config/runtime-config';
import { DATABASE_TRANSACTIONS } from '../database/database-transactions';
import type {
  DatabaseTransaction,
  DatabaseTransactions,
} from '../database/database-transactions';
import type {
  DurableJobDefinition,
  DurableJobHandler,
  DurableJobQueue,
} from './durable-job';
import type { QueueReadiness } from './queue-readiness';
import { QUEUE_RUNTIME_OPTIONS } from './queue-runtime-options';
import type { QueueRuntimeOptions } from './queue-runtime-options';

interface PersistedEnvelope {
  readonly dispatchId: string;
  readonly idempotencyKey: string;
  readonly payload: object;
}

@Injectable()
export class PgBossQueue
  implements DurableJobQueue, QueueReadiness, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PgBossQueue.name);
  private activeBoss?: PgBoss;
  private starting?: Promise<PgBoss>;

  constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(QUEUE_RUNTIME_OPTIONS)
    private readonly options: QueueRuntimeOptions,
    @Inject(DATABASE_TRANSACTIONS)
    private readonly database: DatabaseTransactions,
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

  async configureQueue(definition: DurableJobDefinition): Promise<void> {
    const boss = await this.ensureStarted();
    const deadLetterOptions = {
      retryLimit: 0,
      retentionSeconds: 2_592_000,
      deleteAfterSeconds: 2_592_000,
    } as const;
    await boss.createQueue(definition.deadLetter, deadLetterOptions);
    await boss.updateQueue(definition.deadLetter, deadLetterOptions);

    const queueOptions = {
      retryLimit: definition.retryLimit,
      retryDelay: definition.retryDelay,
      retryBackoff: definition.retryBackoff,
      heartbeatSeconds: definition.heartbeatSeconds,
      deadLetter: definition.deadLetter,
      retentionSeconds: 2_592_000,
      deleteAfterSeconds: 2_592_000,
    } as const;
    await boss.createQueue(definition.name, queueOptions);
    await boss.updateQueue(definition.name, queueOptions);
  }

  async registerWorker<T extends object>(
    definition: DurableJobDefinition,
    handler: DurableJobHandler<T>,
  ): Promise<void> {
    if (this.options.role !== 'worker') {
      throw new Error(
        'Job handlers can only be registered by the worker process',
      );
    }

    await this.configureQueue(definition);
    const boss = await this.ensureStarted();
    await boss.work<PersistedEnvelope>(
      definition.name,
      { pollingIntervalSeconds: 0.5 },
      async ([job]) => {
        try {
          await this.database.run(async (transaction) => {
            const dispatches = await transaction.query<{
              completed_at: Date | null;
            }>(
              'SELECT "completed_at" FROM "job_dispatch" WHERE "id" = $1 FOR UPDATE',
              [job.data.dispatchId],
            );
            const dispatch = dispatches[0];
            if (!dispatch) {
              throw new Error('Job dispatch is missing');
            }
            if (dispatch.completed_at) {
              return;
            }

            await handler(
              {
                idempotencyKey: job.data.idempotencyKey,
                payload: job.data.payload as T,
              },
              transaction,
            );
            await transaction.execute(
              `UPDATE "job_dispatch"
               SET "completed_at" = clock_timestamp(),
                   "attempt_count" = "attempt_count" + 1,
                   "result_code" = 'completed',
                   "failure_code" = NULL
               WHERE "id" = $1`,
              [job.data.dispatchId],
            );
          });
        } catch {
          await this.database
            .run((transaction) =>
              transaction.execute(
                `UPDATE "job_dispatch"
                 SET "attempt_count" = "attempt_count" + 1,
                     "failure_code" = 'handler_failed'
                 WHERE "id" = $1 AND "completed_at" IS NULL`,
                [job.data.dispatchId],
              ),
            )
            .catch(() => undefined);
          throw new Error('Job handler failed');
        }
      },
    );
  }

  async enqueue<T extends object>(
    transaction: DatabaseTransaction,
    queueName: string,
    idempotencyKey: string,
    payload: T,
  ): Promise<string> {
    const dispatchId = randomUUID();
    const jobId = randomUUID();
    const payloadHash = fingerprint(payload);
    const inserted = await transaction.query<{ id: string; job_id: string }>(
      `INSERT INTO "job_dispatch" ("id", "queue_name", "idempotency_key", "payload_hash", "job_id")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("queue_name", "idempotency_key") DO NOTHING
       RETURNING "id", "job_id"`,
      [dispatchId, queueName, idempotencyKey, payloadHash, jobId],
    );

    if (inserted.length === 0) {
      const existing = await transaction.query<{
        job_id: string;
        payload_hash: string;
      }>(
        'SELECT "job_id", "payload_hash" FROM "job_dispatch" WHERE "queue_name" = $1 AND "idempotency_key" = $2',
        [queueName, idempotencyKey],
      );
      if (!existing[0]) {
        throw new Error('Job dispatch could not be resolved');
      }
      if (existing[0].payload_hash.trim() !== payloadHash) {
        throw new Error('Idempotency key was reused with a different payload');
      }
      return existing[0].job_id;
    }

    const boss = await this.ensureStarted();
    const sentJobId = await boss.send(
      queueName,
      { dispatchId, idempotencyKey, payload },
      { id: jobId, db: fromPrisma(transaction.native) },
    );
    if (!sentJobId) {
      throw new Error('Job was not accepted by the queue');
    }
    return sentJobId;
  }

  async findDispatch(queueName: string, idempotencyKey: string) {
    return this.database.run(async (transaction) => {
      const rows = await transaction.query<{
        id: string;
        job_id: string;
        payload_hash: string;
        attempt_count: number;
        result_code: string | null;
        failure_code: string | null;
        completed_at: Date | null;
      }>(
        `SELECT "id", "job_id", "payload_hash", "attempt_count",
                "result_code", "failure_code", "completed_at"
         FROM "job_dispatch"
         WHERE "queue_name" = $1 AND "idempotency_key" = $2`,
        [queueName, idempotencyKey],
      );
      return rows[0] ?? null;
    });
  }

  async replay<T extends object>(
    queueName: string,
    idempotencyKey: string,
    payload: T,
  ): Promise<string> {
    const dispatch = await this.findDispatch(queueName, idempotencyKey);
    if (!dispatch) {
      throw new Error('Job dispatch was not found');
    }
    if (dispatch.payload_hash.trim() !== fingerprint(payload)) {
      throw new Error(
        'Job replay payload does not match the original dispatch',
      );
    }
    const jobId = await (
      await this.ensureStarted()
    ).send(queueName, {
      dispatchId: dispatch.id,
      idempotencyKey,
      payload,
    });
    if (!jobId) throw new Error('Job replay was not accepted');
    return jobId;
  }

  async deadLetterCount(
    deadLetter: string,
    sourceName: string,
  ): Promise<number> {
    const jobs = await (
      await this.ensureStarted()
    ).findJobs(deadLetter, { queued: true });
    return jobs.filter((job) => job.sourceName === sourceName).length;
  }

  async redrive(deadLetter: string, sourceName: string): Promise<number> {
    return (await this.ensureStarted()).redrive(deadLetter, { sourceName });
  }

  async onModuleDestroy(): Promise<void> {
    const boss =
      this.activeBoss ?? (await this.starting?.catch(() => undefined));
    if (!boss) return;

    await boss.stop({ graceful: true, timeout: 10_000 });
    this.activeBoss = undefined;
  }

  private ensureStarted(): Promise<PgBoss> {
    if (this.activeBoss) return Promise.resolve(this.activeBoss);
    if (this.starting) return this.starting;

    const boss = new PgBoss({
      connectionString: this.config.databaseUrl,
      connectionTimeoutMillis: 3_000,
      application_name: `notifyfin-${this.options.role}`,
      createSchema: false,
      migrate: false,
      schedule: this.options.role === 'worker',
      supervise: this.options.role === 'worker',
    });
    boss.on('error', () => this.logger.error('Queue runtime error'));

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

function fingerprint(payload: object): string {
  const serialized = JSON.stringify(payload);
  if (serialized === undefined) {
    throw new Error('Job payload must be JSON serializable');
  }
  return createHash('sha256')
    .update(canonicalJson(JSON.parse(serialized) as unknown))
    .digest('hex');
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error('Job payload must contain only JSON values');
  }
  return serialized;
}
