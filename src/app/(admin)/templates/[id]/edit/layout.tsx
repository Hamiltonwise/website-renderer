import { notFound } from 'next/navigation';
import { getTemplateById } from '@/lib/services/template.service';
import { TemplateEditorSidebar } from './template-editor-sidebar';

export const dynamic = 'force-dynamic';

interface TemplateEditLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function TemplateEditLayout({ children, params }: TemplateEditLayoutProps) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <TemplateEditorSidebar template={template} />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
