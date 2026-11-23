import { Module } from '@nestjs/common';
import { DATABASE_READINESS } from './database-readiness';
import { DATABASE_TRANSACTIONS } from './database-transactions';
import { PrismaDatabase } from './prisma-database';

@Module({
  providers: [
    PrismaDatabase,
    {
      provide: DATABASE_READINESS,
      useExisting: PrismaDatabase,
    },
    {
      provide: DATABASE_TRANSACTIONS,
      useExisting: PrismaDatabase,
    },
  ],
  exports: [DATABASE_READINESS, DATABASE_TRANSACTIONS],
})
export class DatabaseModule {}
