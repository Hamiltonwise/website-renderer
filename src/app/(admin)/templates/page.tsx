import { getAllTemplates } from '@/lib/services/template.service';
import { TemplatesClient } from './templates-client';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const templates = await getAllTemplates();
  return <TemplatesClient templates={templates} />;
}
