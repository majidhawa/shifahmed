import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const pool =
  global.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

export default pool;