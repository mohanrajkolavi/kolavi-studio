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
