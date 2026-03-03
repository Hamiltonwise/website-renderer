// Project status enum (simplified — 3 states)
export type ProjectStatus = 'CREATED' | 'IN_PROGRESS' | 'LIVE';

// Page content lifecycle status
export type PageStatus = 'draft' | 'published' | 'inactive';

// Page generation pipeline status
export type PageGenerationStatus = 'queued' | 'generating' | 'ready' | 'failed' | null;

// Section structure (JSONB array items)
export interface Section {
  name: string;
  content: string;
}

// Project model
export interface Project {
  id: string;
  user_id: string;
  generated_hostname: string;
  status: ProjectStatus;
  selected_place_id: string | null;
  selected_website_url: string | null;
  wrapper: string;
  header: string;
  footer: string;
  step_gbp_scrape: Record<string, unknown> | null;
  step_website_scrape: Record<string, unknown> | null;
  step_image_analysis: Array<{ s3Url: string; description: string }> | null;
  primary_color: string | null;
  template_id: string | null;
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
  generation_status: PageGenerationStatus;
  template_page_id: string | null;
  sections: Section[];
  created_at: Date;
  updated_at: Date;
}
