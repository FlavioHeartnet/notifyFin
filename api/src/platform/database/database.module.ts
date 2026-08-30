import { Module } from '@nestjs/common';
import { DATABASE_READINESS } from './database-readiness';
import { PrismaDatabase } from './prisma-database';

@Module({
  providers: [
    PrismaDatabase,
    {
      provide: DATABASE_READINESS,
      useExisting: PrismaDatabase,
    },
  ],
  exports: [DATABASE_READINESS],
})
export class DatabaseModule {}
