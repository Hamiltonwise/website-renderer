import { getDb } from '../db';
import type { Project, ProjectStatus } from '@/types';

const db = getDb();

/**
 * Generate a random hostname for a new project
 * Format: {word}-{word}-{number}
 */
function generateHostname(): string {
  const adjectives = ['bright', 'swift', 'calm', 'bold', 'fresh', 'prime', 'smart', 'clear'];
  const nouns = ['dental', 'clinic', 'care', 'health', 'smile', 'wellness', 'medical', 'beauty'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
}

/**
 * Create a new project
 */
export async function createProject(
  userId: string,
  hostname?: string
): Promise<Project> {
  const generatedHostname = hostname ?? generateHostname();

  const [project] = await db('projects')
    .insert({
      user_id: userId,
      generated_hostname: generatedHostname,
      status: 'CREATED',
    })
    .returning('*');

  return project;
}

/**
 * Get a project by its ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const project = await db('projects').where({ id }).first();
  return project || null;
}

/**
 * Get a project by its generated hostname
 */
export async function getProjectByHostname(hostname: string): Promise<Project | null> {
  const project = await db('projects').where({ generated_hostname: hostname }).first();
  return project || null;
}

/**
 * Update a project with partial data
 */
export async function updateProject(
  id: string,
  data: Partial<Omit<Project, 'id' | 'created_at'>>
): Promise<Project> {
  const [project] = await db('projects')
    .where({ id })
    .update({
      ...data,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return project;
}

/**
 * Get all projects for a user
 */
export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  return db('projects')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');
}

/**
 * Delete a project (cascades to pages)
 */
export async function deleteProject(id: string): Promise<Project> {
  const [project] = await db('projects')
    .where({ id })
    .del()
    .returning('*');

  return project;
}

/**
 * Confirm GBP selection and save place details
 */
export async function confirmGbpSelection(
  projectId: string,
  placeId: string,
  websiteUrl: string | null
): Promise<Project> {
  const [project] = await db('projects')
    .where({ id: projectId })
    .update({
      selected_place_id: placeId,
      selected_website_url: websiteUrl,
      status: 'GBP_SELECTED' as ProjectStatus,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return project;
}

/**
 * Get project with pages included
 */
export async function getProjectWithPages(id: string) {
  const project = await db('projects').where({ id }).first();
  if (!project) return null;

  const pages = await db('pages').where({ project_id: id });
  return { ...project, pages };
}
