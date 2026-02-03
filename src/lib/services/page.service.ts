import { getDb } from '../db';
import type { Page, PageStatus } from '@/types';

const db = getDb();

/**
 * Create a new page version for a project
 * - Marks any existing draft as inactive
 * - Creates new page with incremented version
 */
export async function createPageVersion(
  projectId: string,
  path: string,
  htmlContent: string
): Promise<Page> {
  // Get the latest version for this project+path
  const latestPage = await db('pages')
    .where({ project_id: projectId, path })
    .orderBy('version', 'desc')
    .first();

  const newVersion = latestPage ? latestPage.version + 1 : 1;

  // Mark any existing draft as inactive
  await db('pages')
    .where({
      project_id: projectId,
      path,
      status: 'draft',
    })
    .update({
      status: 'inactive' as PageStatus,
      updated_at: db.fn.now(),
    });

  // Create the new draft
  const [page] = await db('pages')
    .insert({
      project_id: projectId,
      path,
      version: newVersion,
      status: 'draft',
      html_content: htmlContent,
    })
    .returning('*');

  return page;
}

/**
 * Get the published page for a project and path
 */
export async function getPublishedPage(
  projectId: string,
  path: string
): Promise<Page | null> {
  const page = await db('pages')
    .where({
      project_id: projectId,
      path,
      status: 'published',
    })
    .first();

  return page || null;
}

/**
 * Get the draft page for a project and path
 */
export async function getDraftPage(
  projectId: string,
  path: string
): Promise<Page | null> {
  const page = await db('pages')
    .where({
      project_id: projectId,
      path,
      status: 'draft',
    })
    .first();

  return page || null;
}

/**
 * Get all page versions for a project and path, ordered by version descending
 */
export async function getAllPageVersions(
  projectId: string,
  path: string
): Promise<Page[]> {
  return db('pages')
    .where({
      project_id: projectId,
      path,
    })
    .orderBy('version', 'desc');
}

/**
 * Get a page by its ID
 */
export async function getPageById(id: string): Promise<Page | null> {
  const page = await db('pages').where({ id }).first();
  return page || null;
}

/**
 * Get the page to render for a project (published first, then draft)
 */
export async function getPageToRender(
  projectId: string,
  path: string
): Promise<Page | null> {
  // Try published first
  const published = await getPublishedPage(projectId, path);
  if (published) return published;

  // Fallback to draft
  return getDraftPage(projectId, path);
}

/**
 * Publish a draft page
 */
export async function publishPage(pageId: string): Promise<Page> {
  const page = await getPageById(pageId);
  if (!page) throw new Error('Page not found');

  // Unpublish any currently published page for this project+path
  await db('pages')
    .where({
      project_id: page.project_id,
      path: page.path,
      status: 'published',
    })
    .update({
      status: 'inactive' as PageStatus,
      updated_at: db.fn.now(),
    });

  // Publish this page
  const [publishedPage] = await db('pages')
    .where({ id: pageId })
    .update({
      status: 'published' as PageStatus,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return publishedPage;
}
