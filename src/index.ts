import dotenv from 'dotenv';
dotenv.config();

import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import { siteRoute } from './routes/site';
import { verifyDomainRoute } from './routes/verify-domain';
import { extractSubdomain } from './middleware/subdomain';
import { getDb } from './lib/db';
import { wrapInLayout } from './templates/layout';

const app = express();
const PORT = process.env.PORT || 7777;

// Ignore favicon requests
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Caddy on-demand TLS validation (must be before subdomain middleware)
app.get('/verify-domain', verifyDomainRoute);

// Extract subdomain, then render site
app.use(extractSubdomain);
app.get('*', siteRoute);

// Global error handler — catches DB connection errors, etc.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Renderer Error]', err.message);
  const body = `
<div style="text-align:center;padding:3rem 2rem;max-width:500px;">
  <h1 style="color:#1f2937;font-size:1.5rem;font-weight:700;margin-bottom:1rem;">Something went wrong</h1>
  <p style="color:#6b7280;font-size:1rem;line-height:1.6;">We're having trouble loading this page. Please try again in a moment.</p>
</div>`;
  res.status(500).type('html').send(wrapInLayout('Error', body));
});

const server = app.listen(PORT, () => {
  console.log(`Site renderer listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    getDb().destroy();
    process.exit(0);
  });
});
