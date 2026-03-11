import { describe, expect, it } from "vitest";
import { RateLimitError } from "../src/errors";

describe("RateLimitError", () => {
  it("exposes creditsUsed and creditsLimit from detail body", () => {
    const err = new RateLimitError("Credit limit exceeded", {
      body: {
        detail: {
          error: "Credit limit exceeded",
          credits_used: 1000,
          credits_limit: 1000,
        },
      },
    });
    expect(err.creditsUsed).toBe(1000);
    expect(err.creditsLimit).toBe(1000);
    expect(err.statusCode).toBe(429);
  });

  it("exposes creditsUsed and creditsLimit from flat body", () => {
    const err = new RateLimitError("Credit limit exceeded", {
      body: {
        credits_used: 500,
        credits_limit: 4000,
      },
    });
    expect(err.creditsUsed).toBe(500);
    expect(err.creditsLimit).toBe(4000);
  });

  it("returns undefined when no credit info in body", () => {
    const err = new RateLimitError("Too many requests", {
      body: { error: "rate limit" },
    });
    expect(err.creditsUsed).toBeUndefined();
    expect(err.creditsLimit).toBeUndefined();
  });

  it("returns undefined when no body", () => {
    const err = new RateLimitError("Too many requests");
    expect(err.creditsUsed).toBeUndefined();
    expect(err.creditsLimit).toBeUndefined();
  });

  it("coerces string values to numbers", () => {
    const err = new RateLimitError("Credit limit exceeded", {
      body: {
        detail: { credits_used: "42", credits_limit: "100" },
      },
    });
    expect(err.creditsUsed).toBe(42);
    expect(err.creditsLimit).toBe(100);
  });
});
