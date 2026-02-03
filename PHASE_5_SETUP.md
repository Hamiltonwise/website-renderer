# Phase 5 — n8n Integration Setup Guide

## Environment Variables Required

Add these to your `.env` file:

```env
# Existing
DATABASE_URL=postgresql://...
BASE_DOMAIN=sites.localhost:7777

# Phase 5: n8n Webhooks
N8N_WEBHOOK_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=http://localhost:7777

# n8n workflow webhook URLs (configure these in n8n)
N8N_WEBHOOK_GBP_SCRAPE=https://your-n8n.com/webhook/gbp-scrape
N8N_WEBHOOK_IMAGE_ANALYSIS=https://your-n8n.com/webhook/image-analysis
N8N_WEBHOOK_WEBSITE_SCRAPE=https://your-n8n.com/webhook/website-scrape
N8N_WEBHOOK_HTML_GENERATION=https://your-n8n.com/webhook/html-generation
```

---

## How It Works

### Workflow Chain

1. **User confirms GBP** → Status: `GBP_SELECTED`
2. **App triggers** `GBP_SCRAPE` job → n8n workflow runs
3. **n8n calls back** → `/api/webhooks/n8n/gbp-scrape`
4. **Webhook handler**:
   - Saves GBP data to project
   - Marks job complete
   - Advances status to `GBP_SCRAPED`
   - **Auto-triggers** `IMAGE_ANALYSIS`
5. **Process repeats** for each workflow in the chain

### Webhook Endpoints

Your app exposes these endpoints for n8n to call:

- `POST /api/webhooks/n8n/gbp-scrape`
- `POST /api/webhooks/n8n/image-analysis`
- `POST /api/webhooks/n8n/website-scrape`
- `POST /api/webhooks/n8n/html-generation`

All require `x-webhook-secret` header matching `N8N_WEBHOOK_SECRET`.

---

## Request Format (App → n8n)

When triggering a workflow, the app sends:

```json
{
  "projectId": "project-uuid",
  "jobId": "job-uuid",
  "callbackUrl": "http://localhost:7777/api/webhooks/n8n/gbp-scrape",
  ...additionalPayload
}
```

---

## Response Format (n8n → App)

n8n should POST back to `callbackUrl` with:

```json
{
  "projectId": "project-uuid",
  "jobId": "job-uuid",
  "success": true,
  "data": {
    // Workflow-specific results
  },
  "error": null
}
```

---

## Testing Without n8n

### Option 1: Mock Webhook Simulator

Create a test endpoint to simulate n8n responses:

```bash
curl -X POST http://localhost:7777/api/webhooks/n8n/gbp-scrape \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret-key-here" \
  -d '{
    "projectId": "your-project-id",
    "jobId": "your-job-id",
    "success": true,
    "data": {
      "businessName": "Test Business",
      "address": "123 Main St",
      "phone": "(555) 123-4567",
      "category": "Restaurant",
      "photos": []
    }
  }'
```

### Option 2: Create Test API Route

I can add a `/api/test/simulate-webhook` endpoint that automatically completes workflows for testing.

---

## Production Setup

### In n8n:

1. Create 4 workflows (GBP Scrape, Image Analysis, Website Scrape, HTML Generation)
2. Each workflow:
   - Receives webhook trigger
   - Performs the work (scrape, analyze, generate)
   - POSTs results back to your app's callback URL
   - Includes `x-webhook-secret` header

### In Your App:

1. Set all environment variables
2. Deploy to production
3. Update `NEXT_PUBLIC_APP_URL` to your production URL
4. Test the full flow end-to-end

---

## Next Steps

**Phase 6**: Versioning & Publishing Logic
**Phase 7**: UX Copy & Guardrails

---

**Phase 5 is ready!** The infrastructure is in place. You just need to:
1. Set up n8n workflows
2. Configure environment variables
3. Test the webhook flow

