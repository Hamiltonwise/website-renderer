/**
 * Shortcode parser for {{ post_block }} tokens.
 *
 * Syntax:
 *   {{ post_block id='slug' items='post-type-slug' [tags='t1,t2'] [cats='c1,c2']
 *      [ids='s1,s2'] [exc_ids='s3'] [order='asc|desc'] [order_by='created_at|title|sort_order|published_at']
 *      [limit='10'] [offset='0'] }}
 */

export interface PostBlockShortcode {
  raw: string;
  id: string;
  items: string;
  tags: string[];
  cats: string[];
  ids: string[];
  exc_ids: string[];
  order: 'asc' | 'desc';
  order_by: 'created_at' | 'title' | 'sort_order' | 'published_at';
  limit: number;
  offset: number;
}

const SHORTCODE_REGEX = /\{\{\s*post_block\s+((?:[a-z_]+='[^']*'\s*)+)\}\}/g;
const ATTR_REGEX = /([a-z_]+)='([^']*)'/g;

const VALID_ORDER_BY = new Set(['created_at', 'title', 'sort_order', 'published_at']);

/**
 * Parse all {{ post_block ... }} shortcodes from an HTML string.
 * Invalid shortcodes (missing required attrs) are skipped — left as raw text.
 */
export function parseShortcodes(html: string): PostBlockShortcode[] {
  const results: PostBlockShortcode[] = [];

  let match: RegExpExecArray | null;
  // Reset regex state
  SHORTCODE_REGEX.lastIndex = 0;

  while ((match = SHORTCODE_REGEX.exec(html)) !== null) {
    const raw = match[0];
    const attrString = match[1];

    const attrs: Record<string, string> = {};
    let attrMatch: RegExpExecArray | null;
    ATTR_REGEX.lastIndex = 0;

    while ((attrMatch = ATTR_REGEX.exec(attrString)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    // Required attributes
    if (!attrs.id || !attrs.items) {
      continue; // Invalid — leave raw token in HTML
    }

    const orderBy = attrs.order_by || 'created_at';

    results.push({
      raw,
      id: attrs.id,
      items: attrs.items,
      tags: attrs.tags ? attrs.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      cats: attrs.cats ? attrs.cats.split(',').map((s) => s.trim()).filter(Boolean) : [],
      ids: attrs.ids ? attrs.ids.split(',').map((s) => s.trim()).filter(Boolean) : [],
      exc_ids: attrs.exc_ids ? attrs.exc_ids.split(',').map((s) => s.trim()).filter(Boolean) : [],
      order: attrs.order === 'desc' ? 'desc' : 'asc',
      order_by: VALID_ORDER_BY.has(orderBy) ? orderBy as PostBlockShortcode['order_by'] : 'created_at',
      limit: attrs.limit ? parseInt(attrs.limit, 10) || 10 : 10,
      offset: attrs.offset ? parseInt(attrs.offset, 10) || 0 : 0,
    });
  }

  return results;
}

/**
 * HTML-escape a string to prevent XSS when injecting post data.
 * Used for all non-content post tokens (title, excerpt, etc.).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Replace {{post.*}} tokens in post block HTML with actual post data.
 * - {{post.content}} is injected as raw HTML (trusted admin content)
 * - All other tokens are HTML-escaped
 */
/**
 * Wrap post content HTML with scoped typography styles so paragraphs,
 * headings, lists, and blockquotes retain proper spacing even when
 * the site's CSS reset strips default margins.
 */
const POST_CONTENT_STYLES = [
  '.alloro-pc{line-height:1.7!important}',
  // Spacing — !important to override site CSS resets
  '.alloro-pc p{display:block!important;margin-bottom:1em!important}',
  '.alloro-pc p:empty,.alloro-pc p:has(> br:only-child){min-height:1em!important}',
  '.alloro-pc h1{display:block!important;font-size:2em!important;font-weight:700!important;margin-top:1.5em!important;margin-bottom:.5em!important}',
  '.alloro-pc h2{display:block!important;font-size:1.5em!important;font-weight:700!important;margin-top:1.5em!important;margin-bottom:.5em!important}',
  '.alloro-pc h3{display:block!important;font-size:1.25em!important;font-weight:600!important;margin-top:1.5em!important;margin-bottom:.5em!important}',
  '.alloro-pc h4{display:block!important;font-size:1.1em!important;font-weight:600!important;margin-top:1.25em!important;margin-bottom:.5em!important}',
  // Lists
  '.alloro-pc ul{display:block!important;list-style-type:disc!important;margin-bottom:1em!important;padding-left:1.5em!important}',
  '.alloro-pc ol{display:block!important;list-style-type:decimal!important;margin-bottom:1em!important;padding-left:1.5em!important}',
  '.alloro-pc li{display:list-item!important;margin-bottom:.25em!important}',
  // Blockquote
  '.alloro-pc blockquote{display:block!important;margin:1em 0!important;padding:0.5em 0 0.5em 1em!important;border-left:3px solid #d1d5db!important;font-style:italic!important;color:#374151!important}',
  '.alloro-pc blockquote p{margin-bottom:.5em!important}',
  // Inline
  '.alloro-pc strong{font-weight:700!important}',
  '.alloro-pc em{font-style:italic!important}',
  '.alloro-pc u{text-decoration:underline!important}',
  '.alloro-pc s{text-decoration:line-through!important}',
  '.alloro-pc a{color:#2563eb!important;text-decoration:underline!important}',
  // Media
  '.alloro-pc img{max-width:100%!important;height:auto!important;margin:.5em 0!important;border-radius:8px}',
  // Horizontal rule
  '.alloro-pc hr{border:none!important;border-top:1px solid #d1d5db!important;margin:2em 0!important}',
].join('');

function wrapPostContent(html: string): string {
  if (!html) return '';
  return `<style>${POST_CONTENT_STYLES}</style><div class="alloro-pc">${html}</div>`;
}

export function renderPostBlockHtml(
  blockHtml: string,
  post: {
    title: string;
    slug: string;
    url: string;
    content: string;
    excerpt: string | null;
    featured_image: string | null;
    custom_fields: Record<string, unknown>;
    categories: string;
    tags: string;
    created_at: string;
    updated_at: string;
    published_at: string;
  }
): string {
  let html = blockHtml
    .replace(/\{\{post\.title\}\}/g, escapeHtml(post.title))
    .replace(/\{\{post\.slug\}\}/g, escapeHtml(post.slug))
    .replace(/\{\{post\.url\}\}/g, escapeHtml(post.url))
    .replace(/\{\{post\.content\}\}/g, wrapPostContent(post.content)) // raw HTML — trusted, wrapped with typography
    .replace(/\{\{post\.excerpt\}\}/g, escapeHtml(post.excerpt || ''))
    .replace(/\{\{post\.featured_image\}\}/g, escapeHtml(post.featured_image || ''))
    .replace(/\{\{post\.categories\}\}/g, escapeHtml(post.categories))
    .replace(/\{\{post\.tags\}\}/g, escapeHtml(post.tags))
    .replace(/\{\{post\.created_at\}\}/g, escapeHtml(post.created_at))
    .replace(/\{\{post\.updated_at\}\}/g, escapeHtml(post.updated_at))
    .replace(/\{\{post\.published_at\}\}/g, escapeHtml(post.published_at));

  // Replace {{post.custom.<slug>}} tokens with custom field values
  html = html.replace(/\{\{post\.custom\.([a-z0-9_]+)\}\}/g, (_match, fieldSlug: string) => {
    const value = post.custom_fields[fieldSlug];
    if (value === undefined || value === null) return '';
    return escapeHtml(String(value));
  });

  return html;
}

/**
 * Check if an HTML string contains any {{ post_block }} shortcodes.
 * Fast check before running the full parser.
 */
export function hasPostBlockShortcodes(html: string): boolean {
  return html.includes('post_block');
}
