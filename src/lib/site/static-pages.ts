/**
 * Single source of truth for all non-blog static pages on the site.
 * Consumed by Content Maintenance (indexing UI) and the Rankings dashboard
 * (GSC sync-all). Keep blog posts out of here - they come from WordPress.
 */

export type StaticPage = { path: string; label: string };
export type StaticPageGroup = { category: string; pages: StaticPage[] };

export const STATIC_PAGE_GROUPS: StaticPageGroup[] = [
  {
    category: "Main",
    pages: [
      { path: "/", label: "Home" },
      { path: "/about", label: "About" },
      { path: "/services", label: "Services" },
      { path: "/pricing", label: "Pricing" },
      { path: "/portfolio", label: "Portfolio" },
      { path: "/contact", label: "Contact" },
      { path: "/blog", label: "Blog" },
    ],
  },
  {
    category: "Markdown Tools",
    pages: [
      { path: "/markdown-editor", label: "Markdown Editor" },
      { path: "/markdown-guide", label: "Markdown Guide" },
      { path: "/markdown-syntax", label: "Markdown Syntax" },
      { path: "/markdown-extended-syntax", label: "Extended Syntax" },
      { path: "/markdown-cheat-sheet", label: "Cheat Sheet" },
      { path: "/markdown-formatter", label: "Formatter" },
      { path: "/markdown-to-html", label: "MD to HTML" },
      { path: "/markdown-to-pdf", label: "MD to PDF" },
      { path: "/markdown-hacks", label: "Hacks" },
      { path: "/markdown-table-generator", label: "Table Generator" },
      { path: "/markdown-tools", label: "Tools Hub" },
      { path: "/discord-markdown", label: "Discord Markdown" },
      { path: "/github-markdown", label: "GitHub Markdown" },
      { path: "/slack-markdown", label: "Slack Markdown" },
    ],
  },
  {
    category: "Tools",
    pages: [
      { path: "/tools", label: "Tools Hub" },
      { path: "/tools/speed-audit", label: "Speed Audit" },
      { path: "/tools/bio-generator", label: "Bio Generator" },
      { path: "/tools/sitemap-generator", label: "Sitemap Generator" },
      { path: "/tools/slogan-generator", label: "Slogan Generator" },
      { path: "/tools/motto-generator", label: "Motto Generator" },
    ],
  },
  {
    category: "Partner",
    pages: [
      { path: "/partner", label: "Partner Program" },
      { path: "/partner/apply", label: "Apply" },
    ],
  },
  {
    category: "Markdown Apps",
    pages: [
      { path: "/markdown-tools/obsidian", label: "Obsidian" },
      { path: "/markdown-tools/notion", label: "Notion" },
      { path: "/markdown-tools/bear", label: "Bear" },
      { path: "/markdown-tools/joplin", label: "Joplin" },
      { path: "/markdown-tools/standard-notes", label: "Standard Notes" },
      { path: "/markdown-tools/simplenote", label: "Simplenote" },
      { path: "/markdown-tools/logseq", label: "Logseq" },
      { path: "/markdown-tools/typora", label: "Typora" },
      { path: "/markdown-tools/ia-writer", label: "iA Writer" },
      { path: "/markdown-tools/mark-text", label: "Mark Text" },
      { path: "/markdown-tools/ulysses", label: "Ulysses" },
      { path: "/markdown-tools/zettlr", label: "Zettlr" },
      { path: "/markdown-tools/gitbook", label: "GitBook" },
      { path: "/markdown-tools/mkdocs", label: "MkDocs" },
      { path: "/markdown-tools/docusaurus", label: "Docusaurus" },
      { path: "/markdown-tools/hugo", label: "Hugo" },
      { path: "/markdown-tools/jekyll", label: "Jekyll" },
      { path: "/markdown-tools/docsify", label: "Docsify" },
      { path: "/markdown-tools/wiki-js", label: "Wiki.js" },
      { path: "/markdown-tools/trello", label: "Trello" },
      { path: "/markdown-tools/todoist", label: "Todoist" },
      { path: "/markdown-tools/mattermost", label: "Mattermost" },
      { path: "/markdown-tools/hackmd", label: "HackMD" },
      { path: "/markdown-tools/hedgedoc", label: "HedgeDoc" },
      { path: "/markdown-tools/stackedit", label: "StackEdit" },
      { path: "/markdown-tools/ghost", label: "Ghost" },
      { path: "/markdown-tools/squarespace", label: "Squarespace" },
      { path: "/markdown-tools/carrd", label: "Carrd" },
      { path: "/markdown-tools/vs-code", label: "VS Code" },
      { path: "/markdown-tools/dillinger", label: "Dillinger" },
      { path: "/markdown-tools/macdown", label: "MacDown" },
      { path: "/markdown-tools/marked-2", label: "Marked 2" },
      { path: "/markdown-tools/writerside", label: "Writerside" },
      { path: "/markdown-tools/reddit", label: "Reddit" },
      { path: "/markdown-tools/telegram", label: "Telegram" },
      { path: "/markdown-tools/markdown-here", label: "Markdown Here" },
      { path: "/markdown-tools/buttondown", label: "Buttondown" },
      { path: "/markdown-tools/discord", label: "Discord" },
      { path: "/markdown-tools/slack", label: "Slack" },
      { path: "/markdown-tools/github", label: "GitHub" },
    ],
  },
  {
    category: "Legal",
    pages: [
      { path: "/privacy", label: "Privacy" },
      { path: "/terms", label: "Terms" },
      { path: "/cookies", label: "Cookies" },
      { path: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export const ALL_STATIC_PATHS: string[] = STATIC_PAGE_GROUPS.flatMap((g) =>
  g.pages.map((p) => p.path)
);

export function getStaticPageLabel(path: string): string | null {
  for (const group of STATIC_PAGE_GROUPS) {
    for (const page of group.pages) {
      if (page.path === path) return page.label;
    }
  }
  return null;
}
