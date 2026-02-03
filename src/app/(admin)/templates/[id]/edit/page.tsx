import { notFound } from 'next/navigation';
import { getTemplateById } from '@/lib/services/template.service';
import { TemplateEditorClient } from './template-editor-client';

export const dynamic = 'force-dynamic';

interface TemplateEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return <TemplateEditorClient template={template} />;
}
