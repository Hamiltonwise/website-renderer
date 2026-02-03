'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutTemplate, ArrowRight, Loader2 } from 'lucide-react';
import { createDraftTemplateAction } from '../actions';

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const template = await createDraftTemplateAction(name.trim());
      // Redirect to the editor page with the template ID
      router.push(`/templates/${template.id}/edit`);
    } catch {
      setError('Failed to create template');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center mx-auto mb-6">
            <LayoutTemplate className="w-8 h-8 text-brand-500" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Create New Template
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Give your template a name to get started
          </p>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Modern Business Template"
              disabled={isCreating}
              autoFocus
              className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none font-medium placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl px-6 py-4 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 shadow-lg shadow-brand-500/30 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing Editor...
              </>
            ) : (
              <>
                Continue to Editor
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Back Link */}
          <p className="text-center mt-6">
            <a
              href="/templates"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Cancel and go back
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
