# Octivas JavaScript/TypeScript SDK

The official Node.js client for the [Octivas](https://octivas.com) web scraping and extraction API.

## Installation

```bash
npm install octivas
# or
yarn add octivas
# or
pnpm add octivas
```

## Quick start

```typescript
import { Octivas } from "octivas";

const client = new Octivas({ apiKey: "oc-..." });

// Scrape a single page
const result = await client.scrape("https://example.com");
console.log(result.markdown);

// Crawl a website
const crawl = await client.crawl({ url: "https://docs.example.com", limit: 20 });
for (const page of crawl.pages) {
  console.log(page.url, page.metadata?.title);
}

// Search the web
const search = await client.search("python web scraping");
for (const item of search.results) {
  console.log(item.title, item.url);
}
```

## Batch scraping

```typescript
const job = await client.batchScrape({
  urls: ["https://a.com", "https://b.com"],
});

// Poll until done
const status = await client.batchScrapeWait(job.job_id);
for (const result of status.results) {
  console.log(result.url, result.markdown?.length);
}
```

## Error handling

```typescript
import { Octivas, AuthenticationError, RateLimitError } from "octivas";

try {
  const result = await client.scrape("https://example.com");
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (err instanceof RateLimitError) {
    console.error("Too many requests - back off and retry");
  }
}
```

## Configuration

```typescript
const client = new Octivas({
  apiKey: "oc-...",
  baseUrl: "https://api.octivas.com", // default
  timeoutMs: 60_000, // default
});
```
