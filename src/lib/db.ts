import knex, { Knex } from 'knex';

const defaultSchema = process.env.DATABASE_SCHEMA || 'website_builder';

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn: { query: (sql: string, cb: (err: Error | null) => void) => void }, done: (err: Error | null, conn: unknown) => void) => {
      conn.query(`SET search_path TO "${defaultSchema}", public;`, (err) => {
        done(err, conn);
      });
    },
  },
  searchPath: [defaultSchema, 'public'],
};

// Create a singleton instance
let db: Knex | null = null;

export function getDb(): Knex {
  if (!db) {
    db = knex(config);
  }
  return db;
}

export default getDb;
