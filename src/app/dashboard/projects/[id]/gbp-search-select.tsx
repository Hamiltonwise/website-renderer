'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PlacesSuggestion, SelectedGBP } from '@/lib/services/gbp.service';

interface GBPSearchSelectProps {
  onSelect: (gbp: SelectedGBP) => void;
  selectedGBP: SelectedGBP | null;
  onClear: () => void;
  placeholder?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function GBPSearchSelect({
  onSelect,
  selectedGBP,
  onClear,
  placeholder = 'Search for your business...',
}: GBPSearchSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(inputValue, 300);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
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
        setIsOpen(data.suggestions.length > 0);
      } else {
        setError(data.error || 'Failed to fetch suggestions');
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
      setError('Network error. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPlaceDetails = useCallback(
    async (placeId: string) => {
      setIsLoadingDetails(true);
      setError(null);

      try {
        const response = await fetch(`/api/places/${placeId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (data.success && data.place) {
          onSelect(data.place);
          setInputValue('');
          setSuggestions([]);
          setIsOpen(false);
        } else {
          setError(data.error || 'Failed to get business details');
        }
      } catch (err) {
        console.error('Place details error:', err);
        setError('Network error. Please try again.');
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [onSelect]
  );

  useEffect(() => {
    if (debouncedInput && !selectedGBP) {
      fetchSuggestions(debouncedInput);
    }
  }, [debouncedInput, selectedGBP, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          fetchPlaceDetails(suggestions[highlightedIndex].placeId);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: PlacesSuggestion) => {
    fetchPlaceDetails(suggestion.placeId);
  };

  // Selected state display
  if (selectedGBP) {
    return (
      <div className="w-full">
        <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2.5 bg-blue-100 rounded-xl flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">
                  {selectedGBP.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {selectedGBP.formattedAddress}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {selectedGBP.rating && (
                    <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3 fill-yellow-500" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {selectedGBP.rating} ({selectedGBP.reviewCount} reviews)
                    </span>
                  )}
                  {selectedGBP.domain && (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      {selectedGBP.domain}
                    </span>
                  )}
                  {selectedGBP.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {selectedGBP.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClear}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Clear selection"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Search input state
  return (
    <div className="relative w-full">
      <div className="relative shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
          {isLoading || isLoadingDetails ? (
            <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (e.target.value.length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="block w-full pl-12 pr-10 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium placeholder:text-gray-400"
          placeholder={placeholder}
          autoComplete="off"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-4 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          <ul className="max-h-80 overflow-y-auto py-2">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.placeId}>
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${
                    highlightedIndex === index
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  disabled={isLoadingDetails}
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      highlightedIndex === index
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${
                        highlightedIndex === index
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        highlightedIndex === index
                          ? 'text-blue-700'
                          : 'text-gray-900'
                      }`}
                    >
                      {suggestion.mainText}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {suggestion.secondaryText}
                    </p>
                  </div>
                  {isLoadingDetails && highlightedIndex === index && (
                    <svg className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          {error}
        </p>
      )}

      {/* Helper text */}
      {!isOpen && inputValue.length > 0 && inputValue.length < 2 && (
        <p className="mt-2 text-sm text-gray-400">
          Type at least 2 characters to search...
        </p>
      )}
    </div>
  );
}

export default GBPSearchSelect;
