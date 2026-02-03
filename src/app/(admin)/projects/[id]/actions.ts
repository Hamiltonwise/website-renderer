'use server';

import { revalidatePath } from 'next/cache';
import { confirmGbpSelection } from '@/lib/services/project.service';
import type { SelectedGBP } from '@/types';

export async function confirmGbpSelectionAction(
  projectId: string,
  gbpData: SelectedGBP,
  templateId: string
) {
  // 1. Save to database
  const project = await confirmGbpSelection(
    projectId,
    gbpData.placeId,
    gbpData.websiteUri
  );

  // 2. Trigger n8n webhook to start the pipeline
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_START_PIPELINE;

  if (n8nWebhookUrl) {
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          templateId,
          placeId: gbpData.placeId,
          websiteUrl: gbpData.websiteUri,
          practiceSearchString: gbpData.practiceSearchString,
          businessName: gbpData.name,
          formattedAddress: gbpData.formattedAddress,
          city: gbpData.city,
          state: gbpData.state,
          phone: gbpData.phone,
          category: gbpData.category,
          rating: gbpData.rating,
          reviewCount: gbpData.reviewCount,
        }),
      });

      if (!response.ok) {
        console.error('[n8n Webhook] Failed to trigger pipeline:', response.statusText);
      } else {
        console.log('[n8n Webhook] Pipeline triggered successfully');
      }
    } catch (error) {
      console.error('[n8n Webhook] Error triggering pipeline:', error);
      // Don't throw - we still want the GBP selection to be saved even if webhook fails
    }
  } else {
    console.warn('[n8n Webhook] N8N_WEBHOOK_START_PIPELINE not configured');
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
  return project;
}
