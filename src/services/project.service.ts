import { getDb } from '../lib/db';
import type { Project } from '../types';

export async function getProjectById(id: string): Promise<Project | null> {
  const project = await getDb()('projects').where({ id }).first();
  return project || null;
}

export async function getProjectByHostname(hostname: string): Promise<Project | null> {
  const project = await getDb()('projects').where({ generated_hostname: hostname }).first();
  return project || null;
}

export async function getProjectByCustomDomain(domain: string): Promise<Project | null> {
  const project = await getDb()('projects')
    .where(function () {
      this.where('custom_domain', domain).orWhere('custom_domain_alt', domain);
    })
    .whereNotNull('domain_verified_at')
    .first();
  return project || null;
}
