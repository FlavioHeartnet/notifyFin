import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Client generation does not connect; runtime validation still requires DATABASE_URL.
    url:
      process.env.DATABASE_URL ??
      'postgresql://unused:unused@127.0.0.1:5432/unused',
  },
});
