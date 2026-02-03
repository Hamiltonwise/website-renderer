/**
 * Get the full URL for a site based on its hostname
 *
 * Local: http://{name}.sites.localhost:7777
 * Production: https://{name}.sites.getalloro.com
 */
export function getSiteUrl(hostname: string): string {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return `https://${hostname}.sites.getalloro.com`;
  }

  return `http://${hostname}.sites.localhost:7777`;
}

/**
 * Get just the site domain (without protocol)
 */
export function getSiteDomain(hostname: string): string {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return `${hostname}.sites.getalloro.com`;
  }

  return `${hostname}.sites.localhost:7777`;
}
