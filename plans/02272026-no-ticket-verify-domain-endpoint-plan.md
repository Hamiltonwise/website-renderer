# Verify Domain Endpoint for Caddy On-Demand TLS

## Problem Statement
Caddy's on-demand TLS is configured to call `GET http://localhost:7777/verify-domain?domain=<domain>` before provisioning SSL certificates. This endpoint does not exist yet. Without it, Caddy will fail to issue certs for any domain.

## Context Summary
- Caddy is running on the renderer server, configured with `on_demand_tls { ask http://localhost:7777/verify-domain }`
- The Express renderer currently only handles `*.sites.getalloro.com` subdomains via the `extractSubdomain` middleware
- The `extractSubdomain` middleware returns 404 for any request that doesn't match `*.sites.*` — this means the `/verify-domain` route must be registered BEFORE the middleware
- `projects` table has `generated_hostname` (for subdomains) and `custom_domain` + `domain_verified_at` (for custom domains)

## Existing Patterns to Follow
- Routes in `/src/routes/`
- DB queries via Knex in `/src/services/project.service.ts`
- Express route registration in `/src/index.ts`

## Proposed Approach

### 1. Add `getProjectByCustomDomain` to `project.service.ts`
- Query: `SELECT 1 FROM projects WHERE custom_domain = ? AND domain_verified_at IS NOT NULL`

### 2. Create `/src/routes/verify-domain.ts`
- `GET /verify-domain?domain=<domain>`
- If domain matches `*.sites.getalloro.com` pattern → extract hostname → check `generated_hostname` exists → 200 or 404
- If domain doesn't match subdomain pattern → check `custom_domain` where `domain_verified_at IS NOT NULL` → 200 or 404
- Returns 200 (empty body) for valid, 404 for invalid

### 3. Register route in `index.ts` BEFORE `extractSubdomain` middleware
- Critical: the subdomain middleware 404s non-matching hosts, so `/verify-domain` must be registered first

## Risk Analysis
Level 1 — Minor addition. No existing behavior affected. The route is only called by Caddy internally (port 7777 not exposed publicly).

## Definition of Done
- `/verify-domain?domain=x.sites.getalloro.com` returns 200 if `generated_hostname = x` exists
- `/verify-domain?domain=custom.com` returns 200 if `custom_domain = custom.com` AND `domain_verified_at IS NOT NULL`
- `/verify-domain?domain=unknown.com` returns 404
- Route is registered before subdomain middleware
