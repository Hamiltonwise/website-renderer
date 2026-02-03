import type { Knex } from 'knex';

const schemaName = process.env.DATABASE_SCHEMA || 'website-builder';

exports.up = async function(knex: Knex): Promise<void> {
  // Create page_status enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE "${schemaName}".page_status AS ENUM ('draft', 'published', 'inactive');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.schema.withSchema(schemaName).createTable('pages', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('project_id').notNullable();
    table.string('path').defaultTo('/');
    table.integer('version').defaultTo(1);
    table.specificType('status', `"${schemaName}".page_status`).defaultTo('draft');
    table.text('html_content');
    table.timestamps(true, true);

    // Foreign key
    table.foreign('project_id').references('id').inTable(`${schemaName}.projects`).onDelete('CASCADE');

    // Indexes
    table.index(['project_id']);
    table.index(['project_id', 'path']);
    table.index(['status']);
  });
};

exports.down = async function(knex: Knex): Promise<void> {
  await knex.schema.withSchema(schemaName).dropTableIfExists('pages');
  await knex.raw(`DROP TYPE IF EXISTS "${schemaName}".page_status`);
};
