const { spawnSync } = require('node:child_process');
const { requireDatabaseUrl } = require('./database-url.cjs');

const databaseUrl = requireDatabaseUrl('Prisma migrations');
const prismaCli = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
