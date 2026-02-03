import type { Knex } from 'knex';

const schemaName = process.env.DATABASE_SCHEMA || 'website-builder';

exports.up = async function(knex: Knex): Promise<void> {
  // Create project_status enum
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE "${schemaName}".project_status AS ENUM (
        'CREATED', 'GBP_SELECTED', 'GBP_SCRAPED',
        'WEBSITE_SCRAPED', 'IMAGES_ANALYZED', 'HTML_GENERATED', 'READY'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.schema.withSchema(schemaName).createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('user_id').notNullable();
    table.string('generated_hostname').unique().notNullable();
    table.specificType('status', `"${schemaName}".project_status`).defaultTo('CREATED');
    table.string('selected_place_id');
    table.text('selected_website_url');
    table.jsonb('step_gbp_scrape');
    table.jsonb('step_website_scrape');
    table.jsonb('step_image_analysis');
    table.timestamps(true, true);
  });
};

exports.down = async function(knex: Knex): Promise<void> {
  await knex.schema.withSchema(schemaName).dropTableIfExists('projects');
  await knex.raw(`DROP TYPE IF EXISTS "${schemaName}".project_status`);
};
