import { Request, Response } from 'express';
import { getProjectByHostname, getProjectByCustomDomain } from '../services/project.service';
import { getPageToRender, hasPublishedPages } from '../services/page.service';
import { getSinglePostData } from '../services/singlepost.service';
import { siteNotFoundPage } from '../templates/site-not-found';
import { siteNotReadyPage } from '../templates/site-not-ready';
import { pageNotFoundPage } from '../templates/page-not-found';
import { successPage } from '../templates/success-page';
import { renderPage, normalizeSections, injectSeoMeta } from '../utils/renderer';
import { resolvePostBlocks } from '../services/postblock.service';
import { resolveMenus } from '../services/menu.service';
import { fetchBusinessData } from '../services/seo.service';
import { renderPostBlockHtml } from '../utils/shortcodes';
import { processTailwindCSS } from '../utils/tailwind';
import type { Project, Page, SeoData } from '../types';
import { getDb } from '../lib/db';
import { getRedis } from '../lib/redis';

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

function getApiBaseUrl(): string {
  return process.env.API_BASE_URL || 'https://app.getalloro.com';
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

  let html = renderPage(
    project.wrapper || '{{slot}}',
    project.header || '',
    project.footer || '',
    normalizeSections(page.sections),
    mergedSnippets,
    page.id,
    project.id,
    getApiBaseUrl()
  );

  // Resolve {{ post_block }} shortcodes (runtime post rendering)
  html = await resolvePostBlocks(html, project.template_id, project.id);

  // Resolve {{ menu id='slug' }} shortcodes
  html = await resolveMenus(html, project.id, project.template_id || undefined);

  // Inject page-level SEO meta tags (replaces or adds to wrapper)
  const seoData = page.seo_data as SeoData | null;
  if (seoData) {
    html = injectSeoMeta(html, seoData);
  }

  // Tailwind CSS: compile for published, Play CDN for drafts
  html = await processTailwindCSS(html, page.status === 'draft');

  return html;
}

/**
 * Default single post template if none is defined on the post type.
 */
const DEFAULT_SINGLE_TEMPLATE = [
  {
    name: 'single-post',
    content: `<article style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 2rem; margin-bottom: 16px;">{{post.title}}</h1>
  <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">{{post.published_at}}</p>
  <img src="{{post.featured_image}}" alt="{{post.title}}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />
  <div style="line-height: 1.7;">{{post.content}}</div>
</article>`,
  },
];

function formatDateStr(dateStr: string | Date | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Assemble HTML for a single post page using the post type's single_template.
 */
async function assembleSinglePostHtml(
  project: Project,
  postType: any,
  post: any
): Promise<string> {
  const db = getDb();

  const templateSnippets = project.template_id
    ? await db('header_footer_code')
        .where({ template_id: project.template_id, is_enabled: true })
        .orderBy('order_index', 'asc')
    : [];

  const projectSnippets = await db('header_footer_code')
    .where({ project_id: project.id, is_enabled: true })
    .orderBy('order_index', 'asc');

  const mergedSnippets = mergeCodeSnippets(templateSnippets, projectSnippets);

  // Use single_template from post type, or default
  let sections = Array.isArray(postType.single_template) && postType.single_template.length > 0
    ? postType.single_template
    : DEFAULT_SINGLE_TEMPLATE;

  // Parse custom_fields
  let customFields: Record<string, unknown> = {};
  if (typeof post.custom_fields === 'string') {
    try { customFields = JSON.parse(post.custom_fields); } catch { customFields = {}; }
  } else if (post.custom_fields) {
    customFields = post.custom_fields;
  }

  // Replace {{post.*}} tokens in each section's content
  const postData = {
    title: post.title || '',
    slug: post.slug || '',
    url: `/${postType.slug}/${post.slug}`,
    content: post.content || '',
    excerpt: post.excerpt || '',
    featured_image: post.featured_image || '',
    custom_fields: customFields,
    categories: post.categories || '',
    tags: post.tags || '',
    created_at: formatDateStr(post.created_at),
    updated_at: formatDateStr(post.updated_at),
    published_at: formatDateStr(post.published_at),
  };

  const resolvedSections = sections.map((s: any) => ({
    name: s.name,
    content: renderPostBlockHtml(s.content, postData),
  }));

  let html = renderPage(
    project.wrapper || '{{slot}}',
    project.header || '',
    project.footer || '',
    resolvedSections,
    mergedSnippets,
    undefined,
    project.id,
    getApiBaseUrl()
  );

  // Single post pages may also contain post block shortcodes
  html = await resolvePostBlocks(html, project.template_id, project.id);

  // Resolve {{ menu id='slug' }} shortcodes
  html = await resolveMenus(html, project.id, project.template_id || undefined);

  // Inject post-level SEO meta tags
  const postSeoData = post.seo_data as SeoData | null;
  if (postSeoData) {
    html = injectSeoMeta(html, postSeoData);
  }

  // Tailwind CSS: single post pages are always published content
  html = await processTailwindCSS(html, false);

  return html;
}

export async function siteRoute(req: Request, res: Response): Promise<void> {
  const hostname = res.locals.hostname as string | undefined;
  const customDomain = res.locals.customDomain as string | undefined;
  const pagePath = req.path === '/' ? '/' : req.path;

  // ?nocache=1 — flush all post-related Redis keys for this request
  if (req.query.nocache === '1') {
    try {
      const redis = getRedis();
      const patterns = ['pb:*', 'posts:*', 'sp:*', 'mt:*', 'menu:*', 'tw:*'];
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
      }
    } catch {
      // Redis flush failure is non-fatal
    }
  }

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

  // Gate: render only if published pages exist. Project status is not checked —
  // generation is tracked at the page level via generation_status.
  const hasPages = await hasPublishedPages(project.id);
  if (!hasPages) {
    res.type('html').send(siteNotReadyPage(businessName));
    return;
  }

  // Get the page content
  const page = await getPageToRender(project.id, pagePath);

  if (!page) {
    // Try single post routing for 2-segment paths: /{type-slug}/{post-slug}
    const segments = pagePath.split('/').filter(Boolean);
    if (segments.length === 2 && project.template_id) {
      const singlePost = await getSinglePostData(
        project.id,
        project.template_id,
        segments[0],
        segments[1]
      );
      if (singlePost) {
        const html = await assembleSinglePostHtml(project, singlePost.postType, singlePost.post);
        res.type('html').send(html);
        return;
      }
    }

    // Serve fallback success page if no DB page exists for /success
    if (pagePath === '/success') {
      res.type('html').send(successPage(businessName, project.primary_color ?? undefined));
      return;
    }

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
