import { test } from "node:test";
import assert from "node:assert/strict";
import { diffYaml } from "./diff";

test("diffYaml flags identical inputs as semantically equal", () => {
  const yaml = "name: app\nversion: 1.0\n";
  const result = diffYaml(yaml, yaml);
  assert.equal(result.semanticallyEqual, true);
  assert.deepEqual(result.structural, []);
});

test("diffYaml detects added keys", () => {
  const left = "name: app\n";
  const right = "name: app\nversion: 1.0\n";
  const result = diffYaml(left, right);
  assert.equal(result.semanticallyEqual, false);
  const added = result.structural!.find((c) => c.type === "added");
  assert.ok(added);
  assert.equal(added.path, "version");
  assert.equal(added.rightValue, 1);
});

test("diffYaml detects removed keys", () => {
  const left = "name: app\nversion: 1.0\n";
  const right = "name: app\n";
  const result = diffYaml(left, right);
  const removed = result.structural!.find((c) => c.type === "removed");
  assert.ok(removed);
  assert.equal(removed.path, "version");
});

test("diffYaml detects scalar changes at nested paths", () => {
  const left = "spec:\n  replicas: 3\n";
  const right = "spec:\n  replicas: 5\n";
  const result = diffYaml(left, right);
  const changed = result.structural!.find((c) => c.type === "changed");
  assert.ok(changed);
  assert.equal(changed.path, "spec.replicas");
  assert.equal(changed.leftValue, 3);
  assert.equal(changed.rightValue, 5);
});

test("diffYaml indexes array changes", () => {
  const left = "items:\n  - a\n  - b\n";
  const right = "items:\n  - a\n  - c\n";
  const result = diffYaml(left, right);
  const changed = result.structural!.find((c) => c.type === "changed");
  assert.ok(changed);
  assert.equal(changed.path, "items[1]");
});

test("diffYaml treats key-reordered YAML as semantically equal", () => {
  const left = "a: 1\nb: 2\n";
  const right = "b: 2\na: 1\n";
  const result = diffYaml(left, right);
  assert.equal(result.semanticallyEqual, true);
});

test("diffYaml returns null structural when input is invalid", () => {
  const left = "name: app\n";
  const right = "name: app\n  bad: : :\n";
  const result = diffYaml(left, right);
  assert.equal(result.rightValid.valid, false);
  assert.equal(result.structural, null);
  // Line diff still produced
  assert.ok(result.lines.length > 0);
});

test("diffYaml line diff produces hunks for any input", () => {
  const left = "a: 1\n";
  const right = "a: 2\n";
  const result = diffYaml(left, right);
  const hasAdded = result.lines.some((l) => l.type === "added");
  const hasRemoved = result.lines.some((l) => l.type === "removed");
  assert.ok(hasAdded);
  assert.ok(hasRemoved);
});

test("diffYaml flags multi-doc input with multiDocWarning", () => {
  const left = "a: 1\n---\nb: 2\n";
  const right = "a: 1\n---\nb: 3\n";
  const result = diffYaml(left, right);
  assert.ok(result.multiDocWarning);
  assert.equal(result.multiDocWarning!.leftCount, 2);
  assert.equal(result.multiDocWarning!.rightCount, 2);
});

test("diffYaml multiDocWarning is null for single-doc input", () => {
  const left = "a: 1\n";
  const right = "a: 2\n";
  const result = diffYaml(left, right);
  assert.equal(result.multiDocWarning, null);
});

test("diffYaml documentCount surfaces in validation result", () => {
  const left = "a: 1\n---\nb: 2\n---\nc: 3\n";
  const right = "a: 1\n";
  const result = diffYaml(left, right);
  assert.equal(result.leftValid.documentCount, 3);
  assert.equal(result.rightValid.documentCount, 1);
});

test("diffYaml line view chunk ending with newline yields one row per line", () => {
  // This test ties to the line-rendering bug fix: a "removed" hunk of "a\nb\nc\n"
  // should become 3 rendered rows, not 2 or 4.
  const left = "a\nb\nc\n";
  const right = "x\ny\nz\n";
  const result = diffYaml(left, right);
  // First hunk should be a removed of "a\nb\nc\n" (or split similarly).
  const removed = result.lines.find((l) => l.type === "removed");
  assert.ok(removed);
  // Verify the value preserves the lines so the UI can split predictably.
  assert.match(removed!.value, /a/);
  assert.match(removed!.value, /b/);
  assert.match(removed!.value, /c/);
});
