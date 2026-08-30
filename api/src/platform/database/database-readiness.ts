export interface DatabaseReadiness {
  check(): Promise<void>;
}

export const DATABASE_READINESS = Symbol('DATABASE_READINESS');
