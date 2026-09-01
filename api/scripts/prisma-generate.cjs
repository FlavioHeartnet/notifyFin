const { spawnSync } = require('node:child_process');

const environment = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL?.trim() ||
    'postgresql://generate:generate@127.0.0.1:5432/generate',
};
const prismaCli = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'generate'], {
  env: environment,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
