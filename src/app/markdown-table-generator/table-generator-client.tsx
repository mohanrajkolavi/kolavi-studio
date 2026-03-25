"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/markdown-tools/ToolLayout";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { parseMarkdown } from "@/lib/markdown/parser";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Alignment = "left" | "center" | "right";

interface TableState {
  headers: string[];
  rows: string[][];
  alignments: Alignment[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "md-table-state";

function defaultTable(): TableState {
  return {
    headers: ["Header 1", "Header 2", "Header 3"],
    rows: [
      ["", "", ""],
      ["", "", ""],
    ],
    alignments: ["left", "left", "left"],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializeState(state: TableState): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(state)));
  } catch {
    return "";
  }
}

function deserializeState(encoded: string): TableState | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as TableState;
  } catch {
    return null;
  }
}

function escapeCell(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function generateMarkdown(state: TableState): string {
  const { headers, rows, alignments } = state;
  const cols = headers.length;

  // Compute column widths (minimum 5 to fit alignment markers)
  const widths = Array.from({ length: cols }, (_, ci) => {
    const headerLen = escapeCell(headers[ci]).length;
    const maxRow = rows.reduce(
      (max, row) => Math.max(max, escapeCell(row[ci] ?? "").length),
      0,
    );
    return Math.max(5, headerLen, maxRow);
  });

  const pad = (text: string, width: number, align: Alignment) => {
    const t = escapeCell(text);
    const diff = width - t.length;
    if (diff <= 0) return t;
    if (align === "right") return " ".repeat(diff) + t;
    if (align === "center") {
      const left = Math.floor(diff / 2);
      return " ".repeat(left) + t + " ".repeat(diff - left);
    }
    return t + " ".repeat(diff);
  };

  const headerLine =
    "| " +
    headers.map((h, i) => pad(h, widths[i], alignments[i])).join(" | ") +
    " |";

  const separatorLine =
    "| " +
    alignments
      .map((a, i) => {
        const inner = widths[i];
        const base = "-".repeat(inner);
        if (a === "center") return ":" + base.slice(1, -1) + ":";
        if (a === "right") return base.slice(0, -1) + ":";
        return ":" + base.slice(1);
      })
      .join(" | ") +
    " |";

  const dataLines = rows.map(
    (row) =>
      "| " +
      row
        .map((cell, i) => pad(cell ?? "", widths[i], alignments[i]))
        .join(" | ") +
      " |",
  );

  return [headerLine, separatorLine, ...dataLines].join("\n");
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [""], rows: [[""]] };

  const split = (line: string) =>
    line.split(/[,\t]/).map((c) => c.replace(/^["']|["']$/g, "").trim());

  const headers = split(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = split(l);
    while (cells.length < headers.length) cells.push("");
    return cells.slice(0, headers.length);
  });

  if (rows.length === 0) rows.push(headers.map(() => ""));

  return { headers, rows };
}

// ---------------------------------------------------------------------------
// CSV Import Modal
// ---------------------------------------------------------------------------

function CSVImportModal({
  onImport,
  onClose,
}: {
  onImport: (csv: string) => void;
  onClose: () => void;
}) {
  const [csv, setCsv] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background border-border w-full max-w-lg rounded-lg border p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Import CSV</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <textarea
          ref={textareaRef}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={
            "Paste CSV or tab-separated data here...\n\nName, Age, City\nAlice, 30, NYC\nBob, 25, LA"
          }
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mb-4 flex min-h-[160px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (csv.trim()) onImport(csv);
            }}
            disabled={!csv.trim()}
          >
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TableGeneratorClient
// ---------------------------------------------------------------------------

export function TableGeneratorClient() {
  const [table, setTable] = useState<TableState>(defaultTable);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  // Load state on mount: URL ?c= takes precedence, then localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("c");
    if (encoded) {
      const restored = deserializeState(encoded);
      if (restored) {
        setTable(restored);
        setMounted(true);
        return;
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TableState;
        if (parsed.headers && parsed.rows && parsed.alignments) {
          setTable(parsed);
        }
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(table));
    } catch {
      // ignore
    }
  }, [table, mounted]);

  // Update URL ?c= param
  useEffect(() => {
    if (!mounted) return;
    const encoded = serializeState(table);
    if (!encoded) return;
    const url = new URL(window.location.href);
    url.searchParams.set("c", encoded);
    window.history.replaceState(null, "", url.toString());
  }, [table, mounted]);

  // ---- Mutations ----

  const updateHeader = useCallback((col: number, value: string) => {
    setTable((prev) => {
      const headers = [...prev.headers];
      headers[col] = value;
      return { ...prev, headers };
    });
  }, []);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    setTable((prev) => {
      const rows = prev.rows.map((r) => [...r]);
      rows[row][col] = value;
      return { ...prev, rows };
    });
  }, []);

  const setAlignment = useCallback((col: number, alignment: Alignment) => {
    setTable((prev) => {
      const alignments = [...prev.alignments];
      alignments[col] = alignment;
      return { ...prev, alignments };
    });
  }, []);

  const addRow = useCallback(() => {
    setTable((prev) => ({
      ...prev,
      rows: [...prev.rows, Array(prev.headers.length).fill("")],
    }));
  }, []);

  const addColumn = useCallback(() => {
    setTable((prev) => ({
      headers: [...prev.headers, `Header ${prev.headers.length + 1}`],
      rows: prev.rows.map((r) => [...r, ""]),
      alignments: [...prev.alignments, "left"],
    }));
  }, []);

  const deleteRow = useCallback(
    (rowIndex: number) => {
      if (table.rows.length <= 1) return;
      setTable((prev) => ({
        ...prev,
        rows: prev.rows.filter((_, i) => i !== rowIndex),
      }));
      setHoveredRow(null);
    },
    [table.rows.length],
  );

  const deleteColumn = useCallback(
    (colIndex: number) => {
      if (table.headers.length <= 1) return;
      setTable((prev) => ({
        headers: prev.headers.filter((_, i) => i !== colIndex),
        rows: prev.rows.map((r) => r.filter((_, i) => i !== colIndex)),
        alignments: prev.alignments.filter((_, i) => i !== colIndex),
      }));
      setHoveredCol(null);
    },
    [table.headers.length],
  );

  const handleCSVImport = useCallback((csv: string) => {
    const { headers, rows } = parseCSV(csv);
    setTable({
      headers,
      rows,
      alignments: headers.map(() => "left" as Alignment),
    });
    setShowCSVModal(false);
  }, []);

  // ---- Derived ----

  const markdown = useMemo(() => generateMarkdown(table), [table]);

  const previewHtml = useMemo(
    () => parseMarkdown(markdown, { gfm: true, sanitize: true }),
    [markdown],
  );

  if (!mounted) {
    return null;
  }

  const cols = table.headers.length;

  return (
    <ToolLayout
      title="Markdown Table Generator"
      description="Generate markdown tables instantly. Paste CSV or build visually."
      currentPath="/markdown-table-generator"
    >
      <div className="space-y-8">
        {/* ---- Table Builder ---- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Table Builder</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCSVModal(true)}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Column alignment controls */}
              <thead>
                <tr>
                  {/* gutter for row delete */}
                  <th className="w-8" />
                  {table.headers.map((_, ci) => (
                    <th key={ci} className="px-1 pb-1">
                      <div className="flex items-center justify-center gap-0.5">
                        {(
                          [
                            ["left", AlignLeft],
                            ["center", AlignCenter],
                            ["right", AlignRight],
                          ] as const
                        ).map(([align, Icon]) => (
                          <Button
                            key={align}
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7",
                              table.alignments[ci] === align &&
                                "bg-accent text-accent-foreground",
                            )}
                            onClick={() => setAlignment(ci, align)}
                            aria-label={`Align column ${ci + 1} ${align}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </Button>
                        ))}
                        {cols > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive",
                              hoveredCol === ci && "opacity-100",
                            )}
                            onMouseEnter={() => setHoveredCol(ci)}
                            onMouseLeave={() => setHoveredCol(null)}
                            onClick={() => deleteColumn(ci)}
                            aria-label={`Delete column ${ci + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>

                {/* Header row */}
                <tr>
                  <td className="w-8" />
                  {table.headers.map((header, ci) => (
                    <td key={ci} className="p-0.5">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => updateHeader(ci, e.target.value)}
                        className="bg-muted border-input w-full rounded-md border px-2 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-ring focus:outline-none"
                        aria-label={`Header column ${ci + 1}`}
                      />
                    </td>
                  ))}
                </tr>
              </thead>

              {/* Data rows */}
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    onMouseEnter={() => setHoveredRow(ri)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="w-8 align-middle">
                      {table.rows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive",
                            hoveredRow === ri && "opacity-100",
                          )}
                          onClick={() => deleteRow(ri)}
                          aria-label={`Delete row ${ri + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                    {row.map((cell, ci) => (
                      <td key={ci} className="p-0.5">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(ri, ci, e.target.value)}
                          className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                          aria-label={`Row ${ri + 1}, Column ${ci + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Row
            </Button>
            <Button variant="outline" size="sm" onClick={addColumn}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Column
            </Button>
          </div>
        </section>

        {/* ---- Markdown Output ---- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Markdown Output</h2>
            <div className="flex gap-2">
              <CopyButton content={markdown} label="Copy" />
              <DownloadButton
                content={markdown}
                filename="table.md"
                mimeType="text/markdown"
                label="Download"
              />
            </div>
          </div>
          <pre className="bg-muted overflow-x-auto rounded-lg border p-4 text-sm leading-relaxed">
            {markdown}
          </pre>
        </section>

        {/* ---- Rendered Preview ---- */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Preview</h2>
          <div
            className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto rounded-lg border p-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </section>
      </div>

      {/* CSV Import Modal */}
      {showCSVModal && (
        <CSVImportModal
          onImport={handleCSVImport}
          onClose={() => setShowCSVModal(false)}
        />
      )}
    </ToolLayout>
  );
}
