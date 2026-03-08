/**
 * SEO Service
 *
 * Fetches business data (org-level + location-level) for SEO meta injection.
 * Cached in Redis with 10-min TTL — business data changes infrequently.
 */

import { getDb } from '../lib/db';
import { getRedis } from '../lib/redis';

const BUSINESS_DATA_TTL = 600; // 10 minutes

export interface BusinessData {
  organization: {
    name?: string;
    description?: string;
    logo_url?: string;
    social_profiles?: Record<string, string>;
    specialties?: string[];
  } | null;
  location: {
    name?: string;
    address?: {
      street?: string;
      suite?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
    phone?: string;
    website?: string;
    coordinates?: { lat: number; lng: number };
    hours?: Record<string, { open: string; close: string } | null>;
    categories?: string[];
    place_id?: string;
  } | null;
}

/**
 * Fetch business data for SEO injection based on page's location_context.
 *
 * @param organizationId - The project's organization_id
 * @param locationContext - "organization" for org-wide, or a numeric location_id string
 */
export async function fetchBusinessData(
  organizationId: number | null,
  locationContext: string | null | undefined
): Promise<BusinessData | null> {
  if (!organizationId) return null;
  if (!locationContext) return null;

  const cacheKey = `seo-bd:${organizationId}:${locationContext}`;
  const redis = getRedis();

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache miss
  }

  const db = getDb();

  // Fetch org-level business data (public schema)
  const org = await db('public.organizations')
    .where({ id: organizationId })
    .select('business_data')
    .first();

  let locationData = null;

  if (locationContext !== 'organization') {
    // locationContext is a location_id
    const locationId = parseInt(locationContext, 10);
    if (!isNaN(locationId)) {
      const loc = await db('public.locations')
        .where({ id: locationId, organization_id: organizationId })
        .select('business_data')
        .first();
      if (loc?.business_data) {
        locationData = typeof loc.business_data === 'string'
          ? JSON.parse(loc.business_data)
          : loc.business_data;
      }
    }
  } else {
    // For "organization" context, use primary location
    const primaryLoc = await db('public.locations')
      .where({ organization_id: organizationId, is_primary: true })
      .select('business_data')
      .first();
    if (primaryLoc?.business_data) {
      locationData = typeof primaryLoc.business_data === 'string'
        ? JSON.parse(primaryLoc.business_data)
        : primaryLoc.business_data;
    }
  }

  const orgData = org?.business_data
    ? (typeof org.business_data === 'string' ? JSON.parse(org.business_data) : org.business_data)
    : null;

  const result: BusinessData = {
    organization: orgData,
    location: locationData,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(result), 'EX', BUSINESS_DATA_TTL);
  } catch {
    // Cache write failure is non-fatal
  }

  return result;
}
