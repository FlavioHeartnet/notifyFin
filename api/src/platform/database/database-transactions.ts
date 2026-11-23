export interface DatabaseTransaction {
  execute(statement: string, values?: readonly unknown[]): Promise<number>;
  query<T>(statement: string, values?: readonly unknown[]): Promise<T[]>;
  readonly native: {
    $queryRawUnsafe<T = unknown>(
      query: string,
      ...values: unknown[]
    ): Promise<T>;
  };
}

export interface DatabaseTransactions {
  run<T>(
    operation: (transaction: DatabaseTransaction) => Promise<T>,
  ): Promise<T>;
}

export const DATABASE_TRANSACTIONS = Symbol('DATABASE_TRANSACTIONS');
