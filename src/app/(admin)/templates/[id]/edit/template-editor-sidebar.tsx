'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Code,
  ExternalLink,
  Settings,
  FileText,
  Globe,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import type { Template } from '@/types';

interface TemplateEditorSidebarProps {
  template: Template;
}

export function TemplateEditorSidebar({ template }: TemplateEditorSidebarProps) {
  const handleOpenPreview = () => {
    // Open preview in new window
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    if (previewWindow) {
      previewWindow.document.write(template.html_template || DEFAULT_PREVIEW_HTML);
      previewWindow.document.close();
    }
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full lg:w-72 flex-shrink-0"
    >
      {/* Back Link */}
      <Link
        href="/templates"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Templates
      </Link>

      {/* Template Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4 mb-4">
        <h2 className="font-semibold text-gray-900 truncate">{template.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          {template.status === 'draft' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
              <FileText className="w-3 h-3" />
              Draft
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
              <Globe className="w-3 h-3" />
              Published
            </span>
          )}
          {template.is_active && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-brand-100 text-brand-700">
              <Star className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white rounded-2xl border border-gray-100 shadow-lg p-2">
        <Link
          href={`/templates/${template.id}/edit`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-brand-50 text-brand-600"
        >
          <Code className="w-5 h-5" />
          <span>Editor</span>
        </Link>
        <button
          onClick={handleOpenPreview}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <ExternalLink className="w-5 h-5" />
          <span>Full Preview</span>
        </button>
        <Link
          href={`/templates/${template.id}/settings`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </motion.aside>
  );
}

const DEFAULT_PREVIEW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Preview</title>
</head>
<body style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; color: #666;">
  <p>No content yet. Start editing to see preview.</p>
</body>
</html>
`;
