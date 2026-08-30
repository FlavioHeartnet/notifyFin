import { parseRuntimeConfig } from './runtime-config';

describe('runtime configuration', () => {
  const validEnvironment = {
    NODE_ENV: 'test',
    PORT: '3001',
    ADMIN_HOSTNAME: 'admin.notifyfin.test',
    PUBLIC_HOSTNAME: 'public.notifyfin.test',
  };

  it('returns normalized, immutable configuration', () => {
    const config = parseRuntimeConfig({
      ...validEnvironment,
      ADMIN_HOSTNAME: ' ADMIN.NotifyFin.Test ',
    });

    expect(config).toEqual({
      environment: 'test',
      port: 3001,
      administrativeHostname: 'admin.notifyfin.test',
      publicHostname: 'public.notifyfin.test',
    });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('rejects a missing administrative hostname without exposing values', () => {
    expect(() =>
      parseRuntimeConfig({
        ...validEnvironment,
        ADMIN_HOSTNAME: undefined,
      }),
    ).toThrow('ADMIN_HOSTNAME is required');
  });

  it('rejects equal administrative and public hostnames', () => {
    expect(() =>
      parseRuntimeConfig({
        ...validEnvironment,
        PUBLIC_HOSTNAME: validEnvironment.ADMIN_HOSTNAME,
      }),
    ).toThrow('ADMIN_HOSTNAME and PUBLIC_HOSTNAME must be different');
  });

  it('does not include invalid configuration values in errors', () => {
    const sensitiveValue = 'https://private-admin-host.invalid/secret';

    expect(() =>
      parseRuntimeConfig({
        ...validEnvironment,
        ADMIN_HOSTNAME: sensitiveValue,
      }),
    ).toThrow('ADMIN_HOSTNAME must be a valid hostname');

    try {
      parseRuntimeConfig({
        ...validEnvironment,
        ADMIN_HOSTNAME: sensitiveValue,
      });
    } catch (error) {
      expect((error as Error).message).not.toContain(sensitiveValue);
    }
  });

  it.each([
    ['NODE_ENV', { NODE_ENV: 'staging' }],
    ['PORT', { PORT: '70000' }],
    ['ADMIN_HOSTNAME', { ADMIN_HOSTNAME: 'https://admin.notifyfin.test' }],
    ['PUBLIC_HOSTNAME', { PUBLIC_HOSTNAME: 'public.notifyfin.test/path' }],
  ])('rejects invalid %s configuration', (name, override) => {
    expect(() =>
      parseRuntimeConfig({ ...validEnvironment, ...override }),
    ).toThrow(name);
  });
});
