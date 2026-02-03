const schemaName = process.env.DATABASE_SCHEMA || 'website_builder';

exports.up = async function(knex) {
  await knex.schema.withSchema(schemaName).alterTable('templates', (table) => {
    // Add status column with default 'draft'
    table.string('status').notNullable().defaultTo('draft');
  });

  // Update existing templates: set published templates (those with content) to 'published'
  await knex(schemaName + '.templates')
    .whereNotNull('html_template')
    .andWhere('html_template', '!=', '')
    .update({ status: 'published' });
};

exports.down = async function(knex) {
  await knex.schema.withSchema(schemaName).alterTable('templates', (table) => {
    table.dropColumn('status');
  });
};
