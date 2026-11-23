export interface WorkerReadiness {
  check(): Promise<void>;
}

export const WORKER_READINESS = Symbol('WORKER_READINESS');
