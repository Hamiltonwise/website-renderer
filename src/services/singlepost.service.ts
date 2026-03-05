/**
 * Single Post Service
 *
 * Resolves /{type-slug}/{post-slug} URLs to post type + post data.
 * Used by the site route to render single post pages.
 */

import { getDb } from '../lib/db';
import { getRedis } from '../lib/redis';

const SINGLE_POST_TTL = 120; // 2 minutes

interface SinglePostResult {
  postType: {
    id: string;
    slug: string;
    name: string;
    single_template: { name: string; content: string }[] | string;
  };
  post: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    featured_image: string | null;
    custom_fields: Record<string, unknown> | string | null;
    categories: string;
    tags: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
  };
}

/**
 * Look up a published post by type slug and post slug.
 * Returns the post type (with single_template) and enriched post data, or null.
 */
export async function getSinglePostData(
  projectId: string,
  templateId: string,
  typeSlug: string,
  postSlug: string
): Promise<SinglePostResult | null> {
  const redis = getRedis();
  const cacheKey = `sp:${projectId}:${typeSlug}:${postSlug}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache miss
  }

  const db = getDb();

  // Look up post type by slug + template
  const postType = await db('post_types')
    .where({ template_id: templateId, slug: typeSlug })
    .select('id', 'slug', 'name', 'single_template')
    .first();

  if (!postType) return null;

  // Parse single_template if string
  if (typeof postType.single_template === 'string') {
    try { postType.single_template = JSON.parse(postType.single_template); } catch { postType.single_template = []; }
  }

  // Look up published post
  const post = await db('posts')
    .where({
      project_id: projectId,
      post_type_id: postType.id,
      slug: postSlug,
      status: 'published',
    })
    .select(
      'id', 'title', 'slug', 'content', 'excerpt', 'featured_image',
      'custom_fields', 'created_at', 'updated_at', 'published_at'
    )
    .first();

  if (!post) return null;

  // Enrich with categories and tags
  const [catRows, tagRows] = await Promise.all([
    db('post_category_assignments')
      .join('post_categories', 'post_category_assignments.category_id', 'post_categories.id')
      .where('post_category_assignments.post_id', post.id)
      .select('post_categories.name'),
    db('post_tag_assignments')
      .join('post_tags', 'post_tag_assignments.tag_id', 'post_tags.id')
      .where('post_tag_assignments.post_id', post.id)
      .select('post_tags.name'),
  ]);

  post.categories = catRows.map((r: any) => r.name).join(', ');
  post.tags = tagRows.map((r: any) => r.name).join(', ');

  const result: SinglePostResult = { postType, post };

  try {
    await redis.set(cacheKey, JSON.stringify(result), 'EX', SINGLE_POST_TTL);
  } catch {
    // Cache write failure is non-fatal
  }

  return result;
}
