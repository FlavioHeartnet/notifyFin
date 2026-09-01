import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { RUNTIME_CONFIG } from '../config/runtime-config';
import type { RuntimeConfig } from '../config/runtime-config';
import type { DatabaseReadiness } from './database-readiness';

@Injectable()
export class PrismaDatabase
  extends PrismaClient
  implements DatabaseReadiness, OnModuleDestroy
{
  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    super({
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 3_000,
      }),
    });
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
