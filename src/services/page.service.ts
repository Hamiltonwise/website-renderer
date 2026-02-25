import { getDb } from '../lib/db';
import type { Page } from '../types';

export async function getPublishedPage(
  projectId: string,
  path: string
): Promise<Page | null> {
  const page = await getDb()('pages')
    .where({
      project_id: projectId,
      path,
      status: 'published',
    })
    .first();

  return page || null;
}

export async function getDraftPage(
  projectId: string,
  path: string
): Promise<Page | null> {
  const page = await getDb()('pages')
    .where({
      project_id: projectId,
      path,
      status: 'draft',
    })
    .first();

  return page || null;
}

export async function getPageToRender(
  projectId: string,
  path: string
): Promise<Page | null> {
  const published = await getPublishedPage(projectId, path);
  if (published) return published;

  return getDraftPage(projectId, path);
}

export async function hasPublishedPages(projectId: string): Promise<boolean> {
  const row = await getDb()('pages')
    .where({ project_id: projectId, status: 'published' })
    .select(getDb().raw('1'))
    .first();

  return !!row;
}
