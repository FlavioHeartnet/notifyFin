const acceptedEnvironments = new Set(['development', 'production', 'test']);
const acceptedTlsModes = new Set(['require', 'verify-ca', 'verify-full']);

function requireDatabaseUrl(purpose) {
  const environment = process.env.NODE_ENV?.trim() || 'development';
  if (!acceptedEnvironments.has(environment)) {
    throw new Error('NODE_ENV must be development, production, or test');
  }

  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error(`DATABASE_URL is required for ${purpose}`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }

  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    url.hostname.length === 0
  ) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }

  if (environment === 'production') {
    const sslModes = url.searchParams.getAll('sslmode');
    if (sslModes.length !== 1 || !acceptedTlsModes.has(sslModes[0])) {
      throw new Error('DATABASE_URL must require TLS in production');
    }
  }

  return value;
}

module.exports = { requireDatabaseUrl };
