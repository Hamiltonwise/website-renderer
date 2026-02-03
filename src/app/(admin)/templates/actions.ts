'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  setActiveTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  publishTemplate,
  unpublishTemplate,
} from '@/lib/services/template.service';

export async function setActiveTemplateAction(templateId: string) {
  const template = await setActiveTemplate(templateId);
  revalidatePath('/templates');
  return template;
}

export async function createTemplateAction(
  name: string,
  htmlTemplate: string,
  isActive: boolean = false
) {
  const template = await createTemplate(name, htmlTemplate, isActive);
  revalidatePath('/templates');
  return template;
}

export async function createDraftTemplateAction(name: string) {
  // Create template with empty content as draft
  const template = await createTemplate(name, '', false);
  return template;
}

export async function updateTemplateContentAction(
  templateId: string,
  htmlContent: string
) {
  const template = await updateTemplate(templateId, { html_template: htmlContent });
  revalidatePath('/templates');
  revalidatePath(`/templates/${templateId}`);
  return template;
}

export async function publishTemplateAction(templateId: string) {
  // Publish the template (change status to 'published')
  const template = await publishTemplate(templateId);
  revalidatePath('/templates');
  return template;
}

export async function unpublishTemplateAction(templateId: string) {
  const template = await unpublishTemplate(templateId);
  revalidatePath('/templates');
  revalidatePath(`/templates/${templateId}`);
  return template;
}

export async function renameTemplateAction(
  templateId: string,
  newName: string
) {
  const template = await updateTemplate(templateId, { name: newName });
  revalidatePath('/templates');
  revalidatePath(`/templates/${templateId}`);
  return template;
}

export async function deleteTemplateAction(templateId: string) {
  await deleteTemplate(templateId);
  revalidatePath('/templates');
  redirect('/templates');
}
