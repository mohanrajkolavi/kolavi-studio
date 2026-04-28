// ---------------------------------------------------------------------------
// YAML diff utilities. Two strategies:
//   1. Line-level text diff (using `diff` package) — fast, works on any input
//      including invalid YAML; mirrors what `git diff` shows.
//   2. Structural diff — parse both sides, walk the trees, return semantic
//      Change[] (added / removed / changed at a dotted path). Catches cases
//      where two YAML files are textually different but semantically equal
//      (key reordering, comment changes, indent changes).
// ---------------------------------------------------------------------------

import { diffLines, type Change as TextChange } from "diff";
import { parseYaml, type YamlValidationResult } from "./parser";
import { validateYaml } from "./parser";

export interface LineChange {
  type: "added" | "removed" | "unchanged";
  value: string;
  /** Number of lines in this hunk. */
  count: number;
}

export type StructuralChangeType = "added" | "removed" | "changed";

export interface StructuralChange {
  type: StructuralChangeType;
  /** Dotted path to the changed key, e.g. "spec.replicas" or "items[2].name". */
  path: string;
  leftValue?: unknown;
  rightValue?: unknown;
}

export interface YamlDiffResult {
  /** Line-level text diff; safe even when YAML is invalid. */
  lines: LineChange[];
  /** Structural diff; only present when both sides parsed successfully. */
  structural: StructuralChange[] | null;
  leftValid: YamlValidationResult;
  rightValid: YamlValidationResult;
  /** True when both sides parse to deep-equal values. */
  semanticallyEqual: boolean;
}

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}

function joinPath(base: string, segment: string | number): string {
  if (typeof segment === "number") return `${base}[${segment}]`;
  if (!base) return segment;
  return `${base}.${segment}`;
}

function walk(left: unknown, right: unknown, path: string, out: StructuralChange[]): void {
  if (deepEqual(left, right)) return;

  // Both are maps — recurse per key, the union of both key sets.
  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const k of keys) {
      const inLeft = k in left;
      const inRight = k in right;
      const next = joinPath(path, k);
      if (inLeft && !inRight) {
        out.push({ type: "removed", path: next, leftValue: left[k] });
      } else if (!inLeft && inRight) {
        out.push({ type: "added", path: next, rightValue: right[k] });
      } else {
        walk(left[k], right[k], next, out);
      }
    }
    return;
  }

  // Both are arrays — diff index by index.
  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length);
    for (let i = 0; i < max; i++) {
      const inLeft = i < left.length;
      const inRight = i < right.length;
      const next = joinPath(path, i);
      if (inLeft && !inRight) {
        out.push({ type: "removed", path: next, leftValue: left[i] });
      } else if (!inLeft && inRight) {
        out.push({ type: "added", path: next, rightValue: right[i] });
      } else {
        walk(left[i], right[i], next, out);
      }
    }
    return;
  }

  // Type mismatch or scalar change.
  out.push({ type: "changed", path: path || "(root)", leftValue: left, rightValue: right });
}

function lineChangesFromTextDiff(changes: TextChange[]): LineChange[] {
  return changes.map((c) => ({
    type: c.added ? "added" : c.removed ? "removed" : "unchanged",
    value: c.value,
    count: c.count ?? c.value.split("\n").length - 1,
  }));
}

export function diffYaml(left: string, right: string): YamlDiffResult {
  const leftBytes = new TextEncoder().encode(left).length;
  const rightBytes = new TextEncoder().encode(right).length;
  if (leftBytes > MAX_INPUT_BYTES || rightBytes > MAX_INPUT_BYTES) {
    throw new Error(
      `YAML input too large. Maximum is ${MAX_INPUT_BYTES} bytes per side.`,
    );
  }

  const leftValid = validateYaml(left);
  const rightValid = validateYaml(right);

  const lines = lineChangesFromTextDiff(diffLines(left, right));

  let structural: StructuralChange[] | null = null;
  let semanticallyEqual = false;

  if (leftValid.valid && rightValid.valid) {
    try {
      const leftTree = parseYaml(left);
      const rightTree = parseYaml(right);
      const out: StructuralChange[] = [];
      walk(leftTree, rightTree, "", out);
      structural = out;
      semanticallyEqual = out.length === 0;
    } catch {
      structural = null;
    }
  }

  return {
    lines,
    structural,
    leftValid,
    rightValid,
    semanticallyEqual,
  };
}
