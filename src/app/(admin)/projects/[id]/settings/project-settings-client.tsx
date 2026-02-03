'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Trash2,
  AlertTriangle,
  Loader2,
  Globe,
  Calendar,
  Hash,
} from 'lucide-react';
import type { Project } from '@/types';
import { deleteProjectAction } from './actions';
import { triggerNavigationLoading } from '@/lib/navigation';

interface ProjectSettingsClientProps {
  project: Project;
}

export function ProjectSettingsClient({ project }: ProjectSettingsClientProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== project.generated_hostname) return;

    setIsDeleting(true);
    triggerNavigationLoading();

    try {
      await deleteProjectAction(project.id);
    } catch (error) {
      console.error('Failed to delete project:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
          <p className="text-gray-600">Manage your project configuration</p>
        </div>
      </motion.div>

      {/* Project Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <Globe className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Hostname</p>
              <p className="font-medium text-gray-900">{project.generated_hostname}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <Hash className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Project ID</p>
              <p className="font-mono text-sm text-gray-900">{project.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-900">{formatDate(project.created_at)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
              <h3 className="font-semibold text-gray-900 mb-1">Delete this project</h3>
              <p className="text-gray-600 text-sm">
                Once you delete a project, there is no going back. This will permanently delete the
                project and all associated pages and data.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 font-medium transition-all flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
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
                  delete the <strong>{project.generated_hostname}</strong> project, all pages, and
                  remove all associated data.
                </p>
              </div>

              <label className="block mb-2">
                <span className="text-gray-700 text-sm font-medium">
                  Please type <strong className="font-mono">{project.generated_hostname}</strong> to
                  confirm:
                </span>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.generated_hostname}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none font-mono text-sm mb-4"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== project.generated_hostname || isDeleting}
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
                      I understand, delete this project
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
