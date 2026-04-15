import {
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  OctivasError,
  RateLimitError,
  ServerError,
} from "./errors";
import type {
  BatchScrapeParams,
  CrawlParams,
  JobStatusResponse,
  JobSubmitResponse,
  JobListResponse,
  ListJobsOptions,
  MapParams,
  MapResponse,
  ScrapeParams,
  ScrapeResponse,
  SearchParams,
  SearchResponse,
} from "./types";

const DEFAULT_BASE_URL = "https://api.octivas.com";
const DEFAULT_TIMEOUT_MS = 60_000;

export interface OctivasConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export class Octivas {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: OctivasConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "octivas-js/0.1.0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: Record<string, unknown> = {};
        try {
          errorBody = (await response.json()) as Record<string, unknown>;
        } catch {
          // ignore parse errors
        }
        const message =
          (errorBody.error as string) ?? response.statusText ?? `HTTP ${response.status}`;
        const opts = { statusCode: response.status, body: errorBody };

        if (response.status === 401) throw new AuthenticationError(message, opts);
        if (response.status === 403) throw new ForbiddenError(message, opts);
        if (response.status === 400 || response.status === 422)
          throw new BadRequestError(message, opts);
        if (response.status === 404) throw new NotFoundError(message, opts);
        if (response.status === 429) throw new RateLimitError(message, opts);
        if (response.status >= 500) throw new ServerError(message, opts);
        throw new OctivasError(message, opts);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Scrape ──────────────────────────────────────────────────────────────

  async scrape(urlOrParams: string | ScrapeParams): Promise<ScrapeResponse> {
    const params: ScrapeParams =
      typeof urlOrParams === "string" ? { url: urlOrParams } : urlOrParams;
    const body = stripUndefined({ ...params });
    return this.request<ScrapeResponse>("POST", "/api/v1/scrape", body);
  }

  // ── Batch scrape ────────────────────────────────────────────────────────

  async batchScrape(params: BatchScrapeParams): Promise<JobSubmitResponse> {
    const body = stripUndefined({ ...params });
    return this.request<JobSubmitResponse>("POST", "/api/v1/batch/scrape", body);
  }

  async waitForBatchScrape(
    jobId: string,
    options?: { pollIntervalMs?: number; maxWaitMs?: number },
  ): Promise<JobStatusResponse> {
    return this.pollJob(jobId, options);
  }

  async batchScrapeAndWait(
    params: BatchScrapeParams,
    options?: { pollIntervalMs?: number; maxWaitMs?: number },
  ): Promise<JobStatusResponse> {
    const job = await this.batchScrape(params);
    return this.waitForBatchScrape(job.job_id, options);
  }

  // ── Crawl ───────────────────────────────────────────────────────────────

  async crawl(urlOrParams: string | CrawlParams): Promise<JobSubmitResponse> {
    const params: CrawlParams =
      typeof urlOrParams === "string" ? { url: urlOrParams } : urlOrParams;
    const body = stripUndefined({ limit: 10, ...params });
    return this.request<JobSubmitResponse>("POST", "/api/v1/crawl", body);
  }

  async waitForCrawl(
    jobId: string,
    options?: { pollIntervalMs?: number; maxWaitMs?: number },
  ): Promise<JobStatusResponse> {
    return this.pollJob(jobId, options);
  }

  async crawlAndWait(
    urlOrParams: string | CrawlParams,
    options?: { pollIntervalMs?: number; maxWaitMs?: number },
  ): Promise<JobStatusResponse> {
    const job = await this.crawl(urlOrParams);
    return this.waitForCrawl(job.job_id, options);
  }

  // ── Jobs ────────────────────────────────────────────────────────────────

  async listJobs(options?: ListJobsOptions): Promise<JobListResponse> {
    const params = new URLSearchParams();
    if (options?.type) params.set("type", options.type);
    if (options?.status) params.set("status", options.status);
    if (options?.page != null) params.set("page", String(options.page));
    if (options?.limit != null) params.set("limit", String(options.limit));
    const qs = params.toString();
    return this.request<JobListResponse>("GET", `/api/v1/jobs${qs ? `?${qs}` : ""}`);
  }

  async getJob(jobId: string, includeResults?: boolean): Promise<JobStatusResponse> {
    const qs = includeResults ? "?include_results=true" : "";
    return this.request<JobStatusResponse>("GET", `/api/v1/jobs/${jobId}${qs}`);
  }

  // ── Map ─────────────────────────────────────────────────────────────────

  async map(urlOrParams: string | MapParams): Promise<MapResponse> {
    const params: MapParams =
      typeof urlOrParams === "string" ? { url: urlOrParams } : urlOrParams;
    const body = stripUndefined({ limit: 5000, ...params });
    return this.request<MapResponse>("POST", "/api/v1/map", body);
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async search(queryOrParams: string | SearchParams): Promise<SearchResponse> {
    const params: SearchParams =
      typeof queryOrParams === "string" ? { query: queryOrParams } : queryOrParams;
    const body = stripUndefined({ limit: 5, ...params });
    return this.request<SearchResponse>("POST", "/api/v1/search", body);
  }

  // ── Internal helpers ──────────────────────────────────────────────────

  private async pollJob(
    jobId: string,
    options?: { pollIntervalMs?: number; maxWaitMs?: number },
  ): Promise<JobStatusResponse> {
    const pollInterval = options?.pollIntervalMs ?? 2000;
    const maxWait = options?.maxWaitMs ?? 300_000;
    const deadline = Date.now() + maxWait;

    while (true) {
      const status = await this.getJob(jobId, true);
      if (status.status === "completed" || status.status === "failed") return status;
      if (Date.now() >= deadline) return status;
      await new Promise((r) => setTimeout(r, pollInterval));
    }
  }
}
