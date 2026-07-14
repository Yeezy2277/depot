import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, isValidSlug } from "./slug.ts";

test("slugify: lowercases and hyphenates", () => {
  assert.equal(slugify("Hello World"), "hello-world");
  assert.equal(slugify("  Trimmed  Spaces  "), "trimmed-spaces");
});

test("slugify: collapses punctuation and strips edges", () => {
  assert.equal(slugify("Design & Systems!!"), "design-systems");
  assert.equal(slugify("--already--slug--"), "already-slug");
});

test("slugify: strips diacritics", () => {
  assert.equal(slugify("Café Crème"), "cafe-creme");
});

test("isValidSlug: accepts clean slugs, rejects junk", () => {
  assert.ok(isValidSlug("hello-world"));
  assert.ok(isValidSlug("a1-b2-c3"));
  assert.ok(!isValidSlug("Hello"));
  assert.ok(!isValidSlug("trailing-"));
  assert.ok(!isValidSlug("double--hyphen"));
  assert.ok(!isValidSlug("has space"));
});
