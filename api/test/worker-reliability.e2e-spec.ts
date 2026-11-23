import { INestApplicationContext } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DATABASE_TRANSACTIONS } from '../src/platform/database/database-transactions';
import type { DatabaseTransactions } from '../src/platform/database/database-transactions';
import {
  DURABLE_JOB_QUEUE,
  DurableJobQueue,
} from '../src/platform/queue/durable-job';
import { bootstrapWorker } from '../src/worker';

describe('Worker reliability (e2e)', () => {
  let worker: INestApplicationContext;
  let queue: DurableJobQueue;
  let database: DatabaseTransactions;
  const suffix = randomUUID();
  const queueName = `foundation-reliability-${suffix}`;
  const transactionalQueueName = `${queueName}-transactional`;
  const deadLetterName = `${queueName}-dead-letter`;
  const effectTable = `foundation_effect_${suffix.replaceAll('-', '')}`;

  beforeAll(async () => {
    worker = await bootstrapWorker();
    queue = worker.get(DURABLE_JOB_QUEUE);
    database = worker.get(DATABASE_TRANSACTIONS);
    await database.run((tx) =>
      tx.execute(
        `CREATE TABLE "${effectTable}" (id text PRIMARY KEY, executions integer NOT NULL DEFAULT 0)`,
      ),
    );
    await queue.configureQueue({
      name: transactionalQueueName,
      deadLetter: deadLetterName,
      retryLimit: 2,
      retryDelay: 1,
      retryBackoff: false,
      heartbeatSeconds: 10,
    });
  });

  afterAll(async () => {
    if (database) {
      await database.run((tx) =>
        tx.execute(`DROP TABLE IF EXISTS "${effectTable}"`),
      );
    }
    await worker?.close();
  });

  it('commits a business change and its job together and deduplicates the command', async () => {
    const rolledBackKey = randomUUID();

    await expect(
      database.run(async (tx) => {
        await tx.execute(`INSERT INTO "${effectTable}" (id) VALUES ($1)`, [
          rolledBackKey,
        ]);
        await queue.enqueue(tx, transactionalQueueName, rolledBackKey, {
          operation: 'rollback',
        });
        throw new Error('rollback requested by test');
      }),
    ).rejects.toThrow('rollback requested by test');

    await expect(countEffects(rolledBackKey)).resolves.toBe(0);
    await expect(
      queue.findDispatch(transactionalQueueName, rolledBackKey),
    ).resolves.toBeNull();

    const committedKey = randomUUID();
    const firstJobId = await database.run(async (tx) => {
      await tx.execute(`INSERT INTO "${effectTable}" (id) VALUES ($1)`, [
        committedKey,
      ]);
      return queue.enqueue(tx, transactionalQueueName, committedKey, {
        operation: 'commit',
      });
    });
    const repeatedJobId = await database.run((tx) =>
      queue.enqueue(tx, transactionalQueueName, committedKey, {
        operation: 'commit',
      }),
    );

    expect(repeatedJobId).toBe(firstJobId);
    await expect(
      database.run((tx) =>
        queue.enqueue(tx, transactionalQueueName, committedKey, {
          operation: 'conflicting-command',
        }),
      ),
    ).rejects.toThrow('Idempotency key was reused with a different payload');
    await expect(countEffects(committedKey)).resolves.toBe(1);

    const datedKey = randomUUID();
    await database.run((tx) =>
      queue.enqueue(tx, transactionalQueueName, datedKey, {
        at: new Date('2026-09-01T10:00:00.000Z'),
      }),
    );
    await expect(
      database.run((tx) =>
        queue.enqueue(tx, transactionalQueueName, datedKey, {
          at: new Date('2026-09-02T10:00:00.000Z'),
        }),
      ),
    ).rejects.toThrow('Idempotency key was reused with a different payload');
  });

  it('retries transient failures and applies the PostgreSQL effect once', async () => {
    let attempts = 0;
    await queue.registerWorker(
      {
        name: queueName,
        deadLetter: deadLetterName,
        retryLimit: 2,
        retryDelay: 1,
        retryBackoff: false,
        heartbeatSeconds: 10,
      },
      async (job, tx) => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('sensitive transient detail');
        }
        await tx.execute(
          `UPDATE "${effectTable}" SET executions = executions + 1 WHERE id = $1`,
          [job.idempotencyKey],
        );
      },
    );

    const idempotencyKey = randomUUID();
    await database.run(async (tx) => {
      await tx.execute(`INSERT INTO "${effectTable}" (id) VALUES ($1)`, [
        idempotencyKey,
      ]);
      await queue.enqueue(tx, queueName, idempotencyKey, {
        operation: 'retry',
      });
    });

    await waitFor(async () => (await countExecutions(idempotencyKey)) === 1);
    expect(attempts).toBe(2);
    await expect(
      queue.findDispatch(queueName, idempotencyKey),
    ).resolves.toMatchObject({
      attempt_count: 2,
      result_code: 'completed',
      failure_code: null,
    });

    await queue.replay(queueName, idempotencyKey, { operation: 'retry' });
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await expect(countExecutions(idempotencyKey)).resolves.toBe(1);
  });

  it('moves exhausted work to dead-letter and allows an administrative redrive', async () => {
    const failingQueue = `${queueName}-failing`;
    const idempotencyKey = randomUUID();
    await queue.registerWorker(
      {
        name: failingQueue,
        deadLetter: deadLetterName,
        retryLimit: 1,
        retryDelay: 1,
        retryBackoff: false,
        heartbeatSeconds: 10,
      },
      () => Promise.reject(new Error('sensitive permanent detail')),
    );
    await database.run((tx) =>
      queue.enqueue(tx, failingQueue, idempotencyKey, { operation: 'fail' }),
    );

    await waitFor(
      async () =>
        (await queue.deadLetterCount(deadLetterName, failingQueue)) === 1,
    );
    await expect(
      queue.findDispatch(failingQueue, idempotencyKey),
    ).resolves.toMatchObject({
      attempt_count: 2,
      result_code: null,
      failure_code: 'handler_failed',
      completed_at: null,
    });
    await expect(queue.redrive(deadLetterName, failingQueue)).resolves.toBe(1);
  });

  async function countEffects(id: string): Promise<number> {
    return database.run(async (tx) => {
      const rows = await tx.query<{ count: bigint }>(
        `SELECT count(*)::bigint AS count FROM "${effectTable}" WHERE id = $1`,
        [id],
      );
      return Number(rows[0].count);
    });
  }

  async function countExecutions(id: string): Promise<number> {
    return database.run(async (tx) => {
      const rows = await tx.query<{ executions: number }>(
        `SELECT executions FROM "${effectTable}" WHERE id = $1`,
        [id],
      );
      return rows[0]?.executions ?? 0;
    });
  }
});

async function waitFor(assertion: () => Promise<boolean>, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await assertion()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for worker outcome');
}
