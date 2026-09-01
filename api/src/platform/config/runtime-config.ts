import { z } from 'zod';

const hostnamePattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const hostname = (name: 'ADMIN_HOSTNAME' | 'PUBLIC_HOSTNAME') =>
  z
    .string()
    .trim()
    .min(1, `${name} is required`)
    .max(253, `${name} must be a valid hostname`)
    .toLowerCase()
    .refine(
      (value) => value.length === 0 || hostnamePattern.test(value),
      `${name} must be a valid hostname`,
    );

const runtimeConfigSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'], {
        error: 'NODE_ENV must be development, production, or test',
      })
      .default('development'),
    PORT: z.coerce
      .number({ error: 'PORT must be a valid TCP port' })
      .int('PORT must be a valid TCP port')
      .min(1, 'PORT must be a valid TCP port')
      .max(65535, 'PORT must be a valid TCP port')
      .default(3000),
    ADMIN_HOSTNAME: hostname('ADMIN_HOSTNAME'),
    PUBLIC_HOSTNAME: hostname('PUBLIC_HOSTNAME'),
    DATABASE_URL: z
      .string()
      .trim()
      .min(1, 'DATABASE_URL is required')
      .regex(
        /^postgres(?:ql)?:\/\//,
        'DATABASE_URL must be a PostgreSQL connection URL',
      )
      .refine(
        (value) => isPostgreSqlUrl(value),
        'DATABASE_URL must be a PostgreSQL connection URL',
      ),
  })
  .superRefine((config, context) => {
    if (
      config.NODE_ENV === 'production' &&
      !databaseUrlRequiresTls(config.DATABASE_URL)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL must require TLS in production',
      });
    }

    if (
      config.ADMIN_HOSTNAME.length > 0 &&
      config.ADMIN_HOSTNAME === config.PUBLIC_HOSTNAME
    ) {
      context.addIssue({
        code: 'custom',
        path: ['PUBLIC_HOSTNAME'],
        message: 'ADMIN_HOSTNAME and PUBLIC_HOSTNAME must be different',
      });
    }
  });

export interface RuntimeConfig {
  readonly environment: 'development' | 'production' | 'test';
  readonly port: number;
  readonly administrativeHostname: string;
  readonly publicHostname: string;
  readonly databaseUrl: string;
}

export const RUNTIME_CONFIG = Symbol('RUNTIME_CONFIG');

export function parseRuntimeConfig(
  environment: Record<string, unknown>,
): RuntimeConfig {
  const result = runtimeConfigSchema.safeParse({
    ...environment,
    ADMIN_HOSTNAME: normalizeRequired(environment.ADMIN_HOSTNAME),
    PUBLIC_HOSTNAME: normalizeRequired(environment.PUBLIC_HOSTNAME),
    DATABASE_URL: normalizeRequired(environment.DATABASE_URL),
  });

  if (!result.success) {
    throw new Error(
      result.error.issues.map((issue) => issue.message).join('; '),
    );
  }

  return Object.freeze({
    environment: result.data.NODE_ENV,
    port: result.data.PORT,
    administrativeHostname: result.data.ADMIN_HOSTNAME,
    publicHostname: result.data.PUBLIC_HOSTNAME,
    databaseUrl: result.data.DATABASE_URL,
  });
}

function normalizeRequired(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isPostgreSqlUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

function databaseUrlRequiresTls(value: string) {
  if (!isPostgreSqlUrl(value)) {
    return false;
  }

  const sslModes = new URL(value).searchParams.getAll('sslmode');
  return (
    sslModes.length === 1 &&
    ['require', 'verify-ca', 'verify-full'].includes(sslModes[0])
  );
}
