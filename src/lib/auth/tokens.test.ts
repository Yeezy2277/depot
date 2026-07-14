import { test } from "node:test";
import assert from "node:assert/strict";
import { generateToken, hashToken, tokenPrefix, looksLikeToken } from "./tokens.ts";

test("generateToken: prefixed, high-entropy, unique", () => {
  const a = generateToken();
  const b = generateToken();
  assert.ok(a.startsWith("depot_"));
  assert.ok(a.length > 30);
  assert.notEqual(a, b, "two tokens must differ");
});

test("hashToken: deterministic SHA-256 hex, hides the plaintext", async () => {
  const token = generateToken();
  const h1 = await hashToken(token);
  const h2 = await hashToken(token);
  assert.equal(h1, h2, "same input → same hash");
  assert.match(h1, /^[0-9a-f]{64}$/, "64 hex chars");
  assert.ok(!h1.includes(token), "hash does not contain the token");
});

test("hashToken: different tokens → different hashes", async () => {
  assert.notEqual(await hashToken(generateToken()), await hashToken(generateToken()));
});

test("tokenPrefix / looksLikeToken", () => {
  const token = generateToken();
  assert.ok(tokenPrefix(token).startsWith("depot_"));
  assert.ok(tokenPrefix(token).endsWith("…"));
  assert.ok(looksLikeToken(token));
  assert.ok(!looksLikeToken("not-a-token"));
  assert.ok(!looksLikeToken("depot_short"));
});
