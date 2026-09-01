process.env.DATABASE_URL =
  process.env.DATABASE_URL?.trim() ||
  'postgresql://notifyfin:notifyfin_test@127.0.0.1:55432/notifyfin_test';

require('./pgboss-migrate.cjs');
