import { spawnSync } from 'node:child_process';
import path from 'node:path';

describe('Production migration transport', () => {
  it.each(['prisma-migrate.cjs', 'pgboss-migrate.cjs'])(
    'rejects insecure DATABASE_URL before running %s',
    (script) => {
      const insecureUrl =
        'postgresql://notifyfin:private-password@127.0.0.1:55432/notifyfin_test?sslmode=disable';
      const result = spawnSync(
        process.execPath,
        [path.join('scripts', script)],
        {
          cwd: path.resolve(__dirname, '..'),
          encoding: 'utf8',
          env: {
            ...process.env,
            NODE_ENV: 'production',
            DATABASE_URL: insecureUrl,
          },
        },
      );
      const output = `${result.stdout}${result.stderr}`;

      expect(result.status).not.toBe(0);
      expect(output).toContain('DATABASE_URL must require TLS in production');
      expect(output).not.toContain('private-password');
    },
  );
});
