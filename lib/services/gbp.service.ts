/**
 * Google Business Profile Service
 * Uses the Alloro Places API for GBP search
 */

const PLACES_API_BASE_URL = process.env.PLACES_API_BASE_URL || 'https://app.getalloro.com/api';

// Types for Places API
export interface PlacesSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export interface PlacesAutocompleteResponse {
  success: boolean;
  suggestions: PlacesSuggestion[];
  error?: string;
}

export interface SelectedGBP {
  placeId: string;
  name: string;
  formattedAddress: string;
  city: string;
  state: string;
  displayString: string;
  practiceSearchString: string;
  domain: string;
  websiteUri: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number;
  category: string;
}

export interface PlacesDetailsResponse {
  success: boolean;
  place: SelectedGBP;
  error?: string;
}

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
