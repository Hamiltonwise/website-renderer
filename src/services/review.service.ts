/**
 * Review Block Resolution Service
 *
 * Resolves {{ review_block }} shortcodes at runtime:
 * 1. Scans HTML for review block shortcodes
 * 2. Fetches review block templates from DB (via Redis cache)
 * 3. Resolves project → org → locations
 * 4. Fetches reviews from local DB (via Redis cache)
 * 5. Renders review data into block HTML with loop markers
 * 6. Replaces shortcodes with rendered output
 */

import { getDb } from '../lib/db';
import { getRedis } from '../lib/redis';
import {
  parseReviewBlockShortcodes,
  hasReviewBlockShortcodes,
  renderReviewBlockHtml,
  type ReviewBlockShortcode,
} from '../utils/shortcodes';
import crypto from 'crypto';

const REVIEW_BLOCK_TTL = 300; // 5 minutes
const REVIEWS_TTL = 120; // 2 minutes

interface ReviewBlockRow {
  slug: string;
  sections: { name: string; content: string }[] | string;
}

interface ReviewRow {
  stars: number;
  text: string | null;
  reviewer_name: string | null;
  reviewer_photo_url: string | null;
  is_anonymous: boolean;
  review_created_at: string | Date | null;
  has_reply: boolean;
  reply_text: string | null;
  reply_date: string | Date | null;
}

function hashReviewFilters(sc: ReviewBlockShortcode, locationIds: number[]): string {
  const key = [
    locationIds.join(','),
    String(sc.min_rating),
    String(sc.limit),
    String(sc.offset),
    sc.order,
  ].join('|');
  return crypto.createHash('md5').update(key).digest('hex').slice(0, 12);
}

/**
 * Fetch a review block by template ID and slug, with Redis caching.
 */
async function fetchReviewBlock(templateId: string, slug: string): Promise<ReviewBlockRow | null> {
  const redis = getRedis();
  const cacheKey = `rb:${templateId}:${slug}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache miss or Redis down — fall through to DB
  }

  const db = getDb();
  const row = await db('review_blocks')
    .where({ template_id: templateId, slug })
    .select('slug', 'sections')
    .first();

  if (!row) return null;

  if (typeof row.sections === 'string') {
    row.sections = JSON.parse(row.sections);
  }

  try {
    await redis.set(cacheKey, JSON.stringify(row), 'EX', REVIEW_BLOCK_TTL);
  } catch {
    // Cache write failure is non-fatal
  }

  return row;
}

/**
 * Fetch reviews for given location IDs with filters, with Redis caching.
 */
async function fetchReviews(
  locationIds: number[],
  sc: ReviewBlockShortcode
): Promise<ReviewRow[]> {
  const redis = getRedis();
  const filterHash = hashReviewFilters(sc, locationIds);
  const cacheKey = `reviews:${filterHash}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache miss
  }

  const db = getDb();
  const reviews = await db('reviews')
    .whereIn('location_id', locationIds)
    .where('stars', '>=', sc.min_rating)
    .orderBy('review_created_at', sc.order)
    .limit(sc.limit)
    .offset(sc.offset)
    .select(
      'stars',
      'text',
      'reviewer_name',
      'reviewer_photo_url',
      'is_anonymous',
      'review_created_at',
      'has_reply',
      'reply_text',
      'reply_date'
    );

  try {
    await redis.set(cacheKey, JSON.stringify(reviews), 'EX', REVIEWS_TTL);
  } catch {
    // Cache write failure is non-fatal
  }

  return reviews;
}

/**
 * Resolve all {{ review_block }} shortcodes in the given HTML.
 */
export async function resolveReviewBlocks(
  html: string,
  projectId: string,
  templateId?: string
): Promise<string> {
  if (!templateId || !hasReviewBlockShortcodes(html)) {
    return html;
  }

  const shortcodes = parseReviewBlockShortcodes(html);
  if (shortcodes.length === 0) {
    return html;
  }

  // Resolve project → org → locations
  const db = getDb();
  const project = await db('projects')
    .where('id', projectId)
    .select('organization_id')
    .first();

  if (!project?.organization_id) {
    // No org — remove all review block shortcodes
    let result = html;
    for (const sc of shortcodes) {
      result = result.replace(sc.raw, '');
    }
    return result;
  }

  // Use public schema for locations table
  const locations = await db.raw(
    'SELECT id, name, domain, is_primary FROM public.locations WHERE organization_id = ?',
    [project.organization_id]
  );
  const locationRows: { id: number; name: string; domain: string | null; is_primary: boolean }[] = locations.rows || locations;

  if (locationRows.length === 0) {
    let result = html;
    for (const sc of shortcodes) {
      result = result.replace(sc.raw, '');
    }
    return result;
  }

  // Batch-fetch all unique review blocks
  const uniqueSlugs = [...new Set(shortcodes.map((s) => s.id))];
  const blockMap = new Map<string, ReviewBlockRow>();

  await Promise.all(
    uniqueSlugs.map(async (slug) => {
      const block = await fetchReviewBlock(templateId, slug);
      if (block) blockMap.set(slug, block);
    })
  );

  let result = html;

  for (const sc of shortcodes) {
    const block = blockMap.get(sc.id);
    if (!block) {
      result = result.replace(sc.raw, '');
      continue;
    }

    // Resolve location IDs
    let locationIds: number[];

    if (sc.location === 'all') {
      locationIds = locationRows.map((l) => l.id);
    } else if (sc.location === 'primary') {
      const loc = locationRows.find((l) => l.is_primary) || locationRows[0];
      locationIds = [loc.id];
    } else {
      const loc = locationRows.find(
        (l) => l.name === sc.location || l.domain === sc.location
      );
      if (!loc) {
        result = result.replace(sc.raw, '');
        continue;
      }
      locationIds = [loc.id];
    }

    // Fetch reviews
    const reviews = await fetchReviews(locationIds, sc);

    if (reviews.length === 0) {
      result = result.replace(sc.raw, '');
      continue;
    }

    // Assemble block HTML from sections
    const sections = Array.isArray(block.sections) ? block.sections : [];
    const blockHtml = sections.map((s) => s.content).join('\n');

    // Split on loop markers
    const startMarker = '{{start_review_loop}}';
    const endMarker = '{{end_review_loop}}';
    const startIdx = blockHtml.indexOf(startMarker);
    const endIdx = blockHtml.indexOf(endMarker);

    let before = '';
    let template = blockHtml;
    let after = '';

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      before = blockHtml.slice(0, startIdx);
      template = blockHtml.slice(startIdx + startMarker.length, endIdx);
      after = blockHtml.slice(endIdx + endMarker.length);
    }

    // Render each review through the template
    const renderedReviews = reviews.map((review) =>
      renderReviewBlockHtml(template, review)
    );

    result = result.replace(sc.raw, before + renderedReviews.join('\n') + after);
  }

  return result;
}
