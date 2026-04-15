export type ContentFormat =
  | "markdown"
  | "html"
  | "rawHtml"
  | "screenshot"
  | "links"
  | "json"
  | "images"
  | "summary";

export interface Location {
  country: string;
  languages?: string[];
}

export interface PageMetadata {
  title?: string;
  description?: string;
  url: string;
  language?: string;
  status_code?: number;
  credits_used?: number;
  favicon?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_url?: string;
  og_site_name?: string;
  keywords?: string;
  author?: string;
  published_time?: string;
  modified_time?: string;
}

export interface PageContent {
  url: string;
  markdown?: string;
  html?: string;
  raw_html?: string;
  screenshot?: string;
  links?: string[];
  json?: unknown;
  images?: string[];
  summary?: string;
  metadata?: PageMetadata;
}

export interface SearchResultItem {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
  html?: string;
  raw_html?: string;
  screenshot?: string;
  links?: string[];
  images?: string[];
  summary?: string;
}

// ── Request params ──────────────────────────────────────────────────────────

export interface ScrapeParams {
  url: string;
  formats?: ContentFormat[];
  schema?: Record<string, unknown>;
  prompt?: string;
  max_age?: number;
  store_in_cache?: boolean;
  location?: Location;
  only_main_content?: boolean;
  timeout?: number;
}

export interface BatchScrapeParams {
  urls: string[];
  formats?: ContentFormat[];
  schema?: Record<string, unknown>;
  prompt?: string;
  max_age?: number;
  store_in_cache?: boolean;
  location?: Location;
  only_main_content?: boolean;
  timeout?: number;
}

export interface CrawlParams {
  url: string;
  limit?: number;
  formats?: ContentFormat[];
  /** JSON Schema for structured extraction when `formats` includes `"json"`. */
  schema?: Record<string, unknown>;
  /** Guidance prompt when `formats` includes `"json"`. */
  prompt?: string;
  exclude_paths?: string[];
  include_paths?: string[];
  max_depth?: number;
  allow_external_links?: boolean;
  allow_subdomains?: boolean;
  ignore_sitemap?: boolean;
  ignore_query_parameters?: boolean;
  only_main_content?: boolean;
  timeout?: number;
  wait_for?: number;
}

export interface SearchParams {
  query: string;
  limit?: number;
  formats?: ContentFormat[];
  location?: string;
  country?: string;
  tbs?: string;
  only_main_content?: boolean;
  timeout?: number;
}

export interface MapParams {
  url: string;
  search?: string;
  include_subdomains?: boolean;
  ignore_query_parameters?: boolean;
  limit?: number;
  sitemap?: "only" | "include" | "skip";
  timeout?: number;
  location?: Location;
}

// ── Response types ──────────────────────────────────────────────────────────

export interface ScrapeResponse {
  success: boolean;
  url: string;
  markdown?: string;
  html?: string;
  raw_html?: string;
  screenshot?: string;
  links?: string[];
  json?: unknown;
  images?: string[];
  summary?: string;
  metadata?: PageMetadata;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results_count: number;
  credits_used: number;
  results: SearchResultItem[];
}

export interface MapLink {
  url: string;
  title?: string;
  description?: string;
}

export interface MapResponse {
  success: boolean;
  url: string;
  links_count: number;
  links: MapLink[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: Array<{ field?: string; message: string; code?: string }>;
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export interface JobProgress {
  completed: number;
  total: number;
}

export interface JobError {
  message: string;
  type: string;
}

export interface JobSubmitResponse {
  success: boolean;
  job_id: string;
  status: string;
  total: number;
}

export interface JobStatusResponse {
  success: boolean;
  job_id: string;
  type: string;
  status: string;
  provider: string;
  progress: JobProgress;
  credits_used: number;
  error?: JobError;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  results?: unknown;
}

export interface JobListItem {
  job_id: string;
  type: string;
  status: string;
  provider: string;
  progress: JobProgress;
  credits_used: number;
  error?: JobError;
  organization_id?: string;
  created_at?: string;
  finished_at?: string;
}

export interface JobListResponse {
  success: boolean;
  jobs: JobListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ListJobsOptions {
  type?: "crawl" | "batch_scrape";
  status?: string;
  page?: number;
  limit?: number;
}
