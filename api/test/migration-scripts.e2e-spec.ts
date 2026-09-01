import { spawnSync } from 'node:child_process';
import path from 'node:path';

describe('Production migration transport', () => {
  it.each(['prisma-migrate.cjs', 'pgboss-migrate.cjs'])(
    'rejects insecure DATABASE_URL before running %s',
    (script) => {
      const result = runMigration(script, 'production');

      expect(result.status).not.toBe(0);
      expect(result.output).toContain(
        'DATABASE_URL must require TLS in production',
      );
      expect(result.output).not.toContain('private-password');
    },
  );

  it.each(['prisma-migrate.cjs', 'pgboss-migrate.cjs'])(
    'rejects an unsupported NODE_ENV before running %s',
    (script) => {
      const result = runMigration(script, 'prod');

      expect(result.status).not.toBe(0);
      expect(result.output).toContain(
        'NODE_ENV must be development, production, or test',
      );
      expect(result.output).not.toContain('private-password');
    },
  );
});

function runMigration(script: string, nodeEnvironment: string) {
  const insecureUrl =
    'postgresql://notifyfin:private-password@127.0.0.1:55432/notifyfin_test?sslmode=disable';
  const result = spawnSync(process.execPath, [path.join('scripts', script)], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: nodeEnvironment,
      DATABASE_URL: insecureUrl,
    },
  });

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}
