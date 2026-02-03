// Project status enum
export type ProjectStatus =
  | 'CREATED'
  | 'GBP_SELECTED'
  | 'GBP_SCRAPED'
  | 'WEBSITE_SCRAPED'
  | 'IMAGES_ANALYZED'
  | 'HTML_GENERATED'
  | 'READY';

// Page status enum
export type PageStatus = 'draft' | 'published' | 'inactive';

// Project model
export interface Project {
  id: string;
  user_id: string;
  generated_hostname: string;
  status: ProjectStatus;
  selected_place_id: string | null;
  selected_website_url: string | null;
  step_gbp_scrape: Record<string, unknown> | null;
  step_website_scrape: Record<string, unknown> | null;
  step_image_analysis: Array<{ s3Url: string; description: string }> | null;
  created_at: Date;
  updated_at: Date;
}

// Page model
export interface Page {
  id: string;
  project_id: string;
  path: string;
  version: number;
  status: PageStatus;
  html_content: string;
  created_at: Date;
  updated_at: Date;
}

// Template model
export interface Template {
  id: string;
  name: string;
  html_template: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// GBP Types
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

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
