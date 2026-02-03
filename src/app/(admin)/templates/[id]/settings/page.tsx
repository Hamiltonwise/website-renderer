import { notFound } from 'next/navigation';
import { getTemplateById } from '@/lib/services/template.service';
import { TemplateSettingsClient } from './template-settings-client';

export const dynamic = 'force-dynamic';

interface TemplateSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateSettingsPage({ params }: TemplateSettingsPageProps) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return <TemplateSettingsClient template={template} />;
}
