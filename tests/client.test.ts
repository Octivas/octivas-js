import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  Octivas,
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from "../src";

const BASE_URL = "https://api.octivas.com";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Octivas client", () => {
  const client = new Octivas({ apiKey: "oc-test01234567890123456789012" });

  describe("scrape", () => {
    it("returns scrape result on success", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json({
            success: true,
            url: "https://example.com/",
            markdown: "# Hello",
          }),
        ),
      );
      const result = await client.scrape("https://example.com");
      expect(result.success).toBe(true);
      expect(result.markdown).toBe("# Hello");
    });

    it("accepts string shorthand", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json({ success: true, url: "https://example.com/", markdown: "ok" }),
        ),
      );
      const result = await client.scrape("https://example.com");
      expect(result.markdown).toBe("ok");
    });

    it("throws AuthenticationError on 401", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json({ success: false, error: "Invalid API key" }, { status: 401 }),
        ),
      );
      await expect(client.scrape("https://example.com")).rejects.toThrow(AuthenticationError);
    });

    it("throws BadRequestError on 422", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json({ success: false, error: "Validation error" }, { status: 422 }),
        ),
      );
      await expect(client.scrape("bad-url")).rejects.toThrow(BadRequestError);
    });

    it("throws ForbiddenError on 403", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
        ),
      );
      await expect(client.scrape("https://example.com")).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError on 404", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json({ success: false, error: "Not found" }, { status: 404 }),
        ),
      );
      await expect(client.scrape("https://example.com")).rejects.toThrow(NotFoundError);
    });

    it("throws RateLimitError on 429", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json(
            { success: false, error: "Rate limit exceeded", detail: { credits_used: 100, credits_limit: 100 } },
            { status: 429 },
          ),
        ),
      );
      await expect(client.scrape("https://example.com")).rejects.toThrow(RateLimitError);
    });

    it("throws ServerError on 500", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/scrape`, () =>
          HttpResponse.json({ success: false, error: "Internal server error" }, { status: 500 }),
        ),
      );
      await expect(client.scrape("https://example.com")).rejects.toThrow(ServerError);
    });
  });

  describe("crawl", () => {
    it("submits crawl job and returns job info", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/crawl`, () =>
          HttpResponse.json({
            success: true,
            job_id: "crawl-001",
            status: "pending",
            total: 10,
          }),
        ),
      );
      const result = await client.crawl("https://docs.example.com");
      expect(result.job_id).toBe("crawl-001");
      expect(result.status).toBe("pending");
      expect(result.total).toBe(10);
    });

    it("forwards prompt and schema in the JSON body", async () => {
      let captured: Record<string, unknown> | null = null;
      server.use(
        http.post(`${BASE_URL}/api/v1/crawl`, async ({ request }) => {
          captured = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            job_id: "crawl-002",
            status: "pending",
            total: 2,
          });
        }),
      );
      await client.crawl({
        url: "https://docs.example.com",
        limit: 2,
        formats: ["markdown", "json"],
        prompt: "Extract headings",
        schema: { type: "object" },
      });
      expect(captured).not.toBeNull();
      expect(captured!.formats).toEqual(["markdown", "json"]);
      expect(captured!.prompt).toBe("Extract headings");
      expect((captured!.schema as { type: string }).type).toBe("object");
    });
  });

  describe("search", () => {
    it("returns search results", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/search`, () =>
          HttpResponse.json({
            success: true,
            query: "test",
            results_count: 1,
            credits_used: 1,
            results: [{ url: "https://example.com", title: "Example" }],
          }),
        ),
      );
      const result = await client.search("test");
      expect(result.results_count).toBe(1);
      expect(result.results[0].title).toBe("Example");
    });
  });

  describe("map", () => {
    it("returns map results", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/map`, () =>
          HttpResponse.json({
            success: true,
            url: "https://example.com",
            links_count: 2,
            links: [
              { url: "https://example.com/", title: "Home" },
              { url: "https://example.com/about", title: "About", description: "About us" },
            ],
          }),
        ),
      );
      const result = await client.map("https://example.com");
      expect(result.links_count).toBe(2);
      expect(result.links[0].url).toBe("https://example.com/");
      expect(result.links[1].description).toBe("About us");
    });

    it("accepts string shorthand", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/map`, () =>
          HttpResponse.json({
            success: true,
            url: "https://example.com",
            links_count: 0,
            links: [],
          }),
        ),
      );
      const result = await client.map("https://example.com");
      expect(result.success).toBe(true);
    });
  });

  describe("batch scrape", () => {
    it("submits job and polls status", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/batch/scrape`, () =>
          HttpResponse.json({
            success: true,
            job_id: "abc123",
            status: "pending",
            total: 2,
          }),
        ),
        http.get(`${BASE_URL}/api/v1/jobs/abc123`, () =>
          HttpResponse.json({
            success: true,
            job_id: "abc123",
            type: "batch_scrape",
            status: "completed",
            provider: "default",
            progress: { completed: 2, total: 2 },
            credits_used: 2,
            results: [
              { success: true, url: "https://a.com", markdown: "A" },
              { success: true, url: "https://b.com", markdown: "B" },
            ],
          }),
        ),
      );
      const job = await client.batchScrape({ urls: ["https://a.com", "https://b.com"] });
      expect(job.job_id).toBe("abc123");
      expect(job.total).toBe(2);
      const status = await client.getJob("abc123", true);
      expect(status.status).toBe("completed");
      expect(status.results).toHaveLength(2);
    });
  });

  describe("jobs", () => {
    it("lists jobs", async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/jobs`, () =>
          HttpResponse.json({
            success: true,
            jobs: [
              {
                job_id: "job-1",
                type: "crawl",
                status: "completed",
                provider: "default",
                progress: { completed: 5, total: 5 },
                credits_used: 5,
                created_at: "2026-04-15T10:00:00Z",
                finished_at: "2026-04-15T10:01:00Z",
              },
            ],
            total: 1,
            page: 1,
            limit: 20,
          }),
        ),
      );
      const result = await client.listJobs();
      expect(result.total).toBe(1);
      expect(result.jobs[0].job_id).toBe("job-1");
      expect(result.jobs[0].type).toBe("crawl");
    });

    it("gets a single job", async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/jobs/job-1`, () =>
          HttpResponse.json({
            success: true,
            job_id: "job-1",
            type: "crawl",
            status: "completed",
            provider: "default",
            progress: { completed: 5, total: 5 },
            credits_used: 5,
            created_at: "2026-04-15T10:00:00Z",
            finished_at: "2026-04-15T10:01:00Z",
          }),
        ),
      );
      const result = await client.getJob("job-1");
      expect(result.job_id).toBe("job-1");
      expect(result.status).toBe("completed");
      expect(result.progress.completed).toBe(5);
    });
  });
});
