import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { RUNTIME_CONFIG } from '../config/runtime-config';
import type { RuntimeConfig } from '../config/runtime-config';
import type { DatabaseReadiness } from './database-readiness';
import type {
  DatabaseTransaction,
  DatabaseTransactions,
} from './database-transactions';

@Injectable()
export class PrismaDatabase
  extends PrismaClient
  implements DatabaseReadiness, DatabaseTransactions, OnModuleDestroy
{
  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    super({
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 3_000,
      }),
    });
  }

  async run<T>(
    operation: (transaction: DatabaseTransaction) => Promise<T>,
  ): Promise<T> {
    return this.$transaction((prismaTransaction) =>
      operation({
        execute: async (statement, values = []) =>
          prismaTransaction.$executeRawUnsafe(statement, ...values),
        query: async <Row>(
          statement: string,
          values: readonly unknown[] = [],
        ) => prismaTransaction.$queryRawUnsafe<Row[]>(statement, ...values),
        native: prismaTransaction,
      }),
    );
  }

  async check(): Promise<void> {
    const migrations = await this.$queryRawUnsafe<Array<{ ready: number }>>(
      'SELECT 1 AS "ready" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL LIMIT 1',
    );

    if (migrations.length === 0) {
      throw new Error('Database migrations are not applied');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
