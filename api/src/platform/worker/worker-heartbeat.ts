import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DATABASE_TRANSACTIONS } from '../database/database-transactions';
import type { DatabaseTransactions } from '../database/database-transactions';
import { QUEUE_READINESS } from '../queue/queue-readiness';
import type { QueueReadiness } from '../queue/queue-readiness';

@Injectable()
export class WorkerHeartbeat implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerHeartbeat.name);
  private readonly instanceId = randomUUID();
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    @Inject(DATABASE_TRANSACTIONS)
    private readonly database: DatabaseTransactions,
    @Inject(QUEUE_READINESS)
    private readonly queue: QueueReadiness,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.check();
    await this.database.run((transaction) =>
      transaction.execute(
        `INSERT INTO "worker_lease" ("instance_id", "started_at", "heartbeat_at")
         VALUES ($1, clock_timestamp(), clock_timestamp())`,
        [this.instanceId],
      ),
    );
    this.scheduleHeartbeat();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    await this.database
      .run((transaction) =>
        transaction.execute(
          `UPDATE "worker_lease"
           SET "stopped_at" = clock_timestamp(), "heartbeat_at" = clock_timestamp()
           WHERE "instance_id" = $1`,
          [this.instanceId],
        ),
      )
      .catch(() => undefined);
  }

  private scheduleHeartbeat(): void {
    this.timer = setTimeout(() => void this.heartbeat(), 5_000);
    this.timer.unref();
  }

  private async heartbeat(): Promise<void> {
    if (this.stopped) return;
    try {
      await this.queue.check();
      await this.database.run((transaction) =>
        transaction.execute(
          `UPDATE "worker_lease"
           SET "heartbeat_at" = clock_timestamp()
           WHERE "instance_id" = $1 AND "stopped_at" IS NULL`,
          [this.instanceId],
        ),
      );
    } catch {
      this.logger.error('Worker heartbeat failed');
    } finally {
      if (!this.stopped) this.scheduleHeartbeat();
    }
  }
}
