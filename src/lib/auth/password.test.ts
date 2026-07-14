import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password.ts";

test("hashPassword: produces a bcrypt hash, not the plaintext", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.ok(hash.startsWith("$2"), "looks like a bcrypt hash");
  assert.ok(!hash.includes("correct horse"), "does not leak the password");
});

test("verifyPassword: true for the right password, false otherwise", async () => {
  const hash = await hashPassword("s3cret-pass");
  assert.equal(await verifyPassword("s3cret-pass", hash), true);
  assert.equal(await verifyPassword("wrong-pass", hash), false);
});

test("hashPassword: salted — same input hashes differently each time", async () => {
  const a = await hashPassword("same-input");
  const b = await hashPassword("same-input");
  assert.notEqual(a, b, "unique salt per hash");
  assert.equal(await verifyPassword("same-input", a), true);
  assert.equal(await verifyPassword("same-input", b), true);
});
