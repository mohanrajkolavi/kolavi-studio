import { marked } from "marked";
import DOMPurify from "dompurify";

let purifyInstance: typeof DOMPurify | null = null;

function getPurify() {
  if (typeof window === "undefined") return null;
  if (!purifyInstance) {
    purifyInstance = DOMPurify;
  }
  return purifyInstance;
}

export function parseMarkdown(
  input: string,
  options?: { gfm?: boolean; sanitize?: boolean }
): string {
  const { gfm = true, sanitize = true } = options ?? {};

  const html = marked.parse(input, {
    gfm,
    breaks: gfm,
    async: false,
  }) as string;

  if (!sanitize) return html;

  const purify = getPurify();
  if (!purify) return html;

  // Default-deny sanitization. All callers are markdown editor tools where users
  // paste their own content - iframe/script/event-handler allowances are not needed
  // and would expose XSS if any rendered output were ever persisted or shared.
  return purify.sanitize(html);
}

export function minifyHtml(html: string): string {
  return html
    .replace(/\n\s*/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
${body}
</body>
</html>`;
}
