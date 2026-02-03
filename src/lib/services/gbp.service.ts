/**
 * Google Business Profile Service
 * Uses the Alloro Places API for GBP search
 */

import type {
  PlacesSuggestion,
  PlacesAutocompleteResponse,
  SelectedGBP,
  PlacesDetailsResponse,
} from '@/types';

const PLACES_API_BASE_URL = process.env.PLACES_API_BASE_URL || 'https://app.getalloro.com/api';

/**
 * Search for businesses using Places Autocomplete API
 */
export async function searchPlaces(query: string): Promise<PlacesAutocompleteResponse> {
  if (!query || query.length < 2) {
    return { success: true, suggestions: [] };
  }

  try {
    const response = await fetch(`${PLACES_API_BASE_URL}/places/autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: query }),
    });

    const data: PlacesAutocompleteResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[GBP Service] Autocomplete error:', error);
    return {
      success: false,
      suggestions: [],
      error: 'Failed to fetch suggestions',
    };
  }
}

/**
 * Get full details for a place by ID
 */
export async function getPlaceDetails(placeId: string): Promise<PlacesDetailsResponse> {
  try {
    const response = await fetch(`${PLACES_API_BASE_URL}/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: PlacesDetailsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[GBP Service] Place details error:', error);
    return {
      success: false,
      place: {} as SelectedGBP,
      error: 'Failed to fetch place details',
    };
  }
}

// Re-export types for convenience
export type { PlacesSuggestion, PlacesAutocompleteResponse, SelectedGBP, PlacesDetailsResponse };
