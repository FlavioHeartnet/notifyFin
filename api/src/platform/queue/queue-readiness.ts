export interface QueueReadiness {
  check(): Promise<void>;
}

export const QUEUE_READINESS = Symbol('QUEUE_READINESS');
