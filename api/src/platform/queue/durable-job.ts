import type { DatabaseTransaction } from '../database/database-transactions';

export interface DurableJobDefinition {
  readonly name: string;
  readonly deadLetter: string;
  readonly retryLimit: number;
  readonly retryDelay: number;
  readonly retryBackoff: boolean;
  readonly heartbeatSeconds: number;
}

export interface DurableJob<T extends object = object> {
  readonly idempotencyKey: string;
  readonly payload: T;
}

export type DurableJobHandler<T extends object = object> = (
  job: DurableJob<T>,
  transaction: DatabaseTransaction,
) => Promise<void>;

export interface DurableJobQueue {
  configureQueue(definition: DurableJobDefinition): Promise<void>;
  registerWorker<T extends object>(
    definition: DurableJobDefinition,
    handler: DurableJobHandler<T>,
  ): Promise<void>;
  enqueue<T extends object>(
    transaction: DatabaseTransaction,
    queueName: string,
    idempotencyKey: string,
    payload: T,
  ): Promise<string>;
  findDispatch(
    queueName: string,
    idempotencyKey: string,
  ): Promise<{
    id: string;
    job_id: string;
    payload_hash: string;
    attempt_count: number;
    result_code: string | null;
    failure_code: string | null;
    completed_at: Date | null;
  } | null>;
  replay<T extends object>(
    queueName: string,
    idempotencyKey: string,
    payload: T,
  ): Promise<string>;
  deadLetterCount(deadLetter: string, sourceName: string): Promise<number>;
  redrive(deadLetter: string, sourceName: string): Promise<number>;
}

export const DURABLE_JOB_QUEUE = Symbol('DURABLE_JOB_QUEUE');
