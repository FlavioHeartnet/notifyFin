const { spawnSync } = require('node:child_process');
const { requireDatabaseUrl } = require('./database-url.cjs');

const databaseUrl = requireDatabaseUrl('pg-boss migrations');

const pgBossCli = require.resolve('pg-boss/dist/cli.js');
const result = spawnSync(process.execPath, [pgBossCli, 'migrate'], {
  env: {
    ...process.env,
    PGBOSS_DATABASE_URL: databaseUrl,
  },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
