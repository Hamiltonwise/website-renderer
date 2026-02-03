'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Calendar,
  Hash,
  FileText,
} from 'lucide-react';
import type { Template } from '@/types';
import { renameTemplateAction, deleteTemplateAction, publishTemplateAction, unpublishTemplateAction } from '../../actions';

interface TemplateSettingsClientProps {
  template: Template;
}

export function TemplateSettingsClient({ template: initialTemplate }: TemplateSettingsClientProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [newName, setNewName] = useState(template.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      setError('Template name is required');
      return;
    }

    if (newName.trim() === template.name) {
      return;
    }

    setIsRenaming(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedTemplate = await renameTemplateAction(template.id, newName.trim());
      setTemplate(updatedTemplate);
      setSuccess('Template renamed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to rename template');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleTogglePublish = async () => {
    setIsTogglingPublish(true);
    setError(null);
    setSuccess(null);

    try {
      let updatedTemplate;
      if (template.status === 'draft') {
        updatedTemplate = await publishTemplateAction(template.id);
        setSuccess('Template published successfully');
      } else {
        updatedTemplate = await unpublishTemplateAction(template.id);
        setSuccess('Template unpublished');
      }
      setTemplate(updatedTemplate);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(`Failed to ${template.status === 'draft' ? 'publish' : 'unpublish'} template`);
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== template.name) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteTemplateAction(template.id);
      // Redirect happens in the action
    } catch {
      setError('Failed to delete template');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
          <Settings className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Settings</h1>
          <p className="text-gray-600">Manage your template configuration</p>
        </div>
      </motion.div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Template Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h2>
        <div className="space-y-4">
          {/* Publication Status */}
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            {template.status === 'draft' ? (
              <FileText className="w-5 h-5 text-yellow-500" />
            ) : (
              <Globe className="w-5 h-5 text-green-500" />
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-500">Publication Status</p>
              <p className="font-medium">
                {template.status === 'draft' ? (
                  <span className="text-yellow-600">Draft</span>
                ) : (
                  <span className="text-green-600">Published</span>
                )}
              </p>
            </div>
            <button
              onClick={handleTogglePublish}
              disabled={isTogglingPublish}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors disabled:cursor-not-allowed ${
                template.status === 'draft'
                  ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700'
              }`}
            >
              {isTogglingPublish ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : template.status === 'draft' ? (
                <>
                  <Globe className="w-4 h-4" />
                  Publish
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Unpublish
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <Hash className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Template ID</p>
              <p className="font-mono text-sm text-gray-900">{template.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-900">{formatDate(template.created_at)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rename Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Pencil className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Rename Template</h2>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isRenaming}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none font-medium disabled:bg-gray-50"
            />
          </div>
          <button
            onClick={handleRename}
            disabled={isRenaming || newName.trim() === template.name || !newName.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isRenaming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border-2 border-red-200 shadow-lg overflow-hidden"
      >
        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Delete this template</h3>
              <p className="text-gray-600 text-sm">
                Once you delete a template, there is no going back. This will permanently delete the
                template and it will no longer be available for new projects.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 font-medium transition-all flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Template
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-6 border-t border-red-200"
            >
              <div className="bg-red-50 rounded-xl p-4 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. This will permanently
                  delete the <strong>{template.name}</strong> template.
                </p>
              </div>

              <label className="block mb-2">
                <span className="text-gray-700 text-sm font-medium">
                  Please type <strong className="font-mono">{template.name}</strong> to confirm:
                </span>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={template.name}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none font-mono text-sm mb-4"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== template.name || isDeleting}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl px-6 py-3 font-semibold transition-all disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      I understand, delete this template
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                  className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
