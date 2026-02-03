import type { Knex } from 'knex';

const schemaName = process.env.DATABASE_SCHEMA || 'website-builder';

exports.up = async function(knex: Knex): Promise<void> {
  await knex.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
};

exports.down = async function(knex: Knex): Promise<void> {
  await knex.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
};
