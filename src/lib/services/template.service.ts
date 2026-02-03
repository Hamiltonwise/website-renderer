import { getDb } from '../db';
import type { Template, TemplateStatus } from '@/types';

const db = getDb();

/**
 * Get the currently active template
 * In MVP, there's only one active template
 */
export async function getActiveTemplate(): Promise<Template | null> {
  const template = await db('templates').where({ is_active: true }).first();
  return template || null;
}

/**
 * Get a template by its ID
 */
export async function getTemplateById(id: string): Promise<Template | null> {
  const template = await db('templates').where({ id }).first();
  return template || null;
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<Template[]> {
  return db('templates').orderBy('created_at', 'desc');
}

/**
 * Get all published templates
 */
export async function getPublishedTemplates(): Promise<Template[]> {
  return db('templates').where({ status: 'published' }).orderBy('created_at', 'desc');
}

/**
 * Create a new template as draft
 */
export async function createTemplate(
  name: string,
  htmlTemplate: string,
  isActive: boolean = false
): Promise<Template> {
  // If setting as active, deactivate all others first
  if (isActive) {
    await db('templates')
      .where({ is_active: true })
      .update({ is_active: false, updated_at: db.fn.now() });
  }

  const [template] = await db('templates')
    .insert({
      name,
      html_template: htmlTemplate,
      status: 'draft' as TemplateStatus,
      is_active: isActive,
    })
    .returning('*');

  return template;
}

/**
 * Publish a template (change status from draft to published)
 */
export async function publishTemplate(id: string): Promise<Template> {
  const [template] = await db('templates')
    .where({ id })
    .update({ status: 'published' as TemplateStatus, updated_at: db.fn.now() })
    .returning('*');

  return template;
}

/**
 * Unpublish a template (change status from published to draft)
 */
export async function unpublishTemplate(id: string): Promise<Template> {
  const [template] = await db('templates')
    .where({ id })
    .update({ status: 'draft' as TemplateStatus, updated_at: db.fn.now() })
    .returning('*');

  return template;
}

/**
 * Set a template as the active template
 */
export async function setActiveTemplate(id: string): Promise<Template> {
  // Deactivate all templates
  await db('templates')
    .where({ is_active: true })
    .update({ is_active: false, updated_at: db.fn.now() });

  // Activate the specified template
  const [template] = await db('templates')
    .where({ id })
    .update({ is_active: true, updated_at: db.fn.now() })
    .returning('*');

  return template;
}

/**
 * Update a template
 */
export async function updateTemplate(
  id: string,
  data: Partial<Omit<Template, 'id' | 'created_at' | 'updated_at'>>
): Promise<Template> {
  const [template] = await db('templates')
    .where({ id })
    .update({
      ...data,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return template;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<Template> {
  const [template] = await db('templates')
    .where({ id })
    .del()
    .returning('*');

  return template;
}
