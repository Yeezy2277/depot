import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLimit } from "./rate-limit-core.ts";

test("checkLimit: allows up to the limit, then blocks", () => {
  const key = "test:a";
  const opts = { limit: 3, windowMs: 1000 };
  assert.equal(checkLimit(key, opts, 0).ok, true); // 1
  assert.equal(checkLimit(key, opts, 10).ok, true); // 2
  const third = checkLimit(key, opts, 20);
  assert.equal(third.ok, true); // 3
  assert.equal(third.remaining, 0);
  assert.equal(checkLimit(key, opts, 30).ok, false); // 4 → blocked
});

test("checkLimit: window resets after windowMs", () => {
  const key = "test:b";
  const opts = { limit: 1, windowMs: 1000 };
  assert.equal(checkLimit(key, opts, 0).ok, true);
  assert.equal(checkLimit(key, opts, 500).ok, false, "still inside window");
  assert.equal(checkLimit(key, opts, 1000).ok, true, "new window");
});

test("checkLimit: keys are isolated", () => {
  const opts = { limit: 1, windowMs: 1000 };
  assert.equal(checkLimit("test:c", opts, 0).ok, true);
  assert.equal(checkLimit("test:d", opts, 0).ok, true);
});
