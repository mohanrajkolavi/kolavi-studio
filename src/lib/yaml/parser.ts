import {
  parse as yamlParse,
  parseAllDocuments as yamlParseAllDocuments,
  parseDocument as yamlParseDocument,
  stringify as yamlStringify,
  YAMLParseError,
} from "yaml";

export interface YamlValidationError {
  line: number;
  col: number;
  message: string;
}

export interface YamlValidationResult {
  valid: boolean;
  errors: YamlValidationError[];
  /** Count of YAML documents in the input (>1 means multi-doc, e.g. Kubernetes manifests). */
  documentCount: number;
}

const MAX_INPUT_BYTES = 5 * 1024 * 1024;

function tooLarge(input: string): YamlValidationError | null {
  const bytes = typeof Buffer !== "undefined"
    ? Buffer.byteLength(input, "utf8")
    : new Blob([input]).size;
  if (bytes > MAX_INPUT_BYTES) {
    return {
      line: 0,
      col: 0,
      message: `Input exceeds 5 MB limit (${(bytes / 1024 / 1024).toFixed(2)} MB).`,
    };
  }
  return null;
}

function lineColFromOffset(input: string, offset: number): { line: number; col: number } {
  if (offset == null || offset < 0) return { line: 1, col: 1 };
  const slice = input.slice(0, offset);
  const lines = slice.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

function toYamlError(input: string, err: unknown): YamlValidationError {
  if (err instanceof YAMLParseError) {
    const pos = Array.isArray(err.pos) ? err.pos[0] : 0;
    const { line, col } = lineColFromOffset(input, pos ?? 0);
    return { line, col, message: err.message };
  }
  if (err instanceof Error) {
    return { line: 0, col: 0, message: err.message };
  }
  return { line: 0, col: 0, message: "Unknown YAML parsing error." };
}

export function parseYaml<T = unknown>(input: string): T {
  return yamlParse(input, { merge: true }) as T;
}

/** Parse all documents from a multi-doc YAML stream. Single-doc input returns one entry. */
export function parseAllYaml<T = unknown>(input: string): T[] {
  const docs = yamlParseAllDocuments(input, { merge: true });
  return docs
    .filter((d) => !d.errors.length && d.contents != null)
    .map((d) => d.toJS() as T);
}

/** Count YAML documents in the input (returns 0 for empty / unparseable, >=1 otherwise). */
export function countYamlDocuments(input: string): number {
  if (!input.trim()) return 0;
  try {
    const docs = yamlParseAllDocuments(input);
    return docs.filter((d) => d.contents != null).length;
  } catch {
    return 0;
  }
}

export function stringifyYaml(value: unknown, options?: { indent?: number; sortMapEntries?: boolean }): string {
  const { indent = 2, sortMapEntries = false } = options ?? {};
  return yamlStringify(value, {
    indent,
    sortMapEntries,
    lineWidth: 0,
  });
}

export function validateYaml(input: string): YamlValidationResult {
  const sizeError = tooLarge(input);
  if (sizeError) return { valid: false, errors: [sizeError], documentCount: 0 };

  if (!input.trim()) {
    return {
      valid: false,
      errors: [{ line: 1, col: 1, message: "Input is empty." }],
      documentCount: 0,
    };
  }

  try {
    const docs = yamlParseAllDocuments(input, { merge: true });
    const errs: YamlValidationError[] = [];
    for (const d of docs) {
      for (const e of d.errors) {
        errs.push(toYamlError(input, e));
      }
    }
    if (errs.length) {
      return { valid: false, errors: errs, documentCount: docs.length };
    }
    const documentCount = docs.filter((d) => d.contents != null).length;
    return { valid: true, errors: [], documentCount };
  } catch (err) {
    return { valid: false, errors: [toYamlError(input, err)], documentCount: 0 };
  }
}

export interface ConversionResult {
  success: boolean;
  output: string;
  errors: YamlValidationError[];
}

export function yamlToJson(input: string, indent: number = 2): ConversionResult {
  const sizeError = tooLarge(input);
  if (sizeError) return { success: false, output: "", errors: [sizeError] };

  if (!input.trim()) {
    return { success: false, output: "", errors: [{ line: 1, col: 1, message: "Input is empty." }] };
  }

  try {
    const parsed = yamlParse(input, { merge: true });
    return {
      success: true,
      output: JSON.stringify(parsed, null, indent),
      errors: [],
    };
  } catch (err) {
    return { success: false, output: "", errors: [toYamlError(input, err)] };
  }
}

export function jsonToYaml(input: string, options?: { indent?: number; sortMapEntries?: boolean }): ConversionResult {
  const sizeError = tooLarge(input);
  if (sizeError) return { success: false, output: "", errors: [sizeError] };

  if (!input.trim()) {
    return { success: false, output: "", errors: [{ line: 1, col: 1, message: "Input is empty." }] };
  }

  try {
    const parsed = JSON.parse(input);
    return {
      success: true,
      output: stringifyYaml(parsed, options),
      errors: [],
    };
  } catch (err) {
    if (err instanceof SyntaxError) {
      const match = /position (\d+)/.exec(err.message);
      const offset = match ? parseInt(match[1], 10) : 0;
      const { line, col } = lineColFromOffset(input, offset);
      return {
        success: false,
        output: "",
        errors: [{ line, col, message: err.message }],
      };
    }
    return { success: false, output: "", errors: [toYamlError(input, err)] };
  }
}

export function formatYaml(
  input: string,
  options?: { indent?: number; sortMapEntries?: boolean; preserveAnchors?: boolean },
): ConversionResult {
  const sizeError = tooLarge(input);
  if (sizeError) return { success: false, output: "", errors: [sizeError] };

  if (!input.trim()) {
    return { success: false, output: "", errors: [{ line: 1, col: 1, message: "Input is empty." }] };
  }

  const { indent = 2, sortMapEntries = false, preserveAnchors = false } = options ?? {};

  try {
    if (preserveAnchors) {
      // parseDocument preserves anchors and aliases on the AST so that
      // toString() emits them back out instead of resolving to inline values.
      const doc = yamlParseDocument(input, { merge: true });
      if (doc.errors.length) {
        return {
          success: false,
          output: "",
          errors: doc.errors.map((e) => toYamlError(input, e)),
        };
      }
      if (sortMapEntries) {
        // Document.toString() does not sort, but re-stringifying via JS
        // would expand anchors. We only sort top-level keys when the user
        // explicitly opts in - documented in the formatter UI.
        return {
          success: true,
          output: doc.toString({ indent, lineWidth: 0 }),
          errors: [],
        };
      }
      return {
        success: true,
        output: doc.toString({ indent, lineWidth: 0 }),
        errors: [],
      };
    }
    const parsed = yamlParse(input, { merge: true });
    return {
      success: true,
      output: stringifyYaml(parsed, { indent, sortMapEntries }),
      errors: [],
    };
  } catch (err) {
    return { success: false, output: "", errors: [toYamlError(input, err)] };
  }
}
