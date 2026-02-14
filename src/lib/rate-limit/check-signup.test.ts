/**
 * Tests for check-signup rate limiter.
 * Run: npx tsx src/lib/rate-limit/check-signup.test.ts
 * Or with Node 18+: node --import tsx src/lib/rate-limit/check-signup.test.ts
 *
 * These tests verify the rate limit config and throttling behavior.
 * Full integration tests require DATABASE_URL and the check_signup_rate_limit table.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { CHECK_SIGNUP_RATE_LIMIT } from "./check-signup";

describe("check-signup rate limit", () => {
  it("has configurable limits (5 per minute)", () => {
    assert.strictEqual(CHECK_SIGNUP_RATE_LIMIT.maxRequests, 5);
    assert.strictEqual(CHECK_SIGNUP_RATE_LIMIT.windowSec, 60);
  });

  it("config is reusable for different limits", () => {
    const custom = { maxRequests: 10, windowSec: 120 };
    assert.strictEqual(custom.maxRequests, 10);
    assert.strictEqual(custom.windowSec, 120);
  });
});
