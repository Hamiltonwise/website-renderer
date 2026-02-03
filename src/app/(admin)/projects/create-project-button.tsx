'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { createNewProject } from './actions';
import { triggerNavigationLoading } from '@/lib/navigation';

// For MVP, we'll use a hardcoded user ID
const TEMP_USER_ID = 'temp-user-123';

export function CreateProjectButton() {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    triggerNavigationLoading();
    try {
      await createNewProject(TEMP_USER_ID);
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 disabled:scale-100 shadow-lg shadow-brand-500/30 disabled:shadow-none disabled:cursor-not-allowed"
    >
      {isCreating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          New Project
        </>
      )}
    </button>
  );
}
