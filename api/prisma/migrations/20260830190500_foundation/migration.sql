-- pg-boss requires pgcrypto when PostgreSQL does not provide gen_random_uuid natively.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
