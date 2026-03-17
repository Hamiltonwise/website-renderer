/**
 * Redirect Service
 *
 * Resolves URL redirects for a project. Exact matches take priority
 * over wildcard matches. Longest wildcard prefix wins.
 */

import { getDb } from '../lib/db';
import { getRedis } from '../lib/redis';

const TABLE = 'website_builder.redirects';
const CACHE_TTL = 300; // 5 minutes

interface Redirect {
  from_path: string;
  to_path: string;
  type: number;
  is_wildcard: boolean;
}

function normalizePath(p: string): string {
  let normalized = p.trim();
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (normalized.length > 1 && normalized.endsWith('/') && !normalized.endsWith('*/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * Resolve a redirect for the given project + path.
 * Returns null if no redirect matches.
 */
export async function resolveRedirect(
  projectId: string,
  requestPath: string
): Promise<{ to_path: string; type: number } | null> {
  const normalizedPath = normalizePath(requestPath);

  // Try Redis cache first
  const redis = getRedis();
  const cacheKey = `redir:${projectId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const redirects: Redirect[] = JSON.parse(cached);
      return matchRedirect(redirects, normalizedPath);
    }
  } catch {
    // Cache miss or error, fall through to DB
  }

  // Fetch all redirects for this project from DB
  const db = getDb();
  const redirects: Redirect[] = await db(TABLE)
    .where('project_id', projectId)
    .select('from_path', 'to_path', 'type', 'is_wildcard');

  // Cache for next lookup
  try {
    await redis.set(cacheKey, JSON.stringify(redirects), 'EX', CACHE_TTL);
  } catch {
    // Non-fatal
  }

  return matchRedirect(redirects, normalizedPath);
}

function matchRedirect(
  redirects: Redirect[],
  normalizedPath: string
): { to_path: string; type: number } | null {
  // 1. Exact match first
  const exact = redirects.find((r) => !r.is_wildcard && r.from_path === normalizedPath);
  if (exact) {
    return { to_path: exact.to_path, type: exact.type };
  }

  // 2. Wildcard matches — longest prefix wins
  const wildcards = redirects
    .filter((r) => r.is_wildcard)
    .sort((a, b) => b.from_path.length - a.from_path.length);

  for (const wc of wildcards) {
    const prefix = wc.from_path.replace(/\*$/, '').replace(/\/$/, '');
    if (normalizedPath === prefix || normalizedPath.startsWith(prefix + '/')) {
      return { to_path: wc.to_path, type: wc.type };
    }
  }

  return null;
}
