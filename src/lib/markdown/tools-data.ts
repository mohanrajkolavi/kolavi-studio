// ---------------------------------------------------------------------------
// Centralized data for 40+ markdown tool/app reference pages (programmatic SEO)
// ---------------------------------------------------------------------------

export interface MarkdownToolSyntax {
  format: string;
  syntax: string;
  support: "yes" | "no" | "partial";
  notes?: string;
}

export interface MarkdownTool {
  slug: string;
  name: string;
  description: string;
  category:
    | "note-taking"
    | "documentation"
    | "collaboration"
    | "website-cms"
    | "developer-tool"
    | "social-messaging";
  markdownSupport: "full" | "partial" | "gfm" | "custom";
  intro: string;
  syntaxSupport: MarkdownToolSyntax[];
  quirks?: string[];
  faqs: { question: string; answer: string }[];
  officialUrl: string;
  keywords: string;
  /** When set, the tool already has a dedicated page and should not get a /markdown-tools/[slug] route. */
  externalPath?: string;
}

// ---------------------------------------------------------------------------
// Category definitions for the hub page
// ---------------------------------------------------------------------------

export const TOOL_CATEGORIES = [
  {
    id: "note-taking",
    label: "Note-Taking Apps",
    description:
      "Popular note-taking apps and how they handle markdown formatting, from full CommonMark support to custom flavors.",
  },
  {
    id: "documentation",
    label: "Documentation Platforms",
    description:
      "Static site generators and documentation platforms that use markdown as their primary content format.",
  },
  {
    id: "collaboration",
    label: "Collaboration Tools",
    description:
      "Project management and collaboration platforms with built-in markdown support for team communication.",
  },
  {
    id: "website-cms",
    label: "Website & CMS Platforms",
    description:
      "Content management systems and website builders that support markdown for creating web content.",
  },
  {
    id: "developer-tool",
    label: "Developer Tools",
    description:
      "Code editors, preview apps, and developer-focused markdown tools for writing and previewing content.",
  },
  {
    id: "social-messaging",
    label: "Social & Messaging Platforms",
    description:
      "Social media and messaging platforms that support markdown or markdown-like formatting in posts and messages.",
  },
] as const;

// ---------------------------------------------------------------------------
// Reusable syntax-support presets
// ---------------------------------------------------------------------------

function fullSyntax(overrides?: Partial<Record<string, Partial<MarkdownToolSyntax>>>): MarkdownToolSyntax[] {
  const base: MarkdownToolSyntax[] = [
    { format: "Bold", syntax: "**text**", support: "yes" },
    { format: "Italic", syntax: "*text*", support: "yes" },
    { format: "Strikethrough", syntax: "~~text~~", support: "yes" },
    { format: "Headings", syntax: "# H1 ... ###### H6", support: "yes" },
    { format: "Links", syntax: "[text](url)", support: "yes" },
    { format: "Images", syntax: "![alt](url)", support: "yes" },
    { format: "Blockquotes", syntax: "> quote", support: "yes" },
    { format: "Ordered Lists", syntax: "1. item", support: "yes" },
    { format: "Unordered Lists", syntax: "- item", support: "yes" },
    { format: "Code (inline)", syntax: "`code`", support: "yes" },
    { format: "Code Blocks", syntax: "```lang\\ncode\\n```", support: "yes" },
    { format: "Tables", syntax: "| col | col |", support: "yes" },
    { format: "Task Lists", syntax: "- [ ] task", support: "yes" },
    { format: "Footnotes", syntax: "[^1]", support: "yes" },
    { format: "Horizontal Rule", syntax: "---", support: "yes" },
  ];
  if (!overrides) return base;
  return base.map((item) => {
    const o = overrides[item.format];
    return o ? { ...item, ...o } : item;
  });
}

// ---------------------------------------------------------------------------
// Tool entries
// ---------------------------------------------------------------------------

export const MARKDOWN_TOOLS: MarkdownTool[] = [
  // =========================================================================
  // NOTE-TAKING (12)
  // =========================================================================
  {
    slug: "obsidian",
    name: "Obsidian",
    description:
      "How markdown works in Obsidian, including supported syntax, wiki-links, callouts, and tips for formatting notes.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "Obsidian is a powerful knowledge base that works on local markdown files. It supports standard markdown plus its own extensions like wiki-links, callouts, and embedded notes. All your data stays on your device as plain .md files.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Rendered in reading view only" },
    }),
    quirks: [
      "Uses [[wiki-link]] syntax for internal linking between notes.",
      "Supports callout blocks with > [!note], > [!tip], etc.",
      "Embeds other notes with ![[note-name]] syntax.",
      "Plugins can extend markdown with custom syntax like dataview queries.",
    ],
    faqs: [
      {
        question: "Does Obsidian support markdown?",
        answer:
          "Yes. Obsidian uses standard markdown (.md) files as its native format. It supports CommonMark, GFM tables, task lists, footnotes, and adds its own extensions like wiki-links and callouts.",
      },
      {
        question: "How do you bold text in Obsidian?",
        answer:
          "Wrap the text with double asterisks: **bold text**. You can also use the keyboard shortcut Ctrl/Cmd + B in the editor.",
      },
      {
        question: "Does Obsidian support tables?",
        answer:
          "Yes. Obsidian supports GFM-style pipe tables. You can also use community plugins like Advanced Tables for easier table editing with tab-key navigation.",
      },
      {
        question: "Can Obsidian render LaTeX math?",
        answer:
          "Yes. Use $inline$ for inline math and $$block$$ for display math. Obsidian uses MathJax to render LaTeX expressions.",
      },
    ],
    officialUrl: "https://obsidian.md",
    keywords:
      "obsidian markdown, obsidian formatting, obsidian wiki links, obsidian callouts, obsidian markdown support, does obsidian support markdown",
  },
  {
    slug: "notion",
    name: "Notion",
    description:
      "Notion's markdown support explained, including keyboard shortcuts, import/export, and known limitations.",
    category: "note-taking",
    markdownSupport: "partial",
    intro:
      "Notion is an all-in-one workspace that supports markdown shortcuts for quick formatting. While you can type markdown syntax and Notion will convert it, it stores content in its own block-based format rather than plain markdown files. You can import and export markdown, but some formatting may not round-trip perfectly.",
    syntaxSupport: fullSyntax({
      Strikethrough: { support: "yes", notes: "Use ~~text~~ or keyboard shortcut" },
      Images: { support: "partial", notes: "Paste or drag to embed; standard syntax not typed directly" },
      "Code Blocks": { support: "yes", notes: "Type ``` or /code to create" },
      Tables: { support: "partial", notes: "Uses its own table blocks, not pipe-table syntax" },
      "Task Lists": { support: "yes", notes: "Type /todo or use [] shortcut" },
      Footnotes: { support: "no", notes: "Not supported natively" },
    }),
    quirks: [
      "Markdown is converted to Notion blocks on paste or typing; it is not stored as raw markdown.",
      "Exported markdown may differ from the original input due to block conversion.",
      "Tables use Notion's database/table block format, not standard pipe tables.",
      "Toggle lists use the > syntax but behave differently from blockquotes.",
    ],
    faqs: [
      {
        question: "Does Notion support markdown?",
        answer:
          "Notion supports markdown shortcuts for formatting. When you type markdown syntax like **bold** or # heading, Notion converts it into its own block format. You can also import and export .md files.",
      },
      {
        question: "How do you bold text in Notion?",
        answer:
          "Type **text** and Notion will convert it to bold. You can also use Ctrl/Cmd + B or select text and choose bold from the formatting toolbar.",
      },
      {
        question: "Can you import markdown files into Notion?",
        answer:
          "Yes. Go to Settings > Import, select Markdown, and choose your .md files or a .zip archive. Notion will convert the markdown into its block format.",
      },
      {
        question: "Does Notion support footnotes?",
        answer:
          "No. Notion does not support markdown footnotes natively. As a workaround, you can use inline comments or linked references.",
      },
    ],
    officialUrl: "https://www.notion.so",
    keywords:
      "notion markdown, notion formatting, notion markdown support, does notion support markdown, notion markdown shortcuts, notion import markdown",
  },
  {
    slug: "bear",
    name: "Bear",
    description:
      "Markdown support in Bear, including its Polar Bear markup, tags, and formatting tips for Apple users.",
    category: "note-taking",
    markdownSupport: "custom",
    intro:
      "Bear is a beautiful writing app for Apple devices that uses a markdown-compatible syntax called Polar Bear. It renders formatting inline as you type and supports tags, nested headings, and note linking. Notes are stored in a proprietary format but can be exported as standard markdown.",
    syntaxSupport: fullSyntax({
      Strikethrough: { support: "yes", notes: "Uses -text- single dash syntax" },
      Tables: { support: "yes", notes: "Added in Bear 2" },
      "Task Lists": { support: "yes", notes: "Use - todo or - task" },
      Footnotes: { support: "yes" },
    }),
    quirks: [
      "Uses its own Polar Bear markup that is compatible with but not identical to CommonMark.",
      "Strikethrough uses single dashes (-text-) instead of double tildes.",
      "Tags are created with # prefix inside note body, which can conflict with headings.",
      "Available only on macOS, iOS, and iPadOS.",
    ],
    faqs: [
      {
        question: "Does Bear support markdown?",
        answer:
          "Yes. Bear uses Polar Bear markup, which is compatible with markdown. It supports headings, bold, italic, links, images, code blocks, and more. You can also export notes as standard .md files.",
      },
      {
        question: "How do you bold text in Bear?",
        answer:
          "Wrap the text with double asterisks: **bold text**. Bear renders the formatting inline so you see the bold styling as you type.",
      },
      {
        question: "Does Bear support tables?",
        answer:
          "Yes. Bear 2 added table support. You can create tables using standard pipe-table markdown syntax with headers and alignment.",
      },
      {
        question: "Is Bear available on Windows?",
        answer:
          "No. Bear is exclusive to Apple platforms: macOS, iOS, and iPadOS. It syncs via iCloud across your Apple devices.",
      },
    ],
    officialUrl: "https://bear.app",
    keywords:
      "bear markdown, bear app formatting, bear markdown support, does bear support markdown, bear notes markdown, bear polar bear markup",
  },
  {
    slug: "joplin",
    name: "Joplin",
    description:
      "Joplin's markdown support, including plugins, notebook organization, and sync options for your notes.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "Joplin is a free, open-source note-taking app with full markdown support. It stores notes as plain markdown and syncs across devices using services like Dropbox, OneDrive, or Nextcloud. Joplin supports GFM, math notation, and extensible plugins.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Supported via markdown-it plugin" },
    }),
    quirks: [
      "Uses markdown-it as the rendering engine, which supports many CommonMark extensions.",
      "Supports KaTeX math expressions with $inline$ and $$block$$ syntax.",
      "Plugins can add custom markdown syntax like charts and diagrams.",
      "The mobile editor has a simplified toolbar compared to the desktop version.",
    ],
    faqs: [
      {
        question: "Does Joplin support markdown?",
        answer:
          "Yes. Joplin fully supports markdown as its native format. It uses the markdown-it parser and supports CommonMark, GFM tables, task lists, footnotes, and math expressions.",
      },
      {
        question: "How do you bold text in Joplin?",
        answer:
          "Wrap the text with double asterisks: **bold text**. Joplin also provides a formatting toolbar with a bold button for convenience.",
      },
      {
        question: "Can Joplin sync markdown notes?",
        answer:
          "Yes. Joplin can sync notes using Dropbox, OneDrive, Nextcloud, WebDAV, or Joplin Cloud. Notes stay in markdown format regardless of the sync method.",
      },
      {
        question: "Does Joplin support plugins?",
        answer:
          "Yes. Joplin has a plugin system that lets you extend its markdown capabilities with custom renderers, editors, and integrations.",
      },
    ],
    officialUrl: "https://joplinapp.org",
    keywords:
      "joplin markdown, joplin formatting, joplin markdown support, does joplin support markdown, joplin note taking, joplin open source notes",
  },
  {
    slug: "standard-notes",
    name: "Standard Notes",
    description:
      "Markdown support in Standard Notes, including the built-in markdown editor, encryption, and formatting options.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "Standard Notes is a privacy-focused note-taking app with end-to-end encryption. It offers several markdown editors through its extensions, including a basic markdown editor and an advanced editor with live preview. Your notes are encrypted before syncing.",
    syntaxSupport: fullSyntax({
      Tables: { support: "yes", notes: "Available in the markdown editors" },
      "Task Lists": { support: "yes", notes: "Supported in the Plus and Super editors" },
      Footnotes: { support: "partial", notes: "Depends on the editor extension used" },
    }),
    quirks: [
      "The default plain text editor does not render markdown; you need to enable a markdown editor extension.",
      "Different editors (Plus, Super, Markdown Basic) have varying levels of markdown support.",
      "All notes are end-to-end encrypted, so server-side search is limited.",
    ],
    faqs: [
      {
        question: "Does Standard Notes support markdown?",
        answer:
          "Yes. Standard Notes supports markdown through its editor extensions. The Plus editor and Super editor both provide markdown formatting with live preview and syntax highlighting.",
      },
      {
        question: "How do you bold text in Standard Notes?",
        answer:
          "In a markdown editor extension, wrap text with double asterisks: **bold text**. The editor will render it as bold in the preview pane.",
      },
      {
        question: "Is Standard Notes encrypted?",
        answer:
          "Yes. Standard Notes uses end-to-end encryption for all your notes. Only you can decrypt and read your content, even the server operators cannot access it.",
      },
      {
        question: "Does Standard Notes support tables?",
        answer:
          "Yes. The markdown editor extensions support GFM-style pipe tables. You can create tables with headers, rows, and column alignment.",
      },
    ],
    officialUrl: "https://standardnotes.com",
    keywords:
      "standard notes markdown, standard notes formatting, standard notes markdown support, does standard notes support markdown, standard notes encrypted notes",
  },
  {
    slug: "simplenote",
    name: "Simplenote",
    description:
      "How markdown works in Simplenote, including enabling markdown mode, supported syntax, and known limitations.",
    category: "note-taking",
    markdownSupport: "partial",
    intro:
      "Simplenote is a free, minimalist note-taking app by Automattic. It includes a markdown preview mode that renders basic markdown formatting. Notes are plain text by default, and you need to enable markdown mode per note to see rendered output.",
    syntaxSupport: fullSyntax({
      Strikethrough: { support: "no", notes: "Not supported in Simplenote" },
      Tables: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "yes", notes: "Rendered as checkboxes in preview" },
      Footnotes: { support: "no", notes: "Not supported" },
    }),
    quirks: [
      "Markdown mode must be enabled per note via the note info panel.",
      "The editor shows raw markdown text; preview is in a separate view.",
      "No support for GFM tables or strikethrough.",
      "Free and cross-platform with sync, but limited markdown features.",
    ],
    faqs: [
      {
        question: "Does Simplenote support markdown?",
        answer:
          "Yes, but with limitations. Simplenote has a markdown preview mode that supports headings, bold, italic, links, images, code blocks, and lists. It does not support tables, strikethrough, or footnotes.",
      },
      {
        question: "How do you enable markdown in Simplenote?",
        answer:
          "Open a note, click the info button (i icon), and toggle the Markdown option on. The note will then render markdown formatting in preview mode.",
      },
      {
        question: "How do you bold text in Simplenote?",
        answer:
          "Use double asterisks: **bold text**. Make sure markdown mode is enabled on the note so the formatting renders in preview.",
      },
      {
        question: "Is Simplenote free?",
        answer:
          "Yes. Simplenote is completely free with no premium tier. It includes cross-platform sync, note sharing, and markdown support at no cost.",
      },
    ],
    officialUrl: "https://simplenote.com",
    keywords:
      "simplenote markdown, simplenote formatting, simplenote markdown support, does simplenote support markdown, simplenote markdown mode",
  },
  {
    slug: "logseq",
    name: "Logseq",
    description:
      "Logseq's markdown and outliner support, including block references, queries, and formatting tips.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "Logseq is a privacy-first, open-source knowledge base that works on local markdown and Org-mode files. It combines outliner-style editing with full markdown support, block references, and a built-in query system. All data stays on your device.",
    syntaxSupport: fullSyntax({
      Tables: { support: "partial", notes: "Basic table support; advanced tables via plugins" },
      Footnotes: { support: "no", notes: "Not supported natively" },
    }),
    quirks: [
      "Every line is a block in the outliner, which affects how markdown is stored.",
      "Supports ((block-reference)) syntax for linking to specific blocks.",
      "Can use both Markdown and Org-mode formats (configured per graph).",
      "Advanced queries use Datalog syntax for powerful filtering.",
    ],
    faqs: [
      {
        question: "Does Logseq support markdown?",
        answer:
          "Yes. Logseq supports markdown as one of its two primary formats (the other being Org-mode). It handles headings, bold, italic, links, code blocks, task lists, and more.",
      },
      {
        question: "How do you bold text in Logseq?",
        answer:
          "Wrap the text with double asterisks: **bold text**. Logseq renders the formatting inline in its outliner view.",
      },
      {
        question: "What is the difference between Logseq and Obsidian?",
        answer:
          "Both use local markdown files, but Logseq is an outliner where every line is a block, while Obsidian is a document-based editor. Logseq includes a built-in journal and query system.",
      },
      {
        question: "Does Logseq support tables?",
        answer:
          "Logseq has basic markdown table support. For more advanced table features, community plugins are available to extend the functionality.",
      },
    ],
    officialUrl: "https://logseq.com",
    keywords:
      "logseq markdown, logseq formatting, logseq markdown support, does logseq support markdown, logseq vs obsidian, logseq block references",
  },
  {
    slug: "typora",
    name: "Typora",
    description:
      "How Typora handles markdown with its seamless WYSIWYG editing, supported syntax, and export options.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "Typora is a minimal markdown editor that removes the split-pane preview by rendering markdown inline as you type. It supports GFM, math, diagrams, and exports to PDF, HTML, Word, and more. Typora provides a seamless writing experience where formatted output appears immediately.",
    syntaxSupport: fullSyntax(),
    quirks: [
      "Renders markdown inline (WYSIWYG style) with no separate preview pane.",
      "Supports Mermaid diagrams and sequence diagrams natively.",
      "Math rendering uses MathJax/KaTeX for LaTeX expressions.",
      "Typora is a paid app after a free trial period.",
    ],
    faqs: [
      {
        question: "Does Typora support markdown?",
        answer:
          "Yes. Typora is a dedicated markdown editor with full support for CommonMark, GFM tables, task lists, footnotes, math, and diagrams. It renders markdown inline as you type.",
      },
      {
        question: "How do you bold text in Typora?",
        answer:
          "Type **bold text** and Typora will immediately render it as bold. You can also use Ctrl/Cmd + B to toggle bold formatting.",
      },
      {
        question: "Is Typora free?",
        answer:
          "Typora offers a free trial, but it requires a one-time license purchase after the trial period. It is available for macOS, Windows, and Linux.",
      },
      {
        question: "Can Typora export to PDF?",
        answer:
          "Yes. Typora can export markdown to PDF, HTML, Word (docx), OpenDocument, LaTeX, EPUB, and other formats using its built-in export functionality.",
      },
    ],
    officialUrl: "https://typora.io",
    keywords:
      "typora markdown, typora editor, typora markdown support, does typora support markdown, typora WYSIWYG, typora export pdf",
  },
  {
    slug: "ia-writer",
    name: "iA Writer",
    description:
      "Markdown support in iA Writer, including Content Blocks, style checks, and cross-platform writing.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "iA Writer is a focused writing app that uses plain markdown files. It is known for its distraction-free interface, typography, and Content Blocks feature that lets you embed other files. iA Writer supports CommonMark with extensions and is available on macOS, iOS, Windows, and Android.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Rendered in preview mode" },
      Tables: { support: "yes", notes: "GFM-style pipe tables supported" },
    }),
    quirks: [
      "Content Blocks let you embed .md, .csv, .jpg, and other files using /path syntax.",
      "Style Check highlights filler words, cliches, and redundant language.",
      "Files are stored as plain .md and can be used with any other markdown app.",
      "Supports WordPress and Ghost publishing directly from the app.",
    ],
    faqs: [
      {
        question: "Does iA Writer support markdown?",
        answer:
          "Yes. iA Writer uses plain markdown (.md) files as its native format. It supports CommonMark, GFM tables, task lists, footnotes, and its own Content Blocks extension.",
      },
      {
        question: "How do you bold text in iA Writer?",
        answer:
          "Wrap the text with double asterisks: **bold text**. iA Writer shows the formatting in its preview mode and can also highlight the markdown syntax in the editor.",
      },
      {
        question: "What are Content Blocks in iA Writer?",
        answer:
          "Content Blocks let you embed external files (other markdown files, CSV tables, images) into your document using a /filename.ext syntax. They are rendered in preview mode.",
      },
      {
        question: "Is iA Writer available on Windows?",
        answer:
          "Yes. iA Writer is available on macOS, iOS, Windows, and Android. It syncs files via iCloud (Apple) or file system access on other platforms.",
      },
    ],
    officialUrl: "https://ia.net/writer",
    keywords:
      "ia writer markdown, ia writer formatting, ia writer markdown support, does ia writer support markdown, ia writer content blocks, ia writer focus mode",
  },
  {
    slug: "mark-text",
    name: "Mark Text",
    description:
      "Mark Text's markdown capabilities, including its real-time preview, themes, and open-source features.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "Mark Text is a free, open-source markdown editor with real-time preview. Like Typora, it renders markdown inline as you type. It supports CommonMark, GFM, and adds features like math, diagrams, and multiple themes. Mark Text is available on macOS, Windows, and Linux.",
    syntaxSupport: fullSyntax(),
    quirks: [
      "Open source and completely free, unlike Typora which requires a license.",
      "Supports Mermaid, Vega-Lite, and PlantUML diagrams.",
      "Multiple editing modes: Source Code, Typewriter, and Focus.",
      "Supports six themes including dark mode variants.",
    ],
    faqs: [
      {
        question: "Does Mark Text support markdown?",
        answer:
          "Yes. Mark Text is a dedicated markdown editor with full support for CommonMark, GFM, tables, task lists, footnotes, math, and diagrams. It renders formatting inline as you type.",
      },
      {
        question: "How do you bold text in Mark Text?",
        answer:
          "Type **bold text** and Mark Text will render it as bold immediately. You can also use Ctrl/Cmd + B to toggle bold formatting.",
      },
      {
        question: "Is Mark Text free?",
        answer:
          "Yes. Mark Text is completely free and open source. It is available for macOS, Windows, and Linux with no paid tiers or licenses required.",
      },
      {
        question: "How does Mark Text compare to Typora?",
        answer:
          "Both render markdown inline without a split pane. Mark Text is free and open source, while Typora requires a paid license. Feature sets are similar, with both supporting GFM, math, and diagrams.",
      },
    ],
    officialUrl: "https://www.marktext.cc",
    keywords:
      "mark text markdown, mark text editor, mark text markdown support, does mark text support markdown, mark text free, mark text open source",
  },
  {
    slug: "ulysses",
    name: "Ulysses",
    description:
      "How Ulysses handles markdown with its Markdown XL syntax, iCloud library, and publishing features.",
    category: "note-taking",
    markdownSupport: "custom",
    intro:
      "Ulysses is a premium writing app for Mac and iOS that uses a custom markdown dialect called Markdown XL. It adds features like annotations, footnotes, and image handling beyond standard markdown. Ulysses uses its own library format but can export to standard markdown, HTML, PDF, Word, and EPUB.",
    syntaxSupport: fullSyntax({
      Images: { support: "yes", notes: "Uses (img) syntax instead of standard ![]()" },
      Strikethrough: { support: "yes", notes: "Uses ||text|| syntax" },
      "Code Blocks": { support: "yes", notes: "Uses ``code`` double backtick blocks" },
      Footnotes: { support: "yes", notes: "Uses (fn) inline syntax" },
    }),
    quirks: [
      "Uses Markdown XL, a custom dialect with non-standard syntax for some features.",
      "Strikethrough uses ||text|| instead of ~~text~~.",
      "Images use (img) syntax rather than the standard ![alt](url).",
      "Notes are stored in a proprietary library, not as plain .md files on disk.",
    ],
    faqs: [
      {
        question: "Does Ulysses support markdown?",
        answer:
          "Yes, but Ulysses uses its own Markdown XL dialect. It supports standard formatting like bold, italic, headings, and links, but uses custom syntax for some features like strikethrough, images, and footnotes.",
      },
      {
        question: "How do you bold text in Ulysses?",
        answer:
          "Wrap the text with double asterisks: **bold text**. Standard bold syntax works the same as in regular markdown.",
      },
      {
        question: "Can Ulysses export to standard markdown?",
        answer:
          "Yes. Ulysses can export to standard markdown (.md), HTML, PDF, Word (docx), and EPUB. You can also publish directly to WordPress and Ghost.",
      },
      {
        question: "Is Ulysses available on Windows?",
        answer:
          "No. Ulysses is available only on macOS, iOS, and iPadOS. It requires a subscription for full access.",
      },
    ],
    officialUrl: "https://ulysses.app",
    keywords:
      "ulysses markdown, ulysses formatting, ulysses markdown support, does ulysses support markdown, ulysses markdown xl, ulysses writing app",
  },
  {
    slug: "zettlr",
    name: "Zettlr",
    description:
      "Zettlr's markdown support for academic writing, including citations, Zettelkasten features, and export options.",
    category: "note-taking",
    markdownSupport: "full",
    intro:
      "Zettlr is a free, open-source markdown editor built for academic and professional writing. It supports Pandoc-flavored markdown, Zettelkasten-style linking, citation management with CSL/BibTeX, and export to PDF, Word, and HTML via Pandoc.",
    syntaxSupport: fullSyntax(),
    quirks: [
      "Designed for academic writing with built-in citation support (@citekey).",
      "Supports Zettelkasten-style note linking with [[ID]] syntax.",
      "Uses Pandoc for export, supporting many output formats.",
      "Includes word count targets and a Pomodoro timer for productivity.",
    ],
    faqs: [
      {
        question: "Does Zettlr support markdown?",
        answer:
          "Yes. Zettlr fully supports markdown with Pandoc extensions. It handles headings, bold, italic, links, images, code blocks, tables, footnotes, citations, and more.",
      },
      {
        question: "How do you bold text in Zettlr?",
        answer:
          "Wrap the text with double asterisks: **bold text**. Zettlr highlights the syntax in the editor and renders it in preview mode.",
      },
      {
        question: "Is Zettlr free?",
        answer:
          "Yes. Zettlr is free and open source, available for macOS, Windows, and Linux. There are no paid features or subscriptions.",
      },
      {
        question: "Does Zettlr support citations?",
        answer:
          "Yes. Zettlr has built-in support for academic citations using CSL JSON or BibTeX files. Use @citekey syntax in your markdown and Zettlr will format citations on export via Pandoc.",
      },
    ],
    officialUrl: "https://zettlr.com",
    keywords:
      "zettlr markdown, zettlr editor, zettlr markdown support, does zettlr support markdown, zettlr academic writing, zettlr zettelkasten",
  },

  // =========================================================================
  // DOCUMENTATION (7)
  // =========================================================================
  {
    slug: "gitbook",
    name: "GitBook",
    description:
      "GitBook's markdown support for documentation sites, including its editor, Git sync, and content blocks.",
    category: "documentation",
    markdownSupport: "gfm",
    intro:
      "GitBook is a modern documentation platform that supports markdown for writing docs. It provides a visual editor with markdown shortcuts, Git-based sync, and collaboration features. GitBook supports GFM syntax and adds its own content blocks like hints, tabs, and embeds.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "yes", notes: "Rendered as interactive checkboxes" },
    }),
    quirks: [
      "Uses a visual editor with markdown shortcuts, not a raw markdown editor.",
      "Supports custom content blocks like hints, tabs, and API references.",
      "Can sync content from a GitHub or GitLab repository.",
      "Markdown files imported from Git are converted to GitBook's internal format.",
    ],
    faqs: [
      {
        question: "Does GitBook support markdown?",
        answer:
          "Yes. GitBook supports GFM-compatible markdown including headings, bold, italic, links, images, code blocks, tables, and task lists. You can type markdown shortcuts in the editor or sync from a Git repository.",
      },
      {
        question: "How do you bold text in GitBook?",
        answer:
          "Type **bold text** in the editor and GitBook will format it as bold. You can also use Ctrl/Cmd + B or select text and use the toolbar.",
      },
      {
        question: "Can GitBook sync with GitHub?",
        answer:
          "Yes. GitBook offers bi-directional Git sync with GitHub and GitLab. Changes in your repository are reflected in GitBook and vice versa.",
      },
      {
        question: "Does GitBook support code blocks?",
        answer:
          "Yes. GitBook supports fenced code blocks with syntax highlighting for many programming languages. Use triple backticks with a language identifier.",
      },
    ],
    officialUrl: "https://www.gitbook.com",
    keywords:
      "gitbook markdown, gitbook formatting, gitbook markdown support, does gitbook support markdown, gitbook documentation, gitbook git sync",
  },
  {
    slug: "mkdocs",
    name: "MkDocs",
    description:
      "MkDocs markdown support for static documentation sites, including themes, plugins, and the Material theme.",
    category: "documentation",
    markdownSupport: "full",
    intro:
      "MkDocs is a fast, simple static site generator built for project documentation. It uses markdown files as source content and generates a clean, responsive documentation site. The popular Material for MkDocs theme adds many extensions including admonitions, tabs, and content annotations.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Via pymdownx.footnote extension" },
    }),
    quirks: [
      "Configuration is done via a mkdocs.yml file in the project root.",
      "The Material theme adds many markdown extensions beyond standard MkDocs.",
      "Supports admonitions (callouts) with !!! note, !!! warning syntax.",
      "Live reload during development with mkdocs serve.",
    ],
    faqs: [
      {
        question: "Does MkDocs support markdown?",
        answer:
          "Yes. MkDocs uses markdown as its primary content format. It supports CommonMark plus extensions through Python-Markdown. The Material theme adds even more extensions like admonitions, tabs, and annotations.",
      },
      {
        question: "How do you bold text in MkDocs?",
        answer:
          "Use standard markdown syntax: **bold text**. MkDocs processes your markdown files and renders them as HTML in the generated documentation site.",
      },
      {
        question: "What is Material for MkDocs?",
        answer:
          "Material for MkDocs is a popular theme that adds a modern design and many markdown extensions including admonitions, content tabs, annotations, code copy buttons, and search improvements.",
      },
      {
        question: "Is MkDocs free?",
        answer:
          "Yes. MkDocs is free and open source. The Material theme offers both a free community edition and a paid Insiders edition with additional features.",
      },
    ],
    officialUrl: "https://www.mkdocs.org",
    keywords:
      "mkdocs markdown, mkdocs formatting, mkdocs markdown support, does mkdocs support markdown, mkdocs material theme, mkdocs documentation",
  },
  {
    slug: "docusaurus",
    name: "Docusaurus",
    description:
      "Docusaurus markdown support, including MDX, versioned docs, and React component integration.",
    category: "documentation",
    markdownSupport: "gfm",
    intro:
      "Docusaurus is a static site generator by Meta designed for documentation websites. It uses markdown and MDX (markdown with JSX) for content, supports versioned docs, internationalization, and lets you embed React components directly in your markdown files.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "no", notes: "Not supported by default; requires a plugin" },
    }),
    quirks: [
      "Supports MDX, allowing React components inside markdown files.",
      "Front matter in markdown files controls page metadata and sidebar positioning.",
      "Admonitions use :::note, :::tip, :::warning syntax.",
      "Built-in support for versioned documentation and i18n.",
    ],
    faqs: [
      {
        question: "Does Docusaurus support markdown?",
        answer:
          "Yes. Docusaurus supports GFM and MDX (markdown with embedded JSX). You can write standard markdown and also use React components directly in your content files.",
      },
      {
        question: "How do you bold text in Docusaurus?",
        answer:
          "Use standard markdown syntax: **bold text**. Docusaurus processes your markdown files and renders them as part of your documentation site.",
      },
      {
        question: "What is MDX in Docusaurus?",
        answer:
          "MDX lets you use JSX (React components) inside markdown files. This means you can embed interactive elements, custom components, and dynamic content alongside your markdown text.",
      },
      {
        question: "Is Docusaurus free?",
        answer:
          "Yes. Docusaurus is free and open source, maintained by Meta. It is widely used for documentation sites of open-source projects.",
      },
    ],
    officialUrl: "https://docusaurus.io",
    keywords:
      "docusaurus markdown, docusaurus formatting, docusaurus markdown support, does docusaurus support markdown, docusaurus mdx, docusaurus documentation",
  },
  {
    slug: "hugo",
    name: "Hugo",
    description:
      "Hugo's markdown rendering, including Goldmark, shortcodes, and content management for static sites.",
    category: "documentation",
    markdownSupport: "full",
    intro:
      "Hugo is one of the fastest static site generators available. It uses markdown files for content and the Goldmark parser for rendering. Hugo supports front matter, shortcodes for reusable content, and can build thousands of pages in seconds.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Supported via Goldmark extensions" },
      "Task Lists": { support: "yes", notes: "Requires enabling the extension in config" },
    }),
    quirks: [
      "Uses Goldmark as the default markdown parser (replaced Blackfriday in v0.60+).",
      "Shortcodes provide reusable template snippets inside markdown.",
      "Front matter supports YAML, TOML, or JSON format.",
      "Extremely fast build times, even for sites with thousands of pages.",
    ],
    faqs: [
      {
        question: "Does Hugo support markdown?",
        answer:
          "Yes. Hugo uses markdown as its primary content format. It parses markdown with Goldmark (CommonMark compliant) and supports tables, footnotes, task lists, and custom shortcodes.",
      },
      {
        question: "How do you bold text in Hugo?",
        answer:
          "Use standard markdown syntax: **bold text**. Hugo processes your markdown content files and renders them as HTML pages in your static site.",
      },
      {
        question: "What markdown parser does Hugo use?",
        answer:
          "Hugo uses Goldmark, a CommonMark-compliant markdown parser written in Go. It replaced the older Blackfriday parser starting with Hugo v0.60.",
      },
      {
        question: "Is Hugo free?",
        answer:
          "Yes. Hugo is free and open source, released under the Apache 2.0 license. It is available for macOS, Windows, and Linux.",
      },
    ],
    officialUrl: "https://gohugo.io",
    keywords:
      "hugo markdown, hugo formatting, hugo markdown support, does hugo support markdown, hugo static site, hugo goldmark",
  },
  {
    slug: "jekyll",
    name: "Jekyll",
    description:
      "Jekyll's markdown support, including Kramdown, Liquid templates, and GitHub Pages integration.",
    category: "documentation",
    markdownSupport: "full",
    intro:
      "Jekyll is a static site generator that powers GitHub Pages. It uses markdown files for content and the Kramdown parser by default. Jekyll supports front matter, Liquid templating, and is one of the most popular choices for blogs and documentation hosted on GitHub.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Supported via Kramdown" },
    }),
    quirks: [
      "Uses Kramdown as the default markdown parser.",
      "Liquid template tags can be used inside markdown files.",
      "Front matter in YAML format controls page layout and metadata.",
      "Natively supported by GitHub Pages for free hosting.",
    ],
    faqs: [
      {
        question: "Does Jekyll support markdown?",
        answer:
          "Yes. Jekyll uses markdown as its primary content format. It parses markdown with Kramdown by default and supports headings, bold, italic, links, images, tables, footnotes, and code blocks.",
      },
      {
        question: "How do you bold text in Jekyll?",
        answer:
          "Use standard markdown syntax: **bold text**. Jekyll processes your markdown files with Kramdown and renders them into your site's HTML templates.",
      },
      {
        question: "Does Jekyll work with GitHub Pages?",
        answer:
          "Yes. Jekyll is the default static site generator for GitHub Pages. You can push markdown files to a GitHub repository and GitHub will automatically build and host your Jekyll site.",
      },
      {
        question: "Is Jekyll free?",
        answer:
          "Yes. Jekyll is free and open source. When combined with GitHub Pages, you also get free hosting for your markdown-based site.",
      },
    ],
    officialUrl: "https://jekyllrb.com",
    keywords:
      "jekyll markdown, jekyll formatting, jekyll markdown support, does jekyll support markdown, jekyll github pages, jekyll kramdown",
  },
  {
    slug: "docsify",
    name: "Docsify",
    description:
      "Docsify's markdown rendering, including its no-build approach, plugins, and configuration options.",
    category: "documentation",
    markdownSupport: "gfm",
    intro:
      "Docsify is a lightweight documentation site generator that renders markdown files directly in the browser with no build step. Just create markdown files and serve them. Docsify parses markdown on the fly, supports plugins, and provides features like search, themes, and sidebar navigation.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "no", notes: "Not supported by default" },
      "Task Lists": { support: "yes" },
    }),
    quirks: [
      "No build step required. Markdown files are parsed and rendered in the browser at runtime.",
      "Uses marked.js as the markdown parser.",
      "Custom sidebar and navbar are configured via separate markdown files.",
      "Plugins extend functionality (search, copy code, pagination, etc.).",
    ],
    faqs: [
      {
        question: "Does Docsify support markdown?",
        answer:
          "Yes. Docsify renders markdown files directly in the browser using marked.js. It supports GFM-compatible syntax including headings, bold, italic, links, images, code blocks, and tables.",
      },
      {
        question: "How do you bold text in Docsify?",
        answer:
          "Use standard markdown syntax: **bold text**. Docsify parses your markdown at runtime in the browser and renders the formatted output.",
      },
      {
        question: "Does Docsify require a build step?",
        answer:
          "No. Docsify parses markdown files at runtime in the browser. You just create .md files, add an index.html with the Docsify script, and serve the files.",
      },
      {
        question: "Is Docsify free?",
        answer:
          "Yes. Docsify is free and open source. You can host your documentation anywhere that serves static files, including GitHub Pages.",
      },
    ],
    officialUrl: "https://docsify.js.org",
    keywords:
      "docsify markdown, docsify formatting, docsify markdown support, does docsify support markdown, docsify documentation, docsify no build",
  },
  {
    slug: "wiki-js",
    name: "Wiki.js",
    description:
      "Wiki.js markdown support, including its editor modes, diagram integration, and self-hosted wiki features.",
    category: "documentation",
    markdownSupport: "full",
    intro:
      "Wiki.js is a powerful open-source wiki engine with a built-in markdown editor. It supports multiple editor modes (markdown, visual, and code), integrates with Git for storage, and provides features like search, access control, and diagram rendering. Wiki.js supports CommonMark with extensions.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes" },
    }),
    quirks: [
      "Supports multiple editors: markdown, visual WYSIWYG, and raw HTML.",
      "Integrates with Kroki for rendering diagrams (Mermaid, PlantUML, etc.).",
      "Can store content in a Git repository for version control.",
      "Self-hosted with PostgreSQL, MySQL, or SQLite as the database.",
    ],
    faqs: [
      {
        question: "Does Wiki.js support markdown?",
        answer:
          "Yes. Wiki.js includes a full markdown editor with support for CommonMark, GFM tables, task lists, footnotes, and diagram rendering. You can also switch to a visual editor or raw HTML mode.",
      },
      {
        question: "How do you bold text in Wiki.js?",
        answer:
          "In the markdown editor, use **bold text**. Wiki.js also provides a toolbar with formatting buttons and keyboard shortcuts.",
      },
      {
        question: "Is Wiki.js free?",
        answer:
          "Yes. Wiki.js is free and open source under the AGPL license. You self-host it on your own server with your choice of database backend.",
      },
      {
        question: "Does Wiki.js support diagrams?",
        answer:
          "Yes. Wiki.js integrates with Kroki to render diagrams from text-based definitions. Supported formats include Mermaid, PlantUML, GraphViz, and others.",
      },
    ],
    officialUrl: "https://js.wiki",
    keywords:
      "wiki.js markdown, wiki.js formatting, wiki.js markdown support, does wiki.js support markdown, wiki.js documentation, wiki.js self-hosted",
  },

  // =========================================================================
  // COLLABORATION (6)
  // =========================================================================
  {
    slug: "trello",
    name: "Trello",
    description:
      "How markdown works in Trello card descriptions and comments, including supported syntax and limitations.",
    category: "collaboration",
    markdownSupport: "partial",
    intro:
      "Trello supports a subset of markdown in card descriptions, comments, and checklist items. You can use basic formatting like bold, italic, links, and lists. Trello renders markdown automatically when you save the field.",
    syntaxSupport: fullSyntax({
      Images: { support: "yes", notes: "Rendered as embedded images in descriptions" },
      Tables: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "no", notes: "Use Trello's native checklist feature instead" },
      Footnotes: { support: "no", notes: "Not supported" },
      "Horizontal Rule": { support: "yes", notes: "Use --- in descriptions" },
    }),
    quirks: [
      "Markdown works in card descriptions and comments but not in card titles.",
      "Tables are not supported. Use Trello's native checklist for task-like items.",
      "Links are auto-detected and made clickable even without markdown syntax.",
      "Emoji shortcodes are not supported; use native emoji input instead.",
    ],
    faqs: [
      {
        question: "Does Trello support markdown?",
        answer:
          "Yes, partially. Trello supports markdown in card descriptions and comments. You can use bold, italic, strikethrough, links, images, lists, headings, and code blocks. Tables and task lists are not supported.",
      },
      {
        question: "How do you bold text in Trello?",
        answer:
          "Wrap the text with double asterisks: **bold text**. The formatting will render when you save the card description or comment.",
      },
      {
        question: "Does Trello support tables?",
        answer:
          "No. Trello does not support markdown tables in card descriptions or comments. You can use Trello's native card and list structure for organizing tabular information.",
      },
      {
        question: "Where does markdown work in Trello?",
        answer:
          "Markdown rendering works in card descriptions and comments. It does not work in card titles, board names, or checklist items.",
      },
    ],
    officialUrl: "https://trello.com",
    keywords:
      "trello markdown, trello formatting, trello markdown support, does trello support markdown, trello card description markdown, trello comments markdown",
  },
  {
    slug: "todoist",
    name: "Todoist",
    description:
      "Markdown support in Todoist for task descriptions, comments, and formatting tips.",
    category: "collaboration",
    markdownSupport: "partial",
    intro:
      "Todoist supports basic markdown formatting in task names, descriptions, and comments. You can use bold, italic, links, and inline code. However, Todoist does not support the full markdown specification, and some features like headings and tables are not available in task content.",
    syntaxSupport: fullSyntax({
      Headings: { support: "no", notes: "Not supported in task content" },
      Images: { support: "no", notes: "Attach images separately; no inline markdown images" },
      Blockquotes: { support: "no", notes: "Not supported" },
      "Code Blocks": { support: "partial", notes: "Inline code only with `backticks`" },
      Tables: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "no", notes: "Use Todoist's native task/subtask system" },
      Footnotes: { support: "no", notes: "Not supported" },
      "Horizontal Rule": { support: "no", notes: "Not supported" },
    }),
    quirks: [
      "Only basic formatting (bold, italic, inline code, links) is supported.",
      "Markdown works in task names, descriptions, and comments.",
      "Headings, blockquotes, and tables are not rendered.",
      "Links use standard [text](url) syntax.",
    ],
    faqs: [
      {
        question: "Does Todoist support markdown?",
        answer:
          "Todoist supports basic markdown including bold (**text**), italic (*text*), inline code (`code`), links, and lists. It does not support headings, blockquotes, tables, or images in markdown format.",
      },
      {
        question: "How do you bold text in Todoist?",
        answer:
          "Wrap the text with double asterisks: **bold text**. Todoist will render it as bold in the task name, description, or comment.",
      },
      {
        question: "Does Todoist support code blocks?",
        answer:
          "Todoist supports inline code with single backticks (`code`). Full fenced code blocks with triple backticks are not supported.",
      },
      {
        question: "Can you use markdown in Todoist comments?",
        answer:
          "Yes. Todoist comments support the same basic markdown formatting as task names and descriptions: bold, italic, inline code, and links.",
      },
    ],
    officialUrl: "https://todoist.com",
    keywords:
      "todoist markdown, todoist formatting, todoist markdown support, does todoist support markdown, todoist bold text, todoist task formatting",
  },
  {
    slug: "mattermost",
    name: "Mattermost",
    description:
      "Mattermost's markdown support for team messaging, including syntax highlighting, tables, and formatting shortcuts.",
    category: "collaboration",
    markdownSupport: "gfm",
    intro:
      "Mattermost is an open-source team messaging platform with comprehensive markdown support. Messages, posts, and channel descriptions support GFM-compatible markdown including tables, code blocks with syntax highlighting, and task lists. Mattermost is often used as a self-hosted alternative to Slack.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "no", notes: "Not supported" },
    }),
    quirks: [
      "Supports syntax highlighting in code blocks for many languages.",
      "Tables render in messages with full pipe-table syntax.",
      "Supports @mentions and channel links alongside markdown.",
      "Preview button lets you see rendered markdown before posting.",
    ],
    faqs: [
      {
        question: "Does Mattermost support markdown?",
        answer:
          "Yes. Mattermost supports GFM-compatible markdown in messages, including bold, italic, headings, links, images, code blocks with syntax highlighting, tables, and task lists.",
      },
      {
        question: "How do you bold text in Mattermost?",
        answer:
          "Wrap the text with double asterisks: **bold text**. You can also use Ctrl/Cmd + B as a keyboard shortcut in the message composer.",
      },
      {
        question: "Does Mattermost support tables?",
        answer:
          "Yes. Mattermost supports GFM-style pipe tables in messages. You can create tables with headers, rows, and column alignment using pipe and dash characters.",
      },
      {
        question: "Is Mattermost free?",
        answer:
          "Mattermost offers a free open-source edition for self-hosting. There are also paid plans with additional enterprise features like compliance, SSO, and advanced permissions.",
      },
    ],
    officialUrl: "https://mattermost.com",
    keywords:
      "mattermost markdown, mattermost formatting, mattermost markdown support, does mattermost support markdown, mattermost messaging, mattermost code blocks",
  },
  {
    slug: "hackmd",
    name: "HackMD",
    description:
      "HackMD's real-time collaborative markdown editor, including supported syntax, diagrams, and sharing features.",
    category: "collaboration",
    markdownSupport: "full",
    intro:
      "HackMD is a real-time collaborative markdown editor. Multiple users can edit the same document simultaneously with live preview. It supports GFM, math, diagrams, slide mode, and can sync notes with GitHub. HackMD is often used for meeting notes, documentation, and presentations.",
    syntaxSupport: fullSyntax(),
    quirks: [
      "Supports real-time collaboration with multiple simultaneous editors.",
      "Slide mode turns markdown into a presentation using --- as slide separators.",
      "Supports Mermaid, sequence diagrams, and flowcharts in code blocks.",
      "Math rendering with MathJax using $inline$ and $$block$$ syntax.",
    ],
    faqs: [
      {
        question: "Does HackMD support markdown?",
        answer:
          "Yes. HackMD is a full-featured markdown editor with support for GFM, tables, task lists, footnotes, math, and diagrams. It renders markdown in real time as you type.",
      },
      {
        question: "How do you bold text in HackMD?",
        answer:
          "Wrap the text with double asterisks: **bold text**. HackMD renders the formatting immediately in the live preview pane.",
      },
      {
        question: "Can multiple people edit at the same time in HackMD?",
        answer:
          "Yes. HackMD supports real-time collaboration. Multiple users can edit the same markdown document simultaneously and see each other's changes live.",
      },
      {
        question: "Does HackMD support diagrams?",
        answer:
          "Yes. HackMD supports Mermaid diagrams, sequence diagrams, and flowcharts. You embed them using fenced code blocks with the appropriate language identifier.",
      },
    ],
    officialUrl: "https://hackmd.io",
    keywords:
      "hackmd markdown, hackmd formatting, hackmd markdown support, does hackmd support markdown, hackmd collaborative editor, hackmd real-time editing",
  },
  {
    slug: "hedgedoc",
    name: "HedgeDoc",
    description:
      "HedgeDoc's self-hosted collaborative markdown editor, including supported syntax and community features.",
    category: "collaboration",
    markdownSupport: "full",
    intro:
      "HedgeDoc (formerly CodiMD) is a free, open-source, self-hosted collaborative markdown editor. It provides real-time collaboration, a split-pane editor with live preview, and supports GFM with extensions for math, diagrams, and slide presentations. HedgeDoc is the community fork of HackMD.",
    syntaxSupport: fullSyntax(),
    quirks: [
      "Self-hosted alternative to HackMD with the same core features.",
      "Formerly known as CodiMD; rebranded to HedgeDoc.",
      "Supports slide mode, math, and diagram rendering like HackMD.",
      "Can be deployed with Docker or installed on a server with Node.js.",
    ],
    faqs: [
      {
        question: "Does HedgeDoc support markdown?",
        answer:
          "Yes. HedgeDoc fully supports markdown including GFM, tables, task lists, footnotes, math, and diagrams. It is a self-hosted collaborative markdown editor.",
      },
      {
        question: "How do you bold text in HedgeDoc?",
        answer:
          "Wrap the text with double asterisks: **bold text**. HedgeDoc shows the formatted result in its live preview pane.",
      },
      {
        question: "What is the difference between HedgeDoc and HackMD?",
        answer:
          "HedgeDoc is the free, open-source, self-hosted fork of HackMD. HackMD offers a hosted service with additional features, while HedgeDoc is community-maintained and designed for self-hosting.",
      },
      {
        question: "Is HedgeDoc free?",
        answer:
          "Yes. HedgeDoc is free and open source under the AGPL license. You host it on your own server and have full control over your data.",
      },
    ],
    officialUrl: "https://hedgedoc.org",
    keywords:
      "hedgedoc markdown, hedgedoc formatting, hedgedoc markdown support, does hedgedoc support markdown, hedgedoc self-hosted, hedgedoc collaborative",
  },
  {
    slug: "stackedit",
    name: "StackEdit",
    description:
      "StackEdit's in-browser markdown editor, including supported syntax, sync options, and publishing features.",
    category: "collaboration",
    markdownSupport: "full",
    intro:
      "StackEdit is a free, in-browser markdown editor with live preview. It supports GFM, math, diagrams, and can sync notes with Google Drive, Dropbox, and GitHub. StackEdit works offline and publishes directly to Blogger, WordPress, and Zendesk.",
    syntaxSupport: fullSyntax(),
    quirks: [
      "Runs entirely in the browser with offline support via service workers.",
      "Syncs with Google Drive, Dropbox, GitHub, and GitLab.",
      "Can publish directly to Blogger, WordPress, and Zendesk.",
      "Supports KaTeX math and Mermaid diagrams.",
    ],
    faqs: [
      {
        question: "Does StackEdit support markdown?",
        answer:
          "Yes. StackEdit is a full-featured markdown editor with support for GFM, tables, task lists, footnotes, math, and diagrams. It runs entirely in your browser.",
      },
      {
        question: "How do you bold text in StackEdit?",
        answer:
          "Wrap the text with double asterisks: **bold text**. StackEdit renders the formatting in its side-by-side live preview.",
      },
      {
        question: "Is StackEdit free?",
        answer:
          "Yes. StackEdit is free and open source. It works in your browser with no installation required and supports offline editing.",
      },
      {
        question: "Can StackEdit sync with Google Drive?",
        answer:
          "Yes. StackEdit can sync your markdown documents with Google Drive, Dropbox, GitHub, and GitLab. Changes are synchronized automatically.",
      },
    ],
    officialUrl: "https://stackedit.io",
    keywords:
      "stackedit markdown, stackedit editor, stackedit markdown support, does stackedit support markdown, stackedit online editor, stackedit browser",
  },

  // =========================================================================
  // WEBSITE / CMS (3)
  // =========================================================================
  {
    slug: "ghost",
    name: "Ghost",
    description:
      "Ghost's markdown support in its editor, including markdown cards, keyboard shortcuts, and publishing workflows.",
    category: "website-cms",
    markdownSupport: "partial",
    intro:
      "Ghost is a professional publishing platform with a card-based editor. While the editor is primarily visual, Ghost supports a Markdown card that lets you write raw markdown within a post. Ghost also responds to markdown keyboard shortcuts for quick formatting throughout the editor.",
    syntaxSupport: fullSyntax({
      Tables: { support: "partial", notes: "Supported inside the Markdown card only" },
      "Task Lists": { support: "no", notes: "Not supported in the editor" },
      Footnotes: { support: "partial", notes: "Supported inside the Markdown card" },
    }),
    quirks: [
      "The main editor is card-based, not a pure markdown editor.",
      "Insert a Markdown card (type /markdown) to write raw markdown within a post.",
      "Markdown shortcuts like **bold** and # heading work throughout the editor.",
      "Content in Markdown cards is rendered as HTML on the published site.",
    ],
    faqs: [
      {
        question: "Does Ghost support markdown?",
        answer:
          "Yes, partially. Ghost's editor supports markdown keyboard shortcuts for formatting, and you can insert a dedicated Markdown card to write raw markdown. The main editor is card-based, not a pure markdown editor.",
      },
      {
        question: "How do you bold text in Ghost?",
        answer:
          "Type **bold text** in the editor and Ghost will format it as bold. You can also use Ctrl/Cmd + B or select text and use the formatting toolbar.",
      },
      {
        question: "How do you use markdown in Ghost?",
        answer:
          "Type /markdown on a new line in the editor to insert a Markdown card. Inside this card, you can write full markdown syntax that will be rendered on your published post.",
      },
      {
        question: "Is Ghost free?",
        answer:
          "Ghost is open source and free to self-host. Ghost(Pro) is a paid managed hosting service. You can also install Ghost on your own server at no cost.",
      },
    ],
    officialUrl: "https://ghost.org",
    keywords:
      "ghost markdown, ghost formatting, ghost markdown support, does ghost support markdown, ghost cms markdown, ghost editor markdown",
  },
  {
    slug: "squarespace",
    name: "Squarespace",
    description:
      "Markdown support in Squarespace, including the Markdown block, supported syntax, and known limitations.",
    category: "website-cms",
    markdownSupport: "partial",
    intro:
      "Squarespace is a website builder that supports markdown through its Markdown content block. You can add a Markdown block to any page and write markdown that renders as formatted HTML on your site. Standard markdown syntax is supported, but advanced features like footnotes are not available.",
    syntaxSupport: fullSyntax({
      "Task Lists": { support: "no", notes: "Not supported" },
      Footnotes: { support: "no", notes: "Not supported" },
      Tables: { support: "yes", notes: "Supported in Markdown blocks" },
    }),
    quirks: [
      "Markdown only works inside Markdown content blocks, not in all text areas.",
      "You add a Markdown block from the content block menu in the page editor.",
      "The rendered output inherits your site's CSS styling.",
      "No live preview. The rendered output appears after saving.",
    ],
    faqs: [
      {
        question: "Does Squarespace support markdown?",
        answer:
          "Yes. Squarespace supports markdown through its Markdown content block. Add one to any page, write markdown, and it renders as formatted HTML using your site's styling.",
      },
      {
        question: "How do you bold text in Squarespace markdown?",
        answer:
          "Inside a Markdown block, use **bold text**. The formatting renders when you save the block and view the published page.",
      },
      {
        question: "How do you add a Markdown block in Squarespace?",
        answer:
          "In the page editor, click to add a new content block, search for Markdown, and select it. A text area appears where you can write markdown syntax.",
      },
      {
        question: "Does Squarespace markdown support tables?",
        answer:
          "Yes. You can create tables using standard pipe-table syntax inside a Markdown content block. The table will render with your site's CSS styling.",
      },
    ],
    officialUrl: "https://www.squarespace.com",
    keywords:
      "squarespace markdown, squarespace formatting, squarespace markdown support, does squarespace support markdown, squarespace markdown block, squarespace website markdown",
  },
  {
    slug: "carrd",
    name: "Carrd",
    description:
      "Markdown support in Carrd for single-page sites, including supported syntax and Text element formatting.",
    category: "website-cms",
    markdownSupport: "partial",
    intro:
      "Carrd is a platform for building simple one-page websites. It supports basic markdown in its Text elements for formatting content. You can use bold, italic, links, and lists, but advanced markdown features like tables and code blocks are limited or unavailable.",
    syntaxSupport: fullSyntax({
      Headings: { support: "partial", notes: "Limited heading levels in Text elements" },
      Images: { support: "no", notes: "Use Carrd's Image element instead" },
      Blockquotes: { support: "no", notes: "Not supported" },
      "Code (inline)": { support: "no", notes: "Not supported" },
      "Code Blocks": { support: "no", notes: "Not supported" },
      Tables: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "no", notes: "Not supported" },
      Footnotes: { support: "no", notes: "Not supported" },
      "Horizontal Rule": { support: "no", notes: "Use Carrd's Divider element" },
    }),
    quirks: [
      "Markdown is only available in Text elements within the site editor.",
      "Images, dividers, and other media use Carrd's own element system.",
      "Limited markdown support compared to full markdown editors.",
      "Best suited for simple formatting like bold, italic, and links.",
    ],
    faqs: [
      {
        question: "Does Carrd support markdown?",
        answer:
          "Carrd supports basic markdown in its Text elements. You can use bold, italic, links, strikethrough, and lists. Advanced features like tables, code blocks, and images use Carrd's own element system.",
      },
      {
        question: "How do you bold text in Carrd?",
        answer:
          "In a Text element, use **bold text** syntax. Carrd will render it as bold on your published one-page site.",
      },
      {
        question: "Does Carrd support tables?",
        answer:
          "No. Carrd does not support markdown tables in Text elements. For tabular data, you would need to use custom HTML/CSS or a Table element if available on your plan.",
      },
      {
        question: "Is Carrd free?",
        answer:
          "Carrd offers a free plan for up to three sites with basic features. Pro plans add custom domains, forms, and additional sites for a yearly fee.",
      },
    ],
    officialUrl: "https://carrd.co",
    keywords:
      "carrd markdown, carrd formatting, carrd markdown support, does carrd support markdown, carrd one page site, carrd text formatting",
  },

  // =========================================================================
  // DEVELOPER TOOLS (5)
  // =========================================================================
  {
    slug: "vs-code",
    name: "VS Code",
    description:
      "Markdown support in Visual Studio Code, including built-in preview, extensions, and editing features.",
    category: "developer-tool",
    markdownSupport: "full",
    intro:
      "Visual Studio Code has excellent built-in markdown support. It includes a live preview pane, syntax highlighting, outline view, and IntelliSense for markdown files. The extension marketplace offers hundreds of additional markdown tools for linting, formatting, and enhanced preview.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "partial", notes: "Requires an extension like Markdown Footnotes" },
    }),
    quirks: [
      "Built-in markdown preview with Ctrl/Cmd + Shift + V or side-by-side with Ctrl/Cmd + K V.",
      "The Outline view shows heading structure for navigation.",
      "Extensions like Markdownlint add linting and formatting rules.",
      "Supports markdown path completion and link validation.",
    ],
    faqs: [
      {
        question: "Does VS Code support markdown?",
        answer:
          "Yes. VS Code has built-in markdown support including syntax highlighting, live preview, outline view, and IntelliSense. Extensions can add linting, formatting, table tools, and more.",
      },
      {
        question: "How do you preview markdown in VS Code?",
        answer:
          "Press Ctrl/Cmd + Shift + V to open the preview in a new tab. For side-by-side preview, press Ctrl/Cmd + K V. The preview updates in real time as you edit.",
      },
      {
        question: "How do you bold text in VS Code?",
        answer:
          "Type **bold text** in your markdown file. You can also select text and use the markdown extension's formatting commands from the command palette.",
      },
      {
        question: "What markdown extensions are useful for VS Code?",
        answer:
          "Popular extensions include Markdownlint for linting, Markdown All in One for shortcuts and table formatting, Markdown Preview Enhanced for advanced preview, and Mermaid diagram support.",
      },
    ],
    officialUrl: "https://code.visualstudio.com",
    keywords:
      "vs code markdown, vscode markdown, vs code markdown support, does vs code support markdown, vscode markdown preview, vscode markdown extensions",
  },
  {
    slug: "dillinger",
    name: "Dillinger",
    description:
      "Dillinger's online markdown editor, including supported syntax, cloud sync, and export options.",
    category: "developer-tool",
    markdownSupport: "gfm",
    intro:
      "Dillinger is a free, online, cloud-ready markdown editor. It provides a split-pane view with live preview, supports GFM, and can sync documents with Dropbox, GitHub, Google Drive, and OneDrive. Dillinger exports to HTML, styled HTML, and PDF.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "no", notes: "Not supported" },
    }),
    quirks: [
      "Works entirely in the browser with no installation.",
      "Supports cloud storage with Dropbox, GitHub, Google Drive, and OneDrive.",
      "Exports to HTML, styled HTML, and PDF.",
      "Open source and can be self-hosted.",
    ],
    faqs: [
      {
        question: "Does Dillinger support markdown?",
        answer:
          "Yes. Dillinger is a GFM-compatible markdown editor with support for headings, bold, italic, links, images, code blocks, tables, and task lists. It provides a live preview as you type.",
      },
      {
        question: "How do you bold text in Dillinger?",
        answer:
          "Wrap the text with double asterisks: **bold text**. Dillinger renders the bold formatting in the live preview pane on the right side.",
      },
      {
        question: "Is Dillinger free?",
        answer:
          "Yes. Dillinger is free, open source, and works in your browser. You can also self-host it if you prefer.",
      },
      {
        question: "Can Dillinger sync with GitHub?",
        answer:
          "Yes. Dillinger can import from and export to GitHub repositories. It also supports Dropbox, Google Drive, and OneDrive.",
      },
    ],
    officialUrl: "https://dillinger.io",
    keywords:
      "dillinger markdown, dillinger editor, dillinger markdown support, does dillinger support markdown, dillinger online editor, dillinger cloud sync",
  },
  {
    slug: "macdown",
    name: "MacDown",
    description:
      "MacDown's markdown editor for macOS, including supported syntax, themes, and customization options.",
    category: "developer-tool",
    markdownSupport: "full",
    intro:
      "MacDown is a free, open-source markdown editor for macOS. It features a split-pane view with live preview, syntax highlighting, and customizable CSS themes. MacDown uses the Hoedown rendering engine and supports GFM with extensions.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Supported via Hoedown extension" },
    }),
    quirks: [
      "macOS only. Uses the Hoedown C library for fast markdown rendering.",
      "Customizable preview themes with user CSS.",
      "Supports auto-completion of markdown syntax.",
      "Inspired by the Mou editor, which is no longer maintained.",
    ],
    faqs: [
      {
        question: "Does MacDown support markdown?",
        answer:
          "Yes. MacDown is a dedicated markdown editor with full support for CommonMark, GFM tables, task lists, footnotes, code blocks, and math rendering.",
      },
      {
        question: "How do you bold text in MacDown?",
        answer:
          "Wrap the text with double asterisks: **bold text**. MacDown renders the bold formatting in the live preview pane on the right.",
      },
      {
        question: "Is MacDown free?",
        answer:
          "Yes. MacDown is completely free and open source. It is available exclusively for macOS.",
      },
      {
        question: "Does MacDown support syntax highlighting?",
        answer:
          "Yes. MacDown supports syntax highlighting in fenced code blocks for many programming languages. The editor itself also highlights markdown syntax.",
      },
    ],
    officialUrl: "https://macdown.uranusjr.com",
    keywords:
      "macdown markdown, macdown editor, macdown markdown support, does macdown support markdown, macdown macos, macdown free editor",
  },
  {
    slug: "marked-2",
    name: "Marked 2",
    description:
      "Marked 2's markdown preview app for macOS, including supported processors, styles, and workflow integration.",
    category: "developer-tool",
    markdownSupport: "full",
    intro:
      "Marked 2 is a markdown preview app for macOS that works alongside your preferred text editor. It watches your markdown files and renders a live preview with customizable styles. Marked 2 supports multiple markdown processors including Discount, MultiMarkdown, and custom preprocessors.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Supported with MultiMarkdown or Discount processor" },
    }),
    quirks: [
      "Not an editor. It is a preview-only app that pairs with any text editor.",
      "Supports multiple markdown processors (Discount, MultiMarkdown, custom).",
      "Includes word count, readability stats, and keyword analysis.",
      "Can export to HTML, PDF, Word, and other formats.",
    ],
    faqs: [
      {
        question: "Does Marked 2 support markdown?",
        answer:
          "Yes. Marked 2 is a dedicated markdown preview app. It supports CommonMark, GFM, MultiMarkdown, and custom processors. It renders all standard markdown syntax plus extensions depending on the chosen processor.",
      },
      {
        question: "How do you use Marked 2?",
        answer:
          "Open a markdown file in Marked 2 or drag it onto the app icon. Marked 2 watches the file for changes and updates the rendered preview in real time as you edit in your preferred text editor.",
      },
      {
        question: "Is Marked 2 free?",
        answer:
          "No. Marked 2 is a paid app available on the Mac App Store. It offers a trial version so you can evaluate it before purchasing.",
      },
      {
        question: "Can Marked 2 export to PDF?",
        answer:
          "Yes. Marked 2 can export rendered markdown to PDF, Word (docx), HTML, and RTF. You can customize the export styles with CSS.",
      },
    ],
    officialUrl: "https://marked2app.com",
    keywords:
      "marked 2 markdown, marked 2 preview, marked 2 markdown support, does marked 2 support markdown, marked 2 macos, marked 2 preview app",
  },
  {
    slug: "writerside",
    name: "Writerside",
    description:
      "JetBrains Writerside's markdown support for technical documentation, including topic-based authoring and live preview.",
    category: "developer-tool",
    markdownSupport: "full",
    intro:
      "Writerside is a JetBrains IDE plugin and standalone tool for creating technical documentation. It supports markdown and XML as authoring formats, provides live preview, and includes features like link validation, content reuse, and API documentation generation.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "no", notes: "Not supported in Writerside markdown" },
      "Task Lists": { support: "yes", notes: "Rendered as interactive checkboxes in preview" },
    }),
    quirks: [
      "Can mix markdown and XML semantic markup in the same project.",
      "Includes built-in live preview and link validation.",
      "Supports content reuse with includes and variables.",
      "Generates API documentation from OpenAPI specifications.",
    ],
    faqs: [
      {
        question: "Does Writerside support markdown?",
        answer:
          "Yes. Writerside supports markdown as one of its authoring formats alongside XML. It handles headings, bold, italic, links, images, code blocks, tables, and task lists with live preview.",
      },
      {
        question: "How do you bold text in Writerside?",
        answer:
          "Use standard markdown syntax: **bold text**. Writerside renders the formatting in its built-in live preview pane.",
      },
      {
        question: "Is Writerside free?",
        answer:
          "Writerside is available as a free plugin for JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.) and as a standalone early-access tool. It is currently offered at no cost.",
      },
      {
        question: "What is the difference between Writerside markdown and XML?",
        answer:
          "Markdown in Writerside is simpler and faster to write. XML semantic markup offers more control over structure and allows richer content types. You can use both in the same project.",
      },
    ],
    officialUrl: "https://www.jetbrains.com/writerside/",
    keywords:
      "writerside markdown, writerside formatting, writerside markdown support, does writerside support markdown, writerside jetbrains, writerside documentation",
  },

  // =========================================================================
  // SOCIAL / MESSAGING (4 new + 3 external)
  // =========================================================================
  {
    slug: "reddit",
    name: "Reddit",
    description:
      "How markdown works in Reddit posts and comments, including the Fancy Pants editor and old vs new Reddit differences.",
    category: "social-messaging",
    markdownSupport: "partial",
    intro:
      "Reddit supports markdown in posts and comments. The new Reddit editor (Fancy Pants) provides a visual toolbar, but you can switch to Markdown Mode for raw markdown input. Old Reddit uses markdown by default. Reddit's markdown flavor has some unique behaviors and limitations.",
    syntaxSupport: fullSyntax({
      Images: { support: "partial", notes: "Only in posts, not comments; use image hosting links" },
      Tables: { support: "yes", notes: "Supported in posts and comments" },
      "Task Lists": { support: "no", notes: "Not supported" },
      Footnotes: { support: "no", notes: "Not supported" },
    }),
    quirks: [
      "New Reddit has Fancy Pants (visual) and Markdown Mode editors.",
      "Old Reddit uses markdown by default in all text fields.",
      "Superscript uses ^(text) or ^word syntax, unique to Reddit.",
      "Two spaces at the end of a line or a double newline creates a line break.",
    ],
    faqs: [
      {
        question: "Does Reddit support markdown?",
        answer:
          "Yes. Reddit supports markdown in posts and comments. On new Reddit, switch to Markdown Mode in the editor. On old Reddit, markdown is the default. Bold, italic, links, code blocks, tables, and more are supported.",
      },
      {
        question: "How do you bold text on Reddit?",
        answer:
          "Wrap the text with double asterisks: **bold text**. In the Fancy Pants editor, you can also use the B button in the toolbar.",
      },
      {
        question: "Does Reddit support tables?",
        answer:
          "Yes. Reddit supports pipe-table syntax in posts and comments. Create tables with headers and rows using | and - characters.",
      },
      {
        question: "How do you add a code block on Reddit?",
        answer:
          "Indent each line with four spaces for a code block. On new Reddit, you can also use triple backticks (```) to create fenced code blocks.",
      },
    ],
    officialUrl: "https://www.reddit.com",
    keywords:
      "reddit markdown, reddit formatting, reddit markdown support, does reddit support markdown, reddit bold text, reddit code block",
  },
  {
    slug: "telegram",
    name: "Telegram",
    description:
      "Markdown-style formatting in Telegram messages, including supported syntax, bots, and MarkdownV2 mode.",
    category: "social-messaging",
    markdownSupport: "partial",
    intro:
      "Telegram supports basic markdown-style formatting in messages. Desktop and mobile apps provide keyboard shortcuts and formatting menus for bold, italic, code, and more. The Telegram Bot API also supports MarkdownV2 parse mode for programmatic message formatting.",
    syntaxSupport: fullSyntax({
      Bold: { support: "yes", notes: "**text** in Bot API; use Ctrl/Cmd + B in apps" },
      Italic: { support: "yes", notes: "__text__ in Bot API; use Ctrl/Cmd + I in apps" },
      Strikethrough: { support: "yes", notes: "~text~ in Bot API; select text and choose strikethrough" },
      Headings: { support: "no", notes: "Not supported" },
      Links: { support: "yes", notes: "[text](url) in Bot API; use link formatting in apps" },
      Images: { support: "no", notes: "Send images as attachments" },
      Blockquotes: { support: "yes", notes: ">text in Bot API MarkdownV2" },
      "Ordered Lists": { support: "no", notes: "Not supported natively" },
      "Unordered Lists": { support: "no", notes: "Not supported natively" },
      "Code (inline)": { support: "yes", notes: "`code` in Bot API and apps" },
      "Code Blocks": { support: "yes", notes: "```lang\\ncode\\n``` in Bot API" },
      Tables: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "no", notes: "Not supported" },
      Footnotes: { support: "no", notes: "Not supported" },
      "Horizontal Rule": { support: "no", notes: "Not supported" },
    }),
    quirks: [
      "The Telegram app uses keyboard shortcuts and menus for formatting, not raw markdown typing.",
      "The Bot API supports MarkdownV2 parse mode for programmatic formatting.",
      "Spoiler text uses ||text|| syntax in the Bot API.",
      "Some formatting requires selecting text first and choosing the format from a menu.",
    ],
    faqs: [
      {
        question: "Does Telegram support markdown?",
        answer:
          "Telegram supports markdown-style formatting for bold, italic, code, links, and strikethrough. In the app, use keyboard shortcuts or the formatting menu. The Bot API supports MarkdownV2 with richer syntax.",
      },
      {
        question: "How do you bold text in Telegram?",
        answer:
          "Select the text and press Ctrl/Cmd + B, or right-click and choose Bold. In the Bot API, use **text** with MarkdownV2 parse mode.",
      },
      {
        question: "Does Telegram support code blocks?",
        answer:
          "Yes. In the Bot API, use triple backticks for code blocks. In the app, select text, right-click, and choose Mono or Code formatting.",
      },
      {
        question: "What is MarkdownV2 in Telegram?",
        answer:
          "MarkdownV2 is a parse mode in the Telegram Bot API that supports bold (**), italic (__), strikethrough (~), code (`), links, spoilers (||), and blockquotes (>). It is used when sending messages programmatically via bots.",
      },
    ],
    officialUrl: "https://telegram.org",
    keywords:
      "telegram markdown, telegram formatting, telegram markdown support, does telegram support markdown, telegram bold text, telegram bot markdown",
  },
  {
    slug: "markdown-here",
    name: "Markdown Here",
    description:
      "How Markdown Here converts markdown to rich text in email clients, supported syntax, and browser extension usage.",
    category: "social-messaging",
    markdownSupport: "full",
    intro:
      "Markdown Here is a browser extension that converts markdown into rendered HTML inside email composers and other rich-text editors. Write your email in markdown, click the Markdown Here button or press the hotkey, and it converts your text to formatted HTML. It works with Gmail, Outlook.com, Yahoo Mail, and more.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "no", notes: "Checkboxes render but are not interactive in email" },
    }),
    quirks: [
      "Converts markdown to HTML in place inside rich-text editors (email composers, etc.).",
      "The conversion is togglable. Click again to revert to markdown.",
      "Works with Gmail, Outlook.com, Yahoo Mail, Thunderbird, and other email clients.",
      "Supports syntax-highlighted code blocks with customizable themes.",
    ],
    faqs: [
      {
        question: "Does Markdown Here support markdown?",
        answer:
          "Yes. Markdown Here converts standard markdown into formatted HTML. It supports headings, bold, italic, links, images, code blocks with syntax highlighting, tables, and lists.",
      },
      {
        question: "How do you use Markdown Here?",
        answer:
          "Install the browser extension, write markdown in an email composer or rich-text editor, then click the Markdown Here button or press Alt + Ctrl + M to convert it to formatted HTML.",
      },
      {
        question: "Does Markdown Here work with Gmail?",
        answer:
          "Yes. Markdown Here works with Gmail, Outlook.com, Yahoo Mail, and many other web-based email clients. It also works with Thunderbird as a standalone extension.",
      },
      {
        question: "Is Markdown Here free?",
        answer:
          "Yes. Markdown Here is free and open source. It is available as a browser extension for Chrome, Firefox, Safari, and as a Thunderbird add-on.",
      },
    ],
    officialUrl: "https://markdown-here.com",
    keywords:
      "markdown here, markdown here extension, markdown here email, does markdown here support markdown, markdown in email, markdown here gmail",
  },
  {
    slug: "buttondown",
    name: "Buttondown",
    description:
      "Buttondown's markdown support for email newsletters, including formatting, metadata, and automation.",
    category: "social-messaging",
    markdownSupport: "full",
    intro:
      "Buttondown is an email newsletter tool built for markdown. You write your newsletter content in markdown, and Buttondown converts it to a clean, styled HTML email. It supports GFM, metadata, subscriber management, and automation features.",
    syntaxSupport: fullSyntax({
      Footnotes: { support: "yes", notes: "Rendered in the email output" },
    }),
    quirks: [
      "Designed specifically for email newsletters written in markdown.",
      "Supports metadata and front matter for newsletter configuration.",
      "Includes subscriber management, analytics, and paid subscriptions.",
      "Also offers a WYSIWYG editor for non-markdown users.",
    ],
    faqs: [
      {
        question: "Does Buttondown support markdown?",
        answer:
          "Yes. Buttondown is built for markdown-based newsletters. It supports full GFM including headings, bold, italic, links, images, code blocks, tables, footnotes, and task lists.",
      },
      {
        question: "How do you bold text in Buttondown?",
        answer:
          "Use standard markdown syntax: **bold text**. Buttondown converts the markdown to styled HTML when the newsletter is sent to subscribers.",
      },
      {
        question: "Is Buttondown free?",
        answer:
          "Buttondown offers a free tier for up to 100 subscribers. Paid plans unlock higher subscriber limits, automation, custom domains, and analytics.",
      },
      {
        question: "Can Buttondown send HTML emails from markdown?",
        answer:
          "Yes. Buttondown converts your markdown content into clean, responsive HTML emails. The styling is customizable, and you can also embed raw HTML when needed.",
      },
    ],
    officialUrl: "https://buttondown.com",
    keywords:
      "buttondown markdown, buttondown formatting, buttondown markdown support, does buttondown support markdown, buttondown newsletter, buttondown email markdown",
  },

  // =========================================================================
  // EXTERNAL ENTRIES (already have their own pages)
  // =========================================================================
  {
    slug: "discord",
    name: "Discord",
    description:
      "Discord markdown formatting guide with syntax for bold, italic, spoilers, code blocks, and more.",
    category: "social-messaging",
    markdownSupport: "custom",
    intro:
      "Discord uses a custom markdown flavor for formatting messages. It supports bold, italic, underline, strikethrough, spoilers, code blocks, and more.",
    syntaxSupport: fullSyntax({
      Headings: { support: "yes", notes: "Supported in chat with # syntax" },
      Images: { support: "no", notes: "Upload or paste images as attachments" },
      Tables: { support: "no", notes: "Not supported" },
      "Task Lists": { support: "no", notes: "Not supported" },
      Footnotes: { support: "no", notes: "Not supported" },
    }),
    faqs: [
      {
        question: "Does Discord support markdown?",
        answer:
          "Yes. Discord uses a custom markdown flavor that supports bold, italic, underline, strikethrough, spoilers, code blocks, blockquotes, headers, and lists in chat messages.",
      },
      {
        question: "How do you bold text in Discord?",
        answer:
          "Wrap the text with double asterisks: **bold text**. You can also combine bold with italic using ***bold italic***.",
      },
      {
        question: "How do you add spoiler text in Discord?",
        answer:
          "Wrap the text with double pipes: ||spoiler text||. The content is hidden until the reader clicks on it.",
      },
    ],
    officialUrl: "https://discord.com",
    keywords:
      "discord markdown, discord formatting, discord markdown support, discord bold text, discord code blocks",
    externalPath: "/discord-markdown",
  },
  {
    slug: "slack",
    name: "Slack",
    description:
      "Slack text formatting guide with its non-standard markdown-like syntax for messages.",
    category: "social-messaging",
    markdownSupport: "custom",
    intro:
      "Slack uses its own formatting syntax called mrkdwn, which differs from standard markdown. It supports bold, italic, strikethrough, code, links, and lists with non-standard syntax.",
    syntaxSupport: [
      { format: "Bold", syntax: "*text*", support: "yes", notes: "Single asterisks for bold (not standard)" },
      { format: "Italic", syntax: "_text_", support: "yes", notes: "Underscores for italic" },
      { format: "Strikethrough", syntax: "~text~", support: "yes", notes: "Single tilde" },
      { format: "Headings", syntax: "Not supported", support: "no" },
      { format: "Links", syntax: "<url|text>", support: "yes", notes: "Uses angle bracket syntax" },
      { format: "Images", syntax: "Not supported", support: "no", notes: "Upload or paste images" },
      { format: "Blockquotes", syntax: "> quote", support: "yes" },
      { format: "Ordered Lists", syntax: "1. item", support: "yes" },
      { format: "Unordered Lists", syntax: "- item", support: "yes", notes: "Use bullet point character" },
      { format: "Code (inline)", syntax: "`code`", support: "yes" },
      { format: "Code Blocks", syntax: "```code```", support: "yes" },
      { format: "Tables", syntax: "Not supported", support: "no" },
      { format: "Task Lists", syntax: "Not supported", support: "no" },
      { format: "Footnotes", syntax: "Not supported", support: "no" },
      { format: "Horizontal Rule", syntax: "Not supported", support: "no" },
    ],
    faqs: [
      {
        question: "Does Slack support markdown?",
        answer:
          "Slack uses its own formatting syntax called mrkdwn, which is similar to but different from standard markdown. Bold uses single asterisks (*bold*), and links use angle brackets (<url|text>).",
      },
      {
        question: "How do you bold text in Slack?",
        answer:
          "Wrap the text with single asterisks: *bold text*. This is different from standard markdown which uses double asterisks.",
      },
      {
        question: "Does Slack support tables?",
        answer:
          "No. Slack does not support tables in messages. For tabular data, use code blocks with monospaced formatting or share a spreadsheet link.",
      },
    ],
    officialUrl: "https://slack.com",
    keywords:
      "slack markdown, slack formatting, slack mrkdwn, slack bold text, slack code block",
    externalPath: "/slack-markdown",
  },
  {
    slug: "github",
    name: "GitHub",
    description:
      "GitHub Flavored Markdown (GFM) guide covering task lists, tables, alerts, emoji, and footnotes.",
    category: "social-messaging",
    markdownSupport: "gfm",
    intro:
      "GitHub uses GitHub Flavored Markdown (GFM), an extension of CommonMark. It adds autolinked references, task lists, tables, strikethrough, emoji shortcuts, alerts, and footnotes.",
    syntaxSupport: fullSyntax(),
    faqs: [
      {
        question: "Does GitHub support markdown?",
        answer:
          "Yes. GitHub uses GitHub Flavored Markdown (GFM), which extends CommonMark with tables, task lists, strikethrough, autolinks, emoji shortcuts, alerts, and footnotes.",
      },
      {
        question: "How do you bold text on GitHub?",
        answer:
          "Wrap the text with double asterisks: **bold text**. This works in issues, pull requests, comments, README files, and any .md file.",
      },
      {
        question: "Does GitHub support task lists?",
        answer:
          "Yes. Use - [ ] for unchecked and - [x] for checked items. Task lists are interactive in issues and pull requests, so you can check them off directly.",
      },
    ],
    officialUrl: "https://github.com",
    keywords:
      "github markdown, github flavored markdown, gfm, github bold text, github tables, github task lists",
    externalPath: "/github-markdown",
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getToolBySlug(slug: string): MarkdownTool | undefined {
  return MARKDOWN_TOOLS.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(
  category: MarkdownTool["category"],
): MarkdownTool[] {
  return MARKDOWN_TOOLS.filter((tool) => tool.category === category);
}
