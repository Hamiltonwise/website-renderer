'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Star,
  Phone,
  Globe,
  Loader2,
  CheckCircle2,
  Building2,
  ChevronRight,
  LayoutTemplate,
  ChevronDown,
} from 'lucide-react';
import type { PlacesSuggestion, SelectedGBP, Template } from '@/types';
import { confirmGbpSelectionAction } from './actions';
import { triggerNavigationLoading } from '@/lib/navigation';

interface GbpSelectorProps {
  projectId: string;
  initialPlaceId?: string | null;
  initialStatus: string;
  templates: Template[];
}

export function GbpSelector({ projectId, initialPlaceId, initialStatus, templates }: GbpSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SelectedGBP | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Template selection - default to active template or first template
  const activeTemplate = templates.find((t) => t.is_active);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    activeTemplate?.id || templates[0]?.id || ''
  );
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  const isAlreadySelected = initialPlaceId && initialStatus !== 'CREATED';

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: query }),
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error || 'Failed to search');
      }
    } catch (err) {
      setError('Failed to search for businesses');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  // Select a suggestion and get full details
  const handleSelectSuggestion = async (suggestion: PlacesSuggestion) => {
    setIsLoadingDetails(true);
    setError(null);
    setSuggestions([]);
    setSearchQuery(suggestion.mainText);

    try {
      const response = await fetch(`/api/places/${suggestion.placeId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPlace(data.place);
      } else {
        setError(data.error || 'Failed to get business details');
      }
    } catch (err) {
      setError('Failed to load business details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Confirm selection and save to database
  const handleConfirmSelection = async () => {
    if (!selectedPlace) return;
    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    setIsConfirming(true);
    setError(null);
    triggerNavigationLoading();

    try {
      // Pass full GBP data and template ID to trigger n8n webhook
      await confirmGbpSelectionAction(projectId, selectedPlace, selectedTemplateId);
    } catch (err) {
      setError('Failed to save selection');
      setIsConfirming(false);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedPlace(null);
    setSearchQuery('');
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (isAlreadySelected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Business Selected</h3>
        </div>
        <p className="text-green-700">
          A Google Business Profile has already been selected for this project.
          The website generation process is in progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for a business..."
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={isLoadingDetails || isConfirming}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none font-medium placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-500 animate-spin" />
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions List */}
      <AnimatePresence>
        {suggestions.length > 0 && !selectedPlace && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.placeId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{suggestion.mainText}</p>
                    <p className="text-sm text-gray-500">{suggestion.secondaryText}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 transition-colors" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Details */}
      <AnimatePresence>
        {isLoadingDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center"
          >
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading business details...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Place Card */}
      <AnimatePresence>
        {selectedPlace && !isLoadingDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border-2 border-brand-200 shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-1">{selectedPlace.name}</h3>
              <p className="text-brand-100">{selectedPlace.category}</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <p className="text-gray-700">{selectedPlace.formattedAddress}</p>
              </div>

              {/* Rating */}
              {selectedPlace.rating && (
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <p className="text-gray-700">
                    <span className="font-semibold">{selectedPlace.rating}</span>
                    <span className="text-gray-500"> ({selectedPlace.reviewCount} reviews)</span>
                  </p>
                </div>
              )}

              {/* Phone */}
              {selectedPlace.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-700">{selectedPlace.phone}</p>
                </div>
              )}

              {/* Website */}
              {selectedPlace.websiteUri && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <a
                    href={selectedPlace.websiteUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 hover:underline truncate"
                  >
                    {selectedPlace.websiteUri}
                  </a>
                </div>
              )}
            </div>

            {/* Template Selector */}
            {templates.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4" />
                    Select Template
                  </div>
                </label>
                <div className="relative" ref={templateDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                    disabled={isConfirming}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                        <LayoutTemplate className="w-4 h-4 text-brand-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {selectedTemplate?.name || 'Select a template'}
                        </p>
                        {selectedTemplate?.is_active && (
                          <p className="text-xs text-brand-600">Active Template</p>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isTemplateDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-10 overflow-hidden max-h-64 overflow-y-auto"
                      >
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => {
                              setSelectedTemplateId(template.id);
                              setIsTemplateDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                              selectedTemplateId === template.id ? 'bg-brand-50' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                              <iframe
                                srcDoc={template.html_template}
                                className="w-full h-full pointer-events-none transform scale-[0.1] origin-top-left"
                                style={{ width: '1000%', height: '1000%' }}
                                title={template.name}
                              />
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-medium text-gray-900">{template.name}</p>
                              {template.is_active && (
                                <p className="text-xs text-brand-600">Active</p>
                              )}
                            </div>
                            {selectedTemplateId === template.id && (
                              <CheckCircle2 className="w-5 h-5 text-brand-500" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* No Templates Warning */}
            {templates.length === 0 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <LayoutTemplate className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800 text-sm">
                      No published templates available. Please create and publish a template first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
              <button
                onClick={handleClearSelection}
                disabled={isConfirming}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
              >
                Search Again
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={isConfirming}
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 disabled:scale-100 shadow-lg shadow-brand-500/30 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirm Selection
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
