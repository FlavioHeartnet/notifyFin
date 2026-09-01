const { spawnSync } = require('node:child_process');

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  'postgresql://notifyfin:notifyfin_test@127.0.0.1:55432/notifyfin_test';
const queueUnmigratedUrl = new URL(databaseUrl);
queueUnmigratedUrl.pathname = '/notifyfin_queue_unmigrated';

for (const url of [databaseUrl, queueUnmigratedUrl.toString()]) {
  runPrismaMigration(url);
}

function runPrismaMigration(url) {
  const prismaCli = require.resolve('prisma/build/index.js');
  const result = spawnSync(
    process.execPath,
    [prismaCli, 'migrate', 'deploy'],
    {
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
