/**
 * Markdown formatter/beautifier.
 * Applies consistent formatting rules to messy markdown.
 */

export function formatMarkdown(input: string): string {
  let text = input;

  // 1. Normalize line endings to \n
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 6. Remove trailing whitespace from every line (do early so other rules work on clean lines)
  text = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

  // 5. Replace __bold__ with **bold** and _italic_ with *italic*
  // Handle bold first (double underscores)
  text = text.replace(/__((?:[^_]|_(?!_))+?)__/g, "**$1**");
  // Handle italic (single underscores, but not inside words)
  text = text.replace(/(?<!\w)_((?:[^_\n])+?)_(?!\w)/g, "*$1*");

  // 2. Ensure single blank line before and after each heading
  text = text.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");
  text = text.replace(/(#{1,6}\s[^\n]+)\n([^\n])/g, "$1\n\n$2");

  // 3. Ensure single blank line before and after code fences
  text = text.replace(/([^\n])\n(```)/g, "$1\n\n$2");
  text = text.replace(/(```[^\n]*)\n([^\n])/g, "$1\n\n$2");

  // 4. Normalize list indentation to 2 spaces
  const lines = text.split("\n");
  const formatted: string[] = [];
  for (const line of lines) {
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/);
    if (listMatch) {
      const rawIndent = listMatch[1];
      // Calculate nesting level: every 2-4 spaces = 1 level
      const level = rawIndent.length > 0 ? Math.round(rawIndent.length / 2) : 0;
      const normalizedIndent = "  ".repeat(level);
      formatted.push(line.replace(/^\s*/, normalizedIndent));
    } else {
      formatted.push(line);
    }
  }
  text = formatted.join("\n");

  // 7. Collapse 3+ consecutive blank lines to 1
  text = text.replace(/\n{3,}/g, "\n\n");

  // 8. Ensure file ends with a single newline
  text = text.trimEnd() + "\n";

  return text;
}

/**
 * Simple line-by-line diff for display purposes.
 */
export interface DiffLine {
  type: "same" | "added" | "removed";
  content: string;
  lineNumber: number;
}

export function diffLines(original: string, formatted: string): DiffLine[] {
  const origLines = original.split("\n");
  const fmtLines = formatted.split("\n");
  const result: DiffLine[] = [];

  const maxLen = Math.max(origLines.length, fmtLines.length);
  let origIdx = 0;
  let fmtIdx = 0;

  while (origIdx < origLines.length || fmtIdx < fmtLines.length) {
    const origLine = origIdx < origLines.length ? origLines[origIdx] : undefined;
    const fmtLine = fmtIdx < fmtLines.length ? fmtLines[fmtIdx] : undefined;

    if (origLine === fmtLine) {
      result.push({
        type: "same",
        content: fmtLine ?? "",
        lineNumber: fmtIdx + 1,
      });
      origIdx++;
      fmtIdx++;
    } else if (origLine !== undefined && (fmtLine === undefined || origLine !== fmtLine)) {
      // Check if this line was removed (exists in original but not in formatted nearby)
      if (fmtLine !== undefined) {
        result.push({
          type: "removed",
          content: origLine,
          lineNumber: origIdx + 1,
        });
        result.push({
          type: "added",
          content: fmtLine,
          lineNumber: fmtIdx + 1,
        });
        origIdx++;
        fmtIdx++;
      } else {
        result.push({
          type: "removed",
          content: origLine,
          lineNumber: origIdx + 1,
        });
        origIdx++;
      }
    } else if (fmtLine !== undefined) {
      result.push({
        type: "added",
        content: fmtLine,
        lineNumber: fmtIdx + 1,
      });
      fmtIdx++;
    }
  }

  return result;
}
