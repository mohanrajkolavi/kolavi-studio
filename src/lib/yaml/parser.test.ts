import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseYaml,
  parseAllYaml,
  countYamlDocuments,
  stringifyYaml,
  validateYaml,
  yamlToJson,
  jsonToYaml,
  formatYaml,
} from "./parser";

test("parseYaml parses a simple scalar map", () => {
  const result = parseYaml<{ name: string; age: number }>("name: Alice\nage: 30\n");
  assert.deepEqual(result, { name: "Alice", age: 30 });
});

test("parseYaml parses nested maps and lists", () => {
  const yaml = "users:\n  - name: Alice\n    role: admin\n  - name: Bob\n    role: user\n";
  const result = parseYaml<{ users: { name: string; role: string }[] }>(yaml);
  assert.equal(result.users.length, 2);
  assert.equal(result.users[0].name, "Alice");
  assert.equal(result.users[1].role, "user");
});

test("validateYaml returns valid for correct YAML", () => {
  const result = validateYaml("foo: bar\nbaz: 42\n");
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("validateYaml returns errors for invalid YAML", () => {
  const result = validateYaml("foo: bar\n  baz: : :\n");
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors[0].message.length > 0);
});

test("validateYaml flags empty input", () => {
  const result = validateYaml("   ");
  assert.equal(result.valid, false);
  assert.equal(result.errors[0].message, "Input is empty.");
});

test("yamlToJson converts simple map", () => {
  const result = yamlToJson("name: Alice\nage: 30\n");
  assert.equal(result.success, true);
  assert.equal(JSON.parse(result.output).name, "Alice");
  assert.equal(JSON.parse(result.output).age, 30);
});

test("yamlToJson handles nested structures with anchors", () => {
  const yaml = "default: &def\n  retries: 3\n  timeout: 30\nprod:\n  <<: *def\n  retries: 5\n";
  const result = yamlToJson(yaml);
  assert.equal(result.success, true);
  const parsed = JSON.parse(result.output);
  assert.equal(parsed.prod.retries, 5);
  assert.equal(parsed.prod.timeout, 30);
});

test("yamlToJson reports line/col on error", () => {
  const result = yamlToJson("foo:\n  - bar\n  -baz\n  invalid: : :\n");
  assert.equal(result.success, false);
  assert.ok(result.errors[0].line >= 1);
});

test("jsonToYaml converts simple object", () => {
  const result = jsonToYaml('{"name":"Alice","age":30}');
  assert.equal(result.success, true);
  assert.match(result.output, /name: Alice/);
  assert.match(result.output, /age: 30/);
});

test("jsonToYaml respects indent option", () => {
  const result = jsonToYaml('{"a":{"b":"c"}}', { indent: 4 });
  assert.equal(result.success, true);
  assert.match(result.output, /a:\n {4}b: c/);
});

test("jsonToYaml flags invalid JSON with line/col", () => {
  const result = jsonToYaml('{"name": "Alice",}');
  assert.equal(result.success, false);
  assert.ok(result.errors.length > 0);
});

test("formatYaml normalizes spacing and indentation", () => {
  const ugly = "foo:    bar\nbaz:\n   - one\n   - two\n";
  const result = formatYaml(ugly, { indent: 2 });
  assert.equal(result.success, true);
  assert.match(result.output, /foo: bar/);
});

test("formatYaml can sort keys", () => {
  const result = formatYaml("zebra: 1\napple: 2\n", { sortMapEntries: true });
  assert.equal(result.success, true);
  const lines = result.output.trim().split("\n");
  assert.equal(lines[0], "apple: 2");
  assert.equal(lines[1], "zebra: 1");
});

test("stringifyYaml renders multiline strings", () => {
  const obj = { description: "line1\nline2\nline3" };
  const yaml = stringifyYaml(obj);
  assert.match(yaml, /description:/);
  assert.match(yaml, /line1/);
});

test("validateYaml reports documentCount = 1 for single-doc input", () => {
  const result = validateYaml("name: app\nversion: 1.0\n");
  assert.equal(result.valid, true);
  assert.equal(result.documentCount, 1);
});

test("validateYaml reports documentCount > 1 for multi-doc input", () => {
  const yaml = "name: a\n---\nname: b\n---\nname: c\n";
  const result = validateYaml(yaml);
  assert.equal(result.valid, true);
  assert.equal(result.documentCount, 3);
});

test("validateYaml documentCount = 0 for empty input", () => {
  const result = validateYaml("");
  assert.equal(result.valid, false);
  assert.equal(result.documentCount, 0);
});

test("countYamlDocuments returns the doc count", () => {
  assert.equal(countYamlDocuments(""), 0);
  assert.equal(countYamlDocuments("a: 1\n"), 1);
  assert.equal(countYamlDocuments("a: 1\n---\nb: 2\n"), 2);
  assert.equal(countYamlDocuments("a: 1\n---\nb: 2\n---\nc: 3\n"), 3);
});

test("parseAllYaml returns all documents", () => {
  const yaml = "name: a\n---\nname: b\n";
  const docs = parseAllYaml<{ name: string }>(yaml);
  assert.equal(docs.length, 2);
  assert.equal(docs[0].name, "a");
  assert.equal(docs[1].name, "b");
});

test("parseAllYaml handles single-doc input as one entry", () => {
  const docs = parseAllYaml<{ name: string }>("name: solo\n");
  assert.equal(docs.length, 1);
  assert.equal(docs[0].name, "solo");
});
