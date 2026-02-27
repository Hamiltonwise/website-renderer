import { Request, Response } from 'express';
import { getProjectByHostname } from '../services/project.service';
import { getDb } from '../lib/db';

export async function verifyDomainRoute(req: Request, res: Response): Promise<void> {
  const domain = req.query.domain as string;

  if (!domain) {
    res.status(400).end();
    return;
  }

  // Check if it's a *.sites.getalloro.com subdomain
  const subdomainMatch = domain.match(/^([^.]+)\.sites\./);
  if (subdomainMatch) {
    const project = await getProjectByHostname(subdomainMatch[1]);
    if (project) {
      res.status(200).end();
      return;
    }
    res.status(404).end();
    return;
  }

  // Check if it's a verified custom domain (primary or alt)
  const project = await getDb()('projects')
    .where(function () {
      this.where('custom_domain', domain).orWhere('custom_domain_alt', domain);
    })
    .whereNotNull('domain_verified_at')
    .first();

  if (project) {
    res.status(200).end();
    return;
  }

  res.status(404).end();
}
