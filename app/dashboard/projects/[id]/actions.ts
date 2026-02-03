'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { confirmGbpSelection as confirmGbp, deleteProject } from '@/lib/services/project.service';
import type { SelectedGBP } from '@/lib/services/gbp.service';

/**
 * Server action to confirm GBP selection and trigger n8n pipeline
 */
export async function confirmGbpSelection(
  projectId: string,
  gbpData: SelectedGBP,
  websiteUrl: string | null
) {
  // Read env var at runtime
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_START_PIPELINE;

  console.log('[Action] n8n webhook URL:', n8nWebhookUrl ? 'configured' : 'NOT configured');

  // Check if n8n webhook is configured
  if (!n8nWebhookUrl) {
    console.error('[Action] N8N_WEBHOOK_START_PIPELINE not configured');
    return {
      success: false,
      error: 'Pipeline not configured. Please set N8N_WEBHOOK_START_PIPELINE environment variable.',
    };
  }

  // First, verify the n8n webhook is reachable by triggering it
  // Only save to DB if webhook succeeds
  try {
    console.log('[Action] Calling n8n webhook:', n8nWebhookUrl);
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        placeId: gbpData.placeId,
        websiteUrl,
        // Full business info for n8n
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
      console.error('[Action] n8n webhook failed:', response.status);
      return {
        success: false,
        error: `Pipeline failed to start (status ${response.status}). Please try again.`,
      };
    }

    console.log('[Action] n8n pipeline triggered successfully');
  } catch (error: any) {
    console.error('[Action] Failed to reach n8n webhook:', error.message);
    return {
      success: false,
      error: 'Could not reach the pipeline. Please check your connection and try again.',
    };
  }

  // n8n webhook succeeded, now save to database
  try {
    await confirmGbp(projectId, gbpData.placeId, websiteUrl);
    console.log('[Action] GBP confirmed for project:', projectId);

    // Revalidate the project page
    revalidatePath(`/dashboard/projects/${projectId}`);

    return { success: true };
  } catch (error: any) {
    console.error('[Action] Error saving GBP selection:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Server action to delete a project
 */
export async function deleteProjectAction(projectId: string) {
  await deleteProject(projectId);

  console.log('[Action] Deleted project:', projectId);

  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects');
}
