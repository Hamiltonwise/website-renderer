'use client';

import { useState } from 'react';
import { GBPSearchSelect } from './gbp-search-select';
import { confirmGbpSelection } from './actions';
import type { SelectedGBP } from '@/lib/services/gbp.service';

interface GbpSelectorProps {
  projectId: string;
}

export function GbpSelector({ projectId }: GbpSelectorProps) {
  const [selectedGBP, setSelectedGBP] = useState<SelectedGBP | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (gbp: SelectedGBP) => {
    setSelectedGBP(gbp);
    setWebsiteUrl(gbp.websiteUri || '');
    setError('');
  };

  const handleClear = () => {
    setSelectedGBP(null);
    setWebsiteUrl('');
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedGBP) return;

    setIsConfirming(true);
    setError('');

    const result = await confirmGbpSelection(
      projectId,
      selectedGBP,
      websiteUrl || null
    );

    if (!result.success) {
      setError(result.error || 'Failed to confirm selection');
      setIsConfirming(false);
    }
    // If success, page will revalidate and UI will update
  };

  // Confirmation step - show after GBP is selected
  if (selectedGBP) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Confirm Your Business</h2>

        <div className="mb-6">
          <GBPSearchSelect
            onSelect={handleSelect}
            selectedGBP={selectedGBP}
            onClear={handleClear}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Website URL
          </label>
          <p className="text-sm text-gray-600 mb-2">
            {selectedGBP.websiteUri
              ? "We found this website from your Google Business Profile. You can edit it if needed."
              : "Enter your website URL if you have one. We'll scrape it to build your new site."}
          </p>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty if you don't have a website yet
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isConfirming ? 'Starting...' : 'Confirm & Start Building'}
        </button>
      </div>
    );
  }

  // Search step - initial view
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-2">
        Connect Your Google Business Profile
      </h2>
      <p className="text-gray-600 mb-6">
        Search for your business on Google to get started. We'll use your business information to generate a professional website.
      </p>

      <GBPSearchSelect
        onSelect={handleSelect}
        selectedGBP={selectedGBP}
        onClear={handleClear}
        placeholder="Search for your business name..."
      />
    </div>
  );
}
