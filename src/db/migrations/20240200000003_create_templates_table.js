const schemaName = process.env.DATABASE_SCHEMA || 'website_builder';

exports.up = async function(knex) {
  await knex.schema.withSchema(schemaName).createTable('templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('name').notNullable();
    table.text('html_template');
    table.boolean('is_active').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.withSchema(schemaName).dropTableIfExists('templates');
};
