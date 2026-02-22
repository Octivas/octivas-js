import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Octivas, AuthenticationError, BadRequestError } from "../src";

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
  });

  describe("crawl", () => {
    it("returns crawl results", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/crawl`, () =>
          HttpResponse.json({
            success: true,
            url: "https://docs.example.com",
            pages_crawled: 2,
            credits_used: 2,
            pages: [
              { url: "https://docs.example.com/", markdown: "# Docs" },
              { url: "https://docs.example.com/start", markdown: "# Start" },
            ],
          }),
        ),
      );
      const result = await client.crawl("https://docs.example.com");
      expect(result.pages_crawled).toBe(2);
      expect(result.pages).toHaveLength(2);
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

  describe("batch scrape", () => {
    it("submits job and polls status", async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/batch/scrape`, () =>
          HttpResponse.json({
            success: true,
            job_id: "abc123",
            status: "processing",
            total_urls: 2,
          }),
        ),
        http.get(`${BASE_URL}/api/v1/batch/scrape/abc123`, () =>
          HttpResponse.json({
            success: true,
            job_id: "abc123",
            status: "completed",
            completed: 2,
            total: 2,
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
      const status = await client.batchScrapeStatus("abc123");
      expect(status.status).toBe("completed");
      expect(status.results).toHaveLength(2);
    });
  });
});
