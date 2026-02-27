import { Request, Response } from 'express';
import { getProjectByHostname, getProjectByCustomDomain } from '../services/project.service';
import { getPageToRender, hasPublishedPages } from '../services/page.service';
import { siteNotFoundPage } from '../templates/site-not-found';
import { siteNotReadyPage } from '../templates/site-not-ready';
import { pageNotFoundPage } from '../templates/page-not-found';
import { renderPage, normalizeSections } from '../utils/renderer';
import type { Project, Page } from '../types';
import { getDb } from '../lib/db';

function getBusinessName(project: Project): string | undefined {
  if (project.step_gbp_scrape && typeof project.step_gbp_scrape === 'object') {
    return (project.step_gbp_scrape as { name?: string }).name;
  }
  return undefined;
}

/**
 * Merge code snippets: project snippets override template snippets by name+location
 */
function mergeCodeSnippets(templateSnippets: any[], projectSnippets: any[]): any[] {
  const result = [...templateSnippets];

  for (const projectSnippet of projectSnippets) {
    const existingIndex = result.findIndex(
      (s) => s.name === projectSnippet.name && s.location === projectSnippet.location
    );

    if (existingIndex >= 0) {
      result[existingIndex] = projectSnippet; // Override
    } else {
      result.push(projectSnippet); // Append
    }
  }

  return result;
}

async function assembleHtml(project: Project, page: Page): Promise<string> {
  const db = getDb();

  // Fetch template snippets (if project has template)
  const templateSnippets = project.template_id
    ? await db('header_footer_code')
        .where({ template_id: project.template_id, is_enabled: true })
        .orderBy('order_index', 'asc')
    : [];

  // Fetch project snippets
  const projectSnippets = await db('header_footer_code')
    .where({ project_id: project.id, is_enabled: true })
    .orderBy('order_index', 'asc');

  // Merge: project overrides template by name+location
  const mergedSnippets = mergeCodeSnippets(templateSnippets, projectSnippets);

  return renderPage(
    project.wrapper || '{{slot}}',
    project.header || '',
    project.footer || '',
    normalizeSections(page.sections),
    mergedSnippets,
    page.id
  );
}

export async function siteRoute(req: Request, res: Response): Promise<void> {
  const hostname = res.locals.hostname as string | undefined;
  const customDomain = res.locals.customDomain as string | undefined;
  const pagePath = req.path === '/' ? '/' : req.path;

  const project = hostname
    ? await getProjectByHostname(hostname)
    : customDomain
      ? await getProjectByCustomDomain(customDomain)
      : null;

  if (!project) {
    res.status(404).type('html').send(siteNotFoundPage(hostname || customDomain || 'unknown'));
    return;
  }

  const businessName = getBusinessName(project);

  // Check if project is ready.
  // If the project is in an intermediate pipeline state (e.g. generating a new page)
  // but already has published pages, skip the gate and render normally.
  if (project.status !== 'HTML_GENERATED' && project.status !== 'READY') {
    const hasPages = await hasPublishedPages(project.id);
    if (!hasPages) {
      res.type('html').send(siteNotReadyPage(project.status, businessName));
      return;
    }
  }

  // Get the page content
  const page = await getPageToRender(project.id, pagePath);

  if (!page) {
    // Try the home page as fallback for non-root paths
    if (pagePath !== '/') {
      const homePage = await getPageToRender(project.id, '/');
      if (homePage) {
        const html = await assembleHtml(project, homePage);
        res.type('html').send(html);
        return;
      }
    }

    res.status(404).type('html').send(pageNotFoundPage(businessName));
    return;
  }

  const html = await assembleHtml(project, page);
  res.type('html').send(html);
}
