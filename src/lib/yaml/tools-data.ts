// ---------------------------------------------------------------------------
// Centralized data for YAML tools and topic reference pages (programmatic SEO)
// Mirrors src/lib/markdown/tools-data.ts pattern.
// ---------------------------------------------------------------------------

export interface YamlTool {
  slug: string;
  /** Full URL path the tool lives at - top-level tools may be outside /yaml-tools/. */
  path: string;
  name: string;
  shortName?: string;
  description: string;
  category: "converter" | "validator" | "editor" | "formatter" | "reference";
  keywords: string;
  /** Approximate monthly search volume (US, Apr 2026 Ahrefs). */
  searchVolume?: number;
}

export interface YamlTopic {
  slug: string;
  name: string;
  description: string;
  /** Comma-separated keyword cluster targeted by this page. */
  keywords: string;
  /** Approximate monthly search volume (US, Apr 2026 Ahrefs). */
  searchVolume?: number;
  /** Bespoke pages render their own page.tsx; non-bespoke fall back to /yaml-tools/[slug]. */
  bespoke?: boolean;
}

// ---------------------------------------------------------------------------
// Tool categories
// ---------------------------------------------------------------------------

export const YAML_TOOL_CATEGORIES = [
  {
    id: "converter",
    label: "Converters",
    description:
      "Convert YAML to JSON or JSON to YAML. Bidirectional conversion with copy, download, and upload.",
  },
  {
    id: "validator",
    label: "Validators & Linters",
    description:
      "Catch syntax errors, indentation problems, and structural issues with line-and-column precision.",
  },
  {
    id: "formatter",
    label: "Formatters & Beautifiers",
    description:
      "Pretty-print, normalize indentation, and sort keys for consistent YAML output.",
  },
  {
    id: "editor",
    label: "Editors",
    description:
      "Browser-based YAML editors with live preview, autosave, and syntax highlighting.",
  },
  {
    id: "reference",
    label: "Guides & References",
    description:
      "Plain-language guides to YAML syntax, patterns, and tool-specific quirks.",
  },
] as const;

// ---------------------------------------------------------------------------
// Standalone tools (each has a top-level page)
// ---------------------------------------------------------------------------

export const YAML_TOOLS: YamlTool[] = [
  {
    slug: "yaml-validator",
    path: "/yaml-validator",
    name: "YAML Validator",
    shortName: "Validator",
    description:
      "Validate YAML syntax instantly. Spot errors with line and column numbers, see detailed messages, and confirm files are well-formed before deployment.",
    category: "validator",
    keywords:
      "yaml validator, yaml lint, yaml linter, yaml checker, yaml syntax checker, validate yaml, yaml file validator, yaml linting tool, online yaml validator",
    searchVolume: 7800,
  },
  {
    slug: "yaml-to-json",
    path: "/yaml-to-json",
    name: "YAML to JSON Converter",
    shortName: "YAML to JSON",
    description:
      "Convert YAML to JSON in your browser. Supports anchors, aliases, multiline strings, and nested structures. Copy, download, or upload files.",
    category: "converter",
    keywords:
      "yaml to json, convert yaml to json, yaml to json converter, yaml to json online, yml to json, yaml to json parser",
    searchVolume: 3700,
  },
  {
    slug: "json-to-yaml",
    path: "/json-to-yaml",
    name: "JSON to YAML Converter",
    shortName: "JSON to YAML",
    description:
      "Convert JSON to YAML with custom indentation and key sorting. Safe in-browser conversion, no data leaves your device.",
    category: "converter",
    keywords:
      "json to yaml, convert json to yaml, json to yaml converter, json to yaml online, json to yml, json to yaml parser",
    searchVolume: 3500,
  },
  {
    slug: "yaml-formatter",
    path: "/yaml-formatter",
    name: "YAML Formatter & Beautifier",
    shortName: "Formatter",
    description:
      "Format and beautify YAML files. Choose 2 or 4 space indentation, sort keys alphabetically, and produce consistent, diff-friendly output.",
    category: "formatter",
    keywords:
      "yaml formatter, yaml beautifier, yaml pretty print, yaml viewer, format yaml, yaml indent, beautify yaml online",
    searchVolume: 1400,
  },
  {
    slug: "yaml-editor",
    path: "/yaml-editor",
    name: "YAML Editor",
    shortName: "Editor",
    description:
      "Edit YAML in the browser with live validation, syntax highlighting, and localStorage autosave. No signup required.",
    category: "editor",
    keywords:
      "yaml editor, online yaml editor, yaml editor online, edit yaml, browser yaml editor, yaml ide",
    searchVolume: 500,
  },
  {
    slug: "yaml-diff",
    path: "/yaml-diff",
    name: "YAML Diff",
    shortName: "Diff",
    description:
      "Compare two YAML files side by side. See added, removed, and changed keys highlighted at the line and structure level.",
    category: "validator",
    keywords:
      "yaml diff, compare yaml, yaml comparison, yaml difference, diff yaml files, yaml compare online",
    searchVolume: 250,
  },
];

// ---------------------------------------------------------------------------
// Long-form references that live as their own pages (not /yaml-tools/[slug])
// ---------------------------------------------------------------------------

export const YAML_TOP_LEVEL_REFERENCES: YamlTool[] = [
  {
    slug: "yaml-guide",
    path: "/yaml-guide",
    name: "YAML Guide: What Is YAML?",
    shortName: "YAML Guide",
    description:
      "Complete plain-English YAML guide. Covers what YAML stands for, file format, syntax rules, and how it compares with JSON and XML.",
    category: "reference",
    keywords:
      "what is yaml, yaml meaning, what does yaml stand for, yaml stands for, yaml full form, yaml language, what is a yaml file, yaml file format, .yaml",
    searchVolume: 6000,
  },
];

// ---------------------------------------------------------------------------
// PSEO topics (rendered at /yaml-tools/[slug])
// ---------------------------------------------------------------------------

export const YAML_TOPICS: YamlTopic[] = [
  {
    slug: "comments",
    name: "YAML Comments",
    description:
      "Add single-line and multiline comments in YAML files. Covers the # syntax, gotchas, and tool-specific behavior.",
    keywords:
      "yaml comments, yaml comment, comments in yaml, comment in yaml, yaml multiline comment, yaml block comment, yaml file comment",
    searchVolume: 2500,
    bespoke: true,
  },
  {
    slug: "multiline-strings",
    name: "YAML Multiline Strings",
    description:
      "Block scalars in YAML: literal (|), folded (>), chomping indicators, and how to embed newlines and special characters cleanly.",
    keywords:
      "yaml multiline string, yaml multiline, yaml block scalar, yaml literal block, yaml folded scalar, yaml string newlines",
    searchVolume: 900,
    bespoke: true,
  },
  {
    slug: "yaml-vs-json",
    name: "YAML vs JSON",
    description:
      "Detailed YAML vs JSON comparison: syntax, comments, file size, parser support, and when to choose each.",
    keywords:
      "yaml vs json, json vs yaml, yaml or json, yaml json comparison, difference between yaml and json",
    searchVolume: 1400,
    bespoke: true,
  },
  {
    slug: "yml-vs-yaml",
    name: "YML vs YAML",
    description:
      "Are .yml and .yaml the same? Complete answer with history, tool support matrix, and recommendations.",
    keywords:
      "yml vs yaml, yaml vs yml, .yml vs .yaml, yml or yaml, difference between yml and yaml",
    searchVolume: 1100,
    bespoke: true,
  },
  {
    slug: "no-module-named-yaml",
    name: "ModuleNotFoundError: No module named 'yaml'",
    description:
      "Fix the Python ImportError when 'yaml' is missing. Covers pip install pyyaml, virtual environments, Conda, and macOS path issues.",
    keywords:
      "modulenotfounderror: no module named 'yaml', no module named yaml, no module named 'yaml', pip install yaml, install pyyaml",
    searchVolume: 1450,
    bespoke: true,
  },
  {
    slug: "python",
    name: "YAML in Python (PyYAML Guide)",
    description:
      "Read, write, and manipulate YAML in Python with PyYAML. Covers safe_load, dump, ruamel.yaml, common errors, and best practices.",
    keywords:
      "python yaml, yaml python, python read yaml, python import yaml, python yaml package, pyyaml, ruamel.yaml",
    searchVolume: 3000,
    bespoke: true,
  },
  {
    slug: "arrays-and-lists",
    name: "YAML Arrays, Lists, and Dictionaries",
    description:
      "Block and flow sequences, nested lists, lists of maps, and YAML dictionaries explained with copy-ready examples.",
    keywords:
      "yaml list, yaml array, yaml dictionary, yaml variables, yaml lists, yaml nested array, yaml list of maps",
    searchVolume: 1350,
    bespoke: true,
  },
  {
    slug: "anchors",
    name: "YAML Anchors, Aliases, and Merge Keys",
    description:
      "Reuse YAML data with anchors (&), aliases (*), and merge keys (<<:). Avoid duplication across environments and Compose services.",
    keywords:
      "yaml anchors, yaml alias, yaml merge key, yaml reference, yaml anchor and alias, yaml dry",
    searchVolume: 600,
    bespoke: true,
  },
  {
    slug: "kubernetes",
    name: "Kubernetes YAML: Deployments and Manifests",
    description:
      "Anatomy of Kubernetes Deployment, Service, ConfigMap, and Secret manifests with copy-ready YAML examples and common errors.",
    keywords:
      "kubernetes deployment yaml, kubernetes deployment yaml example nginx, k8s yaml, kubernetes manifest, kubectl apply yaml",
    searchVolume: 500,
    bespoke: true,
  },
  {
    slug: "syntax",
    name: "YAML Syntax Reference",
    description:
      "Complete YAML 1.2 syntax reference: scalars, sequences, mappings, indentation rules, comments, anchors, multiline, and full examples.",
    keywords:
      "yaml syntax, yaml format, yaml example, yaml code, yaml structure, yaml language reference, yaml cheat sheet",
    searchVolume: 2500,
    bespoke: true,
  },
  {
    slug: "docker-compose",
    name: "Docker Compose YAML Guide",
    description:
      "Service definitions, networks, volumes, env_file, depends_on, profiles, and anchor reuse in docker-compose.yml and compose.yaml.",
    keywords:
      "docker compose yaml, compose.yaml, docker-compose.yml, docker compose example, compose file, docker compose services",
    searchVolume: 250,
    bespoke: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getToolsByCategory(category: YamlTool["category"]): YamlTool[] {
  return YAML_TOOLS.filter((tool) => tool.category === category);
}

export function getRelatedTools(currentPath: string, limit: number = 4): YamlTool[] {
  const all = [...YAML_TOOLS, ...YAML_TOP_LEVEL_REFERENCES];
  return all.filter((t) => t.path !== currentPath).slice(0, limit);
}

export function getTopicBySlug(slug: string): YamlTopic | undefined {
  return YAML_TOPICS.find((t) => t.slug === slug);
}
