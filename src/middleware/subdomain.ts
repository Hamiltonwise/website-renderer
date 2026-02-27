import { Request, Response, NextFunction } from 'express';

export function extractSubdomain(req: Request, res: Response, next: NextFunction): void {
  const host = req.headers.host || '';

  // Check for *.sites.* subdomain pattern
  const siteMatch = host.match(/^([^.]+)\.sites\./);

  if (siteMatch) {
    res.locals.hostname = siteMatch[1];
    next();
    return;
  }

  // Treat as custom domain — strip port if present
  const customDomain = host.split(':')[0];
  res.locals.customDomain = customDomain;
  next();
}
