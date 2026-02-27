# Custom Domain Support in Subdomain Middleware & Site Route

## Problem Statement
The `extractSubdomain` middleware returns 404 for any request that doesn't match `*.sites.*`. Custom domains (e.g., `www.mydentaloffice.com`) will never reach the site route.

## Context Summary
- Middleware sets `res.locals.hostname` for subdomain lookups
- Site route calls `getProjectByHostname(res.locals.hostname)` to find the project
- `projects` table has `custom_domain` (VARCHAR UNIQUE) and `domain_verified_at` (TIMESTAMP)
- Caddy will forward both subdomain and custom domain requests to port 7777

## Existing Patterns to Follow
- Middleware in `/src/middleware/`
- Services in `/src/services/`
- Route handler pattern in `/src/routes/site.ts`

## Proposed Approach

### 1. Update `extractSubdomain` middleware
- If `*.sites.*` matches → set `res.locals.hostname` (unchanged)
- If no match → set `res.locals.customDomain` to the host (stripped of port)
- Call `next()` in both cases — no more 404 in middleware

### 2. Add `getProjectByCustomDomain()` to `project.service.ts`
- `SELECT * FROM projects WHERE custom_domain = ? AND domain_verified_at IS NOT NULL`

### 3. Update `siteRoute` in `site.ts`
- If `res.locals.hostname` exists → look up by `generated_hostname` (existing path)
- Else if `res.locals.customDomain` exists → look up by `custom_domain`
- Else → 404

## Risk Analysis
Level 1 — Existing subdomain flow is untouched. Custom domain is an additive code path.

## Definition of Done
- `*.sites.getalloro.com` requests work exactly as before
- Custom domain requests resolve to the correct project via `custom_domain` column
- Unrecognized custom domains get 404
