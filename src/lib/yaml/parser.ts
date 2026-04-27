import {
  parse as yamlParse,
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
  if (sizeError) return { valid: false, errors: [sizeError] };

  if (!input.trim()) {
    return { valid: false, errors: [{ line: 1, col: 1, message: "Input is empty." }] };
  }

  try {
    yamlParse(input, { merge: true });
    return { valid: true, errors: [] };
  } catch (err) {
    return { valid: false, errors: [toYamlError(input, err)] };
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

export function formatYaml(input: string, options?: { indent?: number; sortMapEntries?: boolean }): ConversionResult {
  const sizeError = tooLarge(input);
  if (sizeError) return { success: false, output: "", errors: [sizeError] };

  if (!input.trim()) {
    return { success: false, output: "", errors: [{ line: 1, col: 1, message: "Input is empty." }] };
  }

  try {
    const parsed = yamlParse(input, { merge: true });
    return {
      success: true,
      output: stringifyYaml(parsed, options),
      errors: [],
    };
  } catch (err) {
    return { success: false, output: "", errors: [toYamlError(input, err)] };
  }
}
