'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutTemplate,
  Plus,
  Pencil,
  FileText,
  Globe,
} from 'lucide-react';
import type { Template } from '@/types';

interface TemplatesClientProps {
  templates: Template[];
}

export function TemplatesClient({ templates }: TemplatesClientProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
              <LayoutTemplate className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-600 font-light">Manage website templates</p>
            </div>
          </div>
          <Link
            href="/templates/new"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/30"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </Link>
        </motion.div>

        {templates.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <LayoutTemplate className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 font-light max-w-md mx-auto mb-6">
              Create your first template to define the HTML structure for generated websites.
            </p>
            <Link
              href="/templates/new"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/30"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </Link>
          </motion.div>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/templates/${template.id}/edit`}
                  className="block bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] hover:border-brand-200"
                >
                  {/* Preview Thumbnail */}
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                    <iframe
                      srcDoc={template.html_template || '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;color:#999;font-family:system-ui;">No content yet</body></html>'}
                      className="w-full h-full pointer-events-none transform scale-50 origin-top-left"
                      style={{ width: '200%', height: '200%' }}
                      title={`Preview of ${template.name}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      {template.status === 'draft' ? (
                        <div className="flex items-center gap-1.5 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          <FileText className="w-3 h-3" />
                          Draft
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          <Globe className="w-3 h-3" />
                          Published
                        </div>
                      )}
                    </div>
                    {/* Edit overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg">
                        <Pencil className="w-4 h-4 text-brand-600" />
                        <span className="font-medium text-gray-900">Edit Template</span>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-500">
                      {template.html_template ? `Created ${formatDate(template.created_at)}` : 'Draft - No content yet'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
