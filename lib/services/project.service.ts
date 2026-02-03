import { prisma } from '../db';
import type { Project, ProjectStatus, Prisma } from '@prisma/client';

/**
 * Generate a random hostname for a new project
 * Format: {word}-{word}-{number}.sites.getalloro.com
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

  return prisma.project.create({
    data: {
      userId,
      generatedHostname,
      status: 'CREATED',
    },
  });
}

/**
 * Get a project by its ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  return prisma.project.findUnique({
    where: { id },
  });
}

/**
 * Get a project by its generated hostname
 */
export async function getProjectByHostname(hostname: string): Promise<Project | null> {
  return prisma.project.findUnique({
    where: { generatedHostname: hostname },
  });
}

/**
 * Update a project with partial data
 */
export async function updateProject(
  id: string,
  data: Prisma.ProjectUpdateInput
): Promise<Project> {
  return prisma.project.update({
    where: { id },
    data,
  });
}

/**
 * Get all projects for a user
 */
export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete a project (cascades to pages)
 */
export async function deleteProject(id: string): Promise<Project> {
  return prisma.project.delete({
    where: { id },
  });
}

/**
 * Confirm GBP selection and save place details
 */
export async function confirmGbpSelection(
  projectId: string,
  placeId: string,
  websiteUrl: string | null
): Promise<Project> {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      selectedPlaceId: placeId,
      selectedWebsiteUrl: websiteUrl,
      status: 'GBP_SELECTED',
    },
  });
}

/**
 * Get project with pages included
 */
export async function getProjectWithPages(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { pages: true },
  });
}
