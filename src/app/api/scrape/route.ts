import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapeResponse {
  success: boolean;
  baseUrl: string;
  pages: Record<string, string>; // pageName: htmlContent
  images: string[]; // max 10 random images
  error?: string;
}

/**
 * Normalize URL to absolute
 */
function toAbsoluteUrl(href: string, baseUrl: string): string | null {
  try {
    // Skip non-http links
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
      return null;
    }
    const url = new URL(href, baseUrl);
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Check if URL is internal (same domain)
 */
function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);
    return urlObj.hostname === baseObj.hostname;
  } catch {
    return false;
  }
}

/**
 * Extract page name from URL
 */
function getPageName(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    if (path === '/' || path === '') {
      return 'home';
    }

    // Remove leading/trailing slashes and get last segment
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'page';

    // Remove file extensions
    return lastSegment.replace(/\.(html?|php|aspx?)$/i, '').toLowerCase();
  } catch {
    return 'page';
  }
}

/**
 * Fetch a page and return its HTML
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlloroBot/1.0; +https://getalloro.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`[Scrape] Failed to fetch ${url}:`, error);
    return null;
  }
}

/**
 * Extract internal links from HTML
 */
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const absoluteUrl = toAbsoluteUrl(href, baseUrl);
    if (absoluteUrl && isInternalUrl(absoluteUrl, baseUrl)) {
      // Clean up URL (remove hash, query params for deduplication)
      try {
        const urlObj = new URL(absoluteUrl);
        urlObj.hash = '';
        // Keep some query params but remove tracking ones
        const cleanUrl = urlObj.origin + urlObj.pathname;
        links.add(cleanUrl);
      } catch {
        // Skip invalid URLs
      }
    }
  });

  return Array.from(links);
}

/**
 * Extract images from HTML
 */
function extractImages(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const images = new Set<string>();

  // Get images from img tags
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      const absoluteUrl = toAbsoluteUrl(src, baseUrl);
      if (absoluteUrl && isValidImageUrl(absoluteUrl)) {
        images.add(absoluteUrl);
      }
    }
  });

  // Also check srcset
  $('img[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      // Parse srcset (format: "url1 1x, url2 2x" or "url1 100w, url2 200w")
      const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
      urls.forEach(url => {
        const absoluteUrl = toAbsoluteUrl(url, baseUrl);
        if (absoluteUrl && isValidImageUrl(absoluteUrl)) {
          images.add(absoluteUrl);
        }
      });
    }
  });

  // Check background images in style attributes
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const urlMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (urlMatch && urlMatch[1]) {
      const absoluteUrl = toAbsoluteUrl(urlMatch[1], baseUrl);
      if (absoluteUrl && isValidImageUrl(absoluteUrl)) {
        images.add(absoluteUrl);
      }
    }
  });

  return Array.from(images);
}

/**
 * Check if URL looks like a valid image
 */
function isValidImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const lowercaseUrl = url.toLowerCase();

  // Check extension
  if (imageExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return true;
  }

  // Also allow URLs with image-related paths
  if (lowercaseUrl.includes('/images/') || lowercaseUrl.includes('/img/') || lowercaseUrl.includes('/media/')) {
    return true;
  }

  return false;
}

/**
 * Shuffle array and take first n items
 */
function getRandomItems<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize base URL
    let baseUrl: string;
    try {
      const urlObj = new URL(url);
      baseUrl = urlObj.origin;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400 }
      );
    }

    console.log('[Scrape] Starting scrape for:', baseUrl);

    // Fetch home page
    const homeHtml = await fetchPage(url);
    if (!homeHtml) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch home page' },
        { status: 500 }
      );
    }

    // Extract internal links from home page
    const internalLinks = extractInternalLinks(homeHtml, baseUrl);
    console.log('[Scrape] Found internal links:', internalLinks.length);

    // Collect pages and images
    const pages: Record<string, string> = {};
    const allImages: string[] = [];

    // Add home page
    pages['home'] = homeHtml;
    allImages.push(...extractImages(homeHtml, baseUrl));

    // Fetch linked pages (limit to 10 to avoid too many requests)
    const linksToFetch = internalLinks.slice(0, 10);

    await Promise.all(
      linksToFetch.map(async (link) => {
        const html = await fetchPage(link);
        if (html) {
          const pageName = getPageName(link);
          // Avoid overwriting if we already have a page with this name
          const uniqueName = pages[pageName] ? `${pageName}-${Date.now()}` : pageName;
          pages[uniqueName] = html;
          allImages.push(...extractImages(html, baseUrl));
        }
      })
    );

    // Deduplicate images and get random 10
    const uniqueImages = [...new Set(allImages)];
    const randomImages = getRandomItems(uniqueImages, 10);

    console.log('[Scrape] Scraped pages:', Object.keys(pages).length);
    console.log('[Scrape] Total unique images:', uniqueImages.length);
    console.log('[Scrape] Returning random images:', randomImages.length);

    const response: ScrapeResponse = {
      success: true,
      baseUrl,
      pages,
      images: randomImages,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scrape] Error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
