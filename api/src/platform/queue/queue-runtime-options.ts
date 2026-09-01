export type QueueProcessRole = 'api' | 'worker';

export interface QueueRuntimeOptions {
  readonly role: QueueProcessRole;
  readonly requiredOnStartup: boolean;
}

export const QUEUE_RUNTIME_OPTIONS = Symbol('QUEUE_RUNTIME_OPTIONS');
