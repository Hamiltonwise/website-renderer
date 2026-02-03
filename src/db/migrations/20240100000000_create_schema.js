const schemaName = process.env.DATABASE_SCHEMA || 'website_builder';

exports.up = async function(knex) {
  await knex.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
};

exports.down = async function(knex) {
  await knex.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
};
