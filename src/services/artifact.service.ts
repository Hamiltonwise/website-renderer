/**
 * Artifact Service
 *
 * Fetches artifact page files from S3 via public URLs.
 * Used by the renderer to serve React app builds hosted as artifact pages.
 */

import path from 'path';

/**
 * Build the public S3 URL for an artifact file.
 * Reads env vars at call time (not module load) because dotenv.config()
 * runs after ES module imports are hoisted.
 */
function buildArtifactUrl(s3Prefix: string, filePath: string): string {
  const bucket = process.env.AWS_S3_IMPORTS_BUCKET || 'alloro-imports';
  const region = process.env.AWS_S3_IMPORTS_REGION || 'us-east-1';
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Prefix}/${filePath}`;
  console.log(`[Artifact] Fetching: ${url}`);
  return url;
}

/**
 * MIME type lookup for common build output files.
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.map': 'application/json',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.webmanifest': 'application/manifest+json',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Fetch the index.html content for an artifact page.
 */
export async function fetchArtifactIndexHtml(s3Prefix: string): Promise<string> {
  const url = buildArtifactUrl(s3Prefix, 'index.html');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch artifact index.html from S3: ${response.status}`);
  }
  return response.text();
}

/**
 * Fetch an artifact sub-asset and return its buffer + content type.
 * Returns null if the file doesn't exist in S3.
 */
export async function fetchArtifactAsset(
  s3Prefix: string,
  subPath: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const url = buildArtifactUrl(s3Prefix, subPath);
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 403 || response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch artifact asset from S3: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: getContentType(subPath),
  };
}
