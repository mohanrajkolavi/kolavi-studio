export interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ANSWER_MAX_CHARS = 300;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Parses an FAQ section from article HTML. Expects:
 * - An H2 containing "FAQ" or "Frequently Asked"
 * - Following H3s as questions and the next block (e.g. P) as the answer
 * Returns empty array if no valid FAQ section is found.
 */
export function parseFaqFromArticleHtml(articleHtml: string): FAQItem[] {
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let faqMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = h2Regex.exec(articleHtml)) !== null) {
    const headingText = stripHtml(m[1]);
    if (/FAQ|Frequently Asked/i.test(headingText)) {
      faqMatch = m;
      break;
    }
  }
  if (!faqMatch) return [];

  const afterFaq = faqMatch.index + faqMatch[0].length;
  const nextH2Match = /<h2[^>]*>/i.exec(articleHtml.slice(afterFaq));
  const nextH2Index = nextH2Match ? afterFaq + nextH2Match.index : articleHtml.length;
  const block = articleHtml.slice(afterFaq, nextH2Index);
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const qMatches = [...block.matchAll(h3Regex)];
  const items: FAQItem[] = [];

  for (let i = 0; i < qMatches.length; i++) {
    const question = stripHtml(qMatches[i][1]);
    const afterH3 = qMatches[i].index! + qMatches[i][0].length;
    const nextH3 = qMatches[i + 1];
    const end = nextH3 ? nextH3.index! : block.length;
    const rawAnswer = block.slice(afterH3, end);
    const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(rawAnswer);
    const answer = stripHtml(pMatch ? pMatch[1] : rawAnswer).slice(0, FAQ_ANSWER_MAX_CHARS);
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items;
}

export function getFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
