exports.up = function (knex) {
  const defaultSchema = process.env.DATABASE_SCHEMA || 'website_builder';

  return knex.schema.withSchema(defaultSchema).createTable('otp_codes', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable();
    table.string('code', 6).notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamps(true, true);

    table.index('email');
    table.index(['email', 'code', 'used']);
  });
};

exports.down = function (knex) {
  const defaultSchema = process.env.DATABASE_SCHEMA || 'website_builder';

  return knex.schema.withSchema(defaultSchema).dropTableIfExists('otp_codes');
};
