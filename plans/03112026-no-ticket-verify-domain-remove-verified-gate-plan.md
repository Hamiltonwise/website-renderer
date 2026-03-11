# Remove domain_verified_at Gate from verify-domain Route

**Date:** 2026-03-11
**Ticket:** no-ticket
**Tier:** Minor Change

## Problem Statement

The `verify-domain` route requires `domain_verified_at IS NOT NULL` before approving a domain for cert provisioning. This creates a chicken-and-egg deadlock:

1. Caddy asks verify-domain "should I issue a cert for this domain?"
2. verify-domain says "no" because `domain_verified_at` is NULL
3. No cert gets issued, HTTPS never works
4. `domain_verified_at` never gets set because nothing works

## Context Summary

Two places gate on `domain_verified_at`:

- `src/routes/verify-domain.ts:30` — inline query used by Caddy for cert provisioning decisions. **This is the deadlock.**
- `src/services/project.service.ts:19` — `getProjectByCustomDomain()` used by `site.ts:219` for site rendering. **This should stay** — site rendering should still require verification.

The domain existing in the `projects` table as `custom_domain` or `custom_domain_alt` is already sufficient proof for cert provisioning. Only domains explicitly added by users exist in those columns.

## Existing Patterns to Follow

- The subdomain path (lines 14-22 in verify-domain.ts) already uses `getProjectByHostname` without a `domain_verified_at` check — just existence in DB.
- The custom domain path should follow the same trust model for cert provisioning.

## Proposed Approach

Remove `.whereNotNull('domain_verified_at')` from `src/routes/verify-domain.ts` line 30.

Before:
```ts
const project = await getDb()('projects')
  .where(function () {
    this.where('custom_domain', domain).orWhere('custom_domain_alt', domain);
  })
  .whereNotNull('domain_verified_at')
  .first();
```

After:
```ts
const project = await getDb()('projects')
  .where(function () {
    this.where('custom_domain', domain).orWhere('custom_domain_alt', domain);
  })
  .first();
```

No other files changed. Update comment on line 25 to reflect the new behavior.

## Risk Analysis

**Level 1 — Suggestion.** Minimal risk.

- **Abuse vector:** None opened. A domain must be explicitly added to a project's `custom_domain` or `custom_domain_alt` column by a user. Random domains cannot trigger cert issuance.
- **Site rendering:** Unaffected. `getProjectByCustomDomain()` in `project.service.ts` still gates on `domain_verified_at`. Sites won't render on custom domains until verified — only the cert gets provisioned earlier.
- **Rollback:** Trivial — re-add the one line.

## Definition of Done

- [ ] `.whereNotNull('domain_verified_at')` removed from `src/routes/verify-domain.ts`
- [ ] Comment on line 25 updated to reflect that we check domain existence, not verification status
- [ ] Build succeeds
- [ ] `getProjectByCustomDomain()` in `project.service.ts` remains unchanged
