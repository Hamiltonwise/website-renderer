/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const defaultSchema = process.env.DATABASE_SCHEMA || 'website-builder';

const config = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    searchPath: [defaultSchema, 'public'],
    migrations: {
      tableName: 'knex_migrations',
      schemaName: defaultSchema,
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 10,
    },
    searchPath: [defaultSchema, 'public'],
    migrations: {
      tableName: 'knex_migrations',
      schemaName: defaultSchema,
      directory: './src/db/migrations',
    },
  },
};

module.exports = config;
