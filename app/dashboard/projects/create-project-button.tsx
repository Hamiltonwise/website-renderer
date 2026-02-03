'use client';

import { useState } from 'react';
import { createNewProject } from './actions';

export function CreateProjectButton() {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // For MVP, hardcode the user ID
      await createNewProject('test-user-1');
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {isCreating ? 'Creating...' : '+ Create New Project'}
    </button>
  );
}
