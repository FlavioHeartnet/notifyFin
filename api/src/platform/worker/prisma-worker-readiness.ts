import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_TRANSACTIONS } from '../database/database-transactions';
import type { DatabaseTransactions } from '../database/database-transactions';
import type { WorkerReadiness } from './worker-readiness';

@Injectable()
export class PrismaWorkerReadiness implements WorkerReadiness {
  constructor(
    @Inject(DATABASE_TRANSACTIONS)
    private readonly database: DatabaseTransactions,
  ) {}

  async check(): Promise<void> {
    const ready = await this.database.run((transaction) =>
      transaction.query<{ ready: number }>(
        `SELECT 1 AS ready
         FROM "worker_lease"
         WHERE "stopped_at" IS NULL
           AND "heartbeat_at" >= clock_timestamp() - interval '15 seconds'
         LIMIT 1`,
      ),
    );
    if (ready.length === 0) {
      throw new Error('No worker has a fresh lease');
    }
  }
}
