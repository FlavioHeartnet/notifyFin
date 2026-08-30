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
  })
  .superRefine((config, context) => {
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
}

export const RUNTIME_CONFIG = Symbol('RUNTIME_CONFIG');

export function parseRuntimeConfig(
  environment: Record<string, unknown>,
): RuntimeConfig {
  const result = runtimeConfigSchema.safeParse({
    ...environment,
    ADMIN_HOSTNAME: normalizeRequired(environment.ADMIN_HOSTNAME),
    PUBLIC_HOSTNAME: normalizeRequired(environment.PUBLIC_HOSTNAME),
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
  });
}

function normalizeRequired(value: unknown) {
  return typeof value === 'string' ? value : '';
}
