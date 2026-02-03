'use client';

import { useState } from 'react';
import { deleteProjectAction } from './actions';

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteProjectAction(projectId);
    // If we get here, redirect failed - reset state
    setIsDeleting(false);
    setIsConfirming(false);
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Delete {projectName}?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isDeleting}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="text-sm text-red-600 hover:text-red-700"
    >
      Delete Project
    </button>
  );
}
