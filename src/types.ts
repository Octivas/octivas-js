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

export interface BatchScrapeJob {
  success: boolean;
  job_id: string;
  status: string;
  total_urls: number;
}

export interface BatchScrapeStatus {
  success: boolean;
  job_id: string;
  status: string;
  completed: number;
  total: number;
  credits_used: number;
  results: ScrapeResponse[];
}

export interface CrawlResponse {
  success: boolean;
  url: string;
  pages_crawled: number;
  credits_used: number;
  pages: PageContent[];
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results_count: number;
  credits_used: number;
  results: SearchResultItem[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: Array<{ field?: string; message: string; code?: string }>;
}
