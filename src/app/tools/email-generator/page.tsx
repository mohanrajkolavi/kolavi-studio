import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { EmailGenerator } from "@/components/tools/EmailGenerator";
import { SITE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Sparkles,
  Zap,
  Target,
  Shield,
  ArrowRight,
  Clock,
  Palette,
  Ruler,
  Type as TypeIcon,
  Signature as SignatureIcon,
  Briefcase,
  Megaphone,
  MessageSquareReply,
  Heart,
  HeartHandshake,
  Calendar,
  FileText,
  XCircle,
  PartyPopper,
  CircleSlash,
  Handshake,
  AtSign,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Users,
  GraduationCap,
  Rocket,
  UserPen,
  Compass,
} from "lucide-react";

export const metadata = getPageMetadata({
  title: "Free AI Email Generator - Write Pro Emails in Seconds",
  description:
    "Free AI email generator. Write cold outreach, follow-ups, replies, subject lines, and signatures in seconds. 15 email types, 3 variants, no signup.",
  path: "/tools/email-generator",
  keywords:
    "ai email generator, ai email generator free, free ai email generator, email generator ai, ai email writer, ai email response generator, ai sales email generator, ai email reply generator, ai email subject line generator, ai cold email generator, ai email marketing generator, ai business email generator, ai professional email generator, ai email signature generator, email ai generator",
});

/* ------------------------------------------------------------------ */
/*  JSON-LD Schemas (BreadcrumbList + SoftwareApplication + FAQPage    */
/*  + HowTo + WebPage)                                                 */
/* ------------------------------------------------------------------ */

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is an AI email generator?",
    a: "An AI email generator is a tool that uses artificial intelligence to write professional emails for you in seconds. You enter the purpose, recipient, and tone, and the AI produces a full email with subject line, preview text, body copy, and a clear call to action. Unlike a generic chatbot, a purpose-built AI email generator is tuned for email-specific rules like subject length, deliverability best practices, and scannable structure.",
  },
  {
    q: "Is the AI email generator really free?",
    a: "Yes, completely free. No signup, no credit card, no trial expiry. You can generate up to 8 batches per day from one IP address (24 full emails or 40 subject lines, every day). Use the output for personal, business, or commercial purposes.",
  },
  {
    q: "How does the AI write emails?",
    a: "The tool sends your context to Claude Haiku 4.5, an Anthropic model, along with a purpose-built prompt that encodes real copywriting rules (subject length caps, banned phrases, structure templates per email type). The AI returns 3 variants per generation, each from a different angle (direct, warm, curious) with subject line, preview text, body, and a suggested CTA.",
  },
  {
    q: "What email types can this tool generate?",
    a: "Fifteen core types: cold outreach, sales pitch, follow-up, networking, introduction, reply, thank-you, apology, meeting request, feedback request, job application, cancellation or decline, newsletter, welcome, and break-up or re-engagement. Plus two specialized modes: subject-line only and email signature only.",
  },
  {
    q: "How do I write a professional email?",
    a: "A professional email has five parts: a specific subject line under 60 characters, a clear opener that names the purpose, a short body that delivers one main idea, one single call to action, and a brief closing with your name. Keep paragraphs under 3 sentences. Skip filler like 'hope this finds you well'. Read it aloud before sending - if you stumble, rewrite it.",
  },
  {
    q: "How do I write a cold email that gets replies?",
    a: "Lead with one concrete reason you contacted this specific person, not a template greeting. Pair that with a single benefit or curiosity hook. Keep the whole email under 150 words. End with one low-friction ask (a short call, a yes or no question, a resource). Use the Cold Outreach template in this tool for an angle-diverse starting point.",
  },
  {
    q: "How do I write a follow-up email after no reply?",
    a: "Anchor it to the last exchange in one line, add fresh value (an update, a relevant article, a new idea), then pose a single clear question that is easy to say yes or no to. Skip 'just following up' and 'bumping this'. Use the Follow-up mode in this tool to generate three variants in different tones.",
  },
  {
    q: "How do I write an email reply?",
    a: "Reply to a message by acknowledging what they said in one line, answering their question or decision directly, and naming the next action if there is one. Keep your reply shorter than the email you received whenever possible. Use Reply mode in this tool to draft three concise responses.",
  },
  {
    q: "What makes a good email subject line?",
    a: "A good subject line is specific, short (under 60 characters, ideally 41-50), and previews the real value of the email. Avoid generic phrases like 'quick question' or 'checking in'. Use curiosity, a specific benefit, a number, a personal reference, or a question. The Subject Line Only mode in this tool generates 5 variants across these styles.",
  },
  {
    q: "How long should an email subject line be?",
    a: "Forty-one to fifty characters is the sweet spot on most email clients. Anything over sixty characters gets cut off on mobile previews. Keep the most important word or number in the first thirty characters because that is what readers see first in their inbox.",
  },
  {
    q: "How long should a professional email be?",
    a: "Most professional emails should be one hundred to two hundred words. Cold outreach and follow-ups work best at fifty to one hundred words. Detailed proposals and newsletters can run two hundred to three hundred words. The Length toggle in this tool lets you pick short, medium, or long.",
  },
  {
    q: "Can I use AI-generated emails for cold sales outreach legally?",
    a: "Yes, in most regions. CAN-SPAM in the US, CASL in Canada, and GDPR in Europe govern commercial email. They focus on consent, truthful subject lines, a valid physical address, and an unsubscribe option, not on whether a human or AI wrote the body. Always check your local rules and avoid misleading content.",
  },
  {
    q: "Will AI-generated emails land in spam?",
    a: "Deliverability depends on sender reputation, SPF/DKIM/DMARC authentication, domain age, and send volume - not on whether a human or AI wrote the words. Poor deliverability usually means your sending infrastructure is broken, not your copy. Warm up new domains, set up authentication, and avoid misleading subjects.",
  },
  {
    q: "Can the AI match a specific tone?",
    a: "Yes. The Tone slider offers five levels: Formal, Professional, Balanced, Warm, and Persuasive. Pair this with the Email Type (for structure) and Length (for depth) to get output that matches how you actually want to sound in this situation.",
  },
  {
    q: "Can I generate an email signature with this tool?",
    a: "Yes. Select Email Signature from the specialized modes. The tool generates three signature variants on a single request: a minimal 2-line version, a full 4-line professional version, and a marketing version with a P.S. hook. Copy whichever matches your channel.",
  },
  {
    q: "Can I generate email marketing campaigns with AI?",
    a: "Yes. Pick the Newsletter, Welcome, or Break-up mode depending on the campaign stage. The AI returns 3 angle-diverse variants with subject, preview text, body, and CTA so you can A/B test or pick the strongest. Pair with the Subject Line Only mode to test additional subject variations.",
  },
  {
    q: "How is this different from ChatGPT for email?",
    a: "ChatGPT is a general model with no email-specific structure. This tool has 15 email-type configurations, each with its own prompt, structure template, subject guide, and banned-phrase list. It also caps subject lines at 60 characters, preview text at 90, and validates word count per length preset. Output is consistent and ready to paste into any email client.",
  },
  {
    q: "Is my data stored or used to train AI models?",
    a: "Your input is sent to Anthropic for generation and is not used to train their models (per Anthropic's default API policy). We do not store the text of your email or sell input data. We log only generation counts for rate limiting and anonymous analytics, hashed by IP, not by content.",
  },
];

const EMAIL_TYPES_CATALOG: {
  type: string;
  name: string;
  purpose: string;
  exampleSubject: string;
  icon: React.ElementType;
}[] = [
  { type: "cold-outreach", name: "Cold Outreach", purpose: "Start a conversation with a stranger.", exampleSubject: "Acme + your Q3 pipeline", icon: Target },
  { type: "sales-pitch", name: "Sales Pitch", purpose: "Turn interest into a booked call.", exampleSubject: "30 min back in your week", icon: Briefcase },
  { type: "follow-up", name: "Follow-up", purpose: "Re-open a stalled thread.", exampleSubject: "Re: our Thursday call", icon: MessageSquareReply },
  { type: "networking", name: "Networking", purpose: "Build a real professional connection.", exampleSubject: "Loved your take on onboarding", icon: Handshake },
  { type: "introduction", name: "Introduction", purpose: "Introduce yourself or two people.", exampleSubject: "Intro: Sam <> Lila", icon: AtSign },
  { type: "reply", name: "Reply", purpose: "Answer and move the thread forward.", exampleSubject: "Re: pricing for Q4", icon: MessageSquare },
  { type: "thank-you", name: "Thank You", purpose: "Send genuine, specific gratitude.", exampleSubject: "Thank you for the intro", icon: Heart },
  { type: "apology", name: "Apology", purpose: "Own a mistake and offer a fix.", exampleSubject: "Apology for yesterday's delay", icon: HeartHandshake },
  { type: "meeting-request", name: "Meeting Request", purpose: "Make saying yes easy.", exampleSubject: "15-min sync on Q4 plan?", icon: Calendar },
  { type: "feedback-request", name: "Feedback Request", purpose: "Ask for specific low-effort input.", exampleSubject: "2-minute feedback on this draft?", icon: FileText },
  { type: "application", name: "Job Application", purpose: "Show you are the clear fit.", exampleSubject: "Senior PM application - Jane Smith", icon: Briefcase },
  { type: "cancellation", name: "Cancellation or Decline", purpose: "Say no with warmth and clarity.", exampleSubject: "Not the right fit this quarter", icon: XCircle },
  { type: "newsletter", name: "Newsletter / Announcement", purpose: "Deliver news with a reader takeaway.", exampleSubject: "3 things we shipped in March", icon: Megaphone },
  { type: "welcome", name: "Welcome Email", purpose: "Onboard with a single clear next step.", exampleSubject: "Welcome to Acme, Jane", icon: PartyPopper },
  { type: "break-up", name: "Break-up / Re-engagement", purpose: "Close dormant leads with dignity.", exampleSubject: "Should I close your file?", icon: CircleSlash },
];

const LENGTH_GUIDE: { useCase: string; words: string; example: string; when: string }[] = [
  { useCase: "Cold outreach", words: "50-100", example: "Quick intro", when: "Unknown recipients, low commitment needed" },
  { useCase: "Follow-up", words: "60-120", example: "Reconnect", when: "Stalled thread, add one new value point" },
  { useCase: "Reply", words: "40-150", example: "Direct response", when: "Answer the question, propose next step" },
  { useCase: "Meeting request", words: "60-100", example: "Propose a time", when: "Make saying yes easy" },
  { useCase: "Thank you / apology", words: "50-120", example: "Short and sincere", when: "Specific, not performative" },
  { useCase: "Application", words: "120-200", example: "Credibility pitch", when: "Tie experience to their needs" },
  { useCase: "Newsletter", words: "150-300", example: "Multi-section", when: "Scannable paragraphs + one CTA" },
  { useCase: "Sales pitch", words: "100-180", example: "Benefit-led", when: "Hook, value, proof, CTA" },
];

const EXAMPLE_EMAILS: { type: string; subject: string; body: string }[] = [
  {
    type: "Cold Outreach",
    subject: "Acme + your Q3 sales pipeline",
    body: `Hi Alex,\n\nNoticed your team just opened a new office in Austin. Congrats. When teams expand regions, pipeline visibility usually gets messy fast.\n\nWe built a simple revenue dashboard that rolls up territory performance in real time. Two of your competitors use it to run weekly cross-region reviews without a spreadsheet.\n\nWorth a 15-min call next week to see if the angle fits? Happy to share a 2-minute demo video first if easier.\n\nThanks,\nJane`,
  },
  {
    type: "Follow-up",
    subject: "Re: our Thursday call",
    body: `Hi Sam,\n\nGreat chat on Thursday. You mentioned the onboarding flow was eating 30% of your CS team's time - I pulled together a short benchmark of how 5 similar teams got that under 10%.\n\nShould I send it over, or is the onboarding problem already solved for this quarter?\n\nTwo options, zero pressure.\n\nBest,\nJane`,
  },
  {
    type: "Thank You",
    subject: "Thank you for the intro to Rachel",
    body: `Hi Mike,\n\nQuick note to say thank you for introducing me to Rachel yesterday. She was generous with her time and had practical advice on navigating the FDA submission process.\n\nYour warm intro made the conversation land in a way cold outreach never would have. I owe you one.\n\nGrateful,\nJane`,
  },
  {
    type: "Apology",
    subject: "Apology for yesterday's missed deadline",
    body: `Hi Priya,\n\nI missed yesterday's 5pm deadline for the draft. That is on me - I underestimated the review time and should have flagged it earlier in the week.\n\nThe draft is attached now. I've also blocked tomorrow morning to walk through it together if that helps recover the timeline.\n\nAgain, sorry for the miss. I appreciate your patience.\n\nJane`,
  },
  {
    type: "Meeting Request",
    subject: "15-min sync on the Q4 launch plan?",
    body: `Hi Devon,\n\nI have a few specific decisions I would like to align on before we lock the Q4 launch plan: scope of the beta audience, the pricing anchor, and the GTM sequence.\n\nA 15-minute call should cover it. Could any of these work?\n\n- Tuesday 2:00pm PT\n- Wednesday 10:00am PT\n- Thursday 4:00pm PT\n\nOr grab something that works from my calendar: [link].\n\nThanks,\nJane`,
  },
  {
    type: "Application",
    subject: "Senior Product Manager application - Jane Smith",
    body: `Hi Aisha,\n\nI came across your Senior PM role through the Acme careers page. I've spent the last 5 years shipping B2B analytics products at two companies you likely know (Stripe, Segment), most recently leading a team that grew monthly active users by 3x in 18 months.\n\nThree things stood out about the role: the thesis on self-serve analytics, the emphasis on cross-functional partnership, and the fact that the team reports directly to the CEO.\n\nResume attached. Happy to share a short case study on the MAU growth project on a call. Could we schedule 20 minutes next week?\n\nThanks for your time,\nJane Smith`,
  },
];

function EmailGeneratorSchema() {
  const base = SITE_URL ?? "https://kolavistudio.com";
  const pageUrl = `${base}/tools/email-generator`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${base}/tools` },
        {
          "@type": "ListItem",
          position: 3,
          name: "AI Email Generator",
          item: pageUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AI Email Generator",
      url: pageUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Free AI-powered email generator that writes professional emails, cold outreach, follow-ups, replies, subject lines, and signatures in seconds.",
      featureList: [
        "3 email variants per generation",
        "15 email types: cold outreach, sales pitch, follow-up, networking, introduction, reply, thank-you, apology, meeting request, feedback request, application, cancellation, newsletter, welcome, break-up",
        "Dedicated subject line generator mode (5 variants)",
        "Dedicated email signature generator mode (3 variants)",
        "Tone control (formal, professional, balanced, warm, persuasive)",
        "Length control (short 50-100 words, medium 100-200, long 200-300)",
        "Mobile-optimized subject lines (under 60 characters)",
        "One-click copy for subject, body, or full email",
        "Free, no signup required",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to generate a professional email with AI",
      description:
        "Generate a professional email in 10 seconds using the free KolaviStudio AI Email Generator.",
      totalTime: "PT10S",
      tool: [{ "@type": "HowToTool", name: "KolaviStudio AI Email Generator" }],
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Pick the email type",
          text: "Choose from 15 email types (cold outreach, follow-up, reply, application, and more) or start from a quick template.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Add context",
          text: "Enter your name, optional recipient details, and describe what the email is about. The more specific, the sharper the output.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Set tone and length",
          text: "Slide the tone from Formal to Persuasive and pick Short, Medium, or Long depending on how much detail you need.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Copy your favorite variant",
          text: "Review 3 variants, each with a subject line, preview text, body, and suggested CTA. Copy the subject, body, or full email with one click.",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "Free AI Email Generator - Write Pro Emails in Seconds",
      description:
        "Free AI email generator for cold outreach, follow-ups, replies, subject lines, and signatures. 15 email types, 3 variants per generation, no signup.",
      primaryImageOfPage: `${base}/og-image.jpg`,
      mainEntity: { "@id": pageUrl },
      isPartOf: { "@id": `${base}#website` },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Sparkles,
    title: "3 Variants Per Generation",
    description:
      "One click gives you 3 angle-diverse options (direct, warm, curious) so you can pick the voice that matches the moment. No more staring at a blank draft.",
  },
  {
    icon: Mail,
    title: "15 Email Types Built-In",
    description:
      "From cold outreach to apologies to newsletters, each type has its own prompt, structure template, and banned-phrase guardrails. You never get generic output.",
  },
  {
    icon: TypeIcon,
    title: "Subject Line Generator",
    description:
      "Dedicated Subject Line Only mode returns 5 variants across curiosity, benefit, urgency, personal, question, and numeric styles. Mobile-optimized under 60 characters.",
  },
  {
    icon: SignatureIcon,
    title: "Email Signature Generator",
    description:
      "Separate signature mode produces 3 clean variants: minimal (2 lines), full (4 lines), and marketing (with a P.S. hook). Copy the one that fits the channel.",
  },
  {
    icon: Palette,
    title: "Tone and Length Control",
    description:
      "Slide the tone from Formal to Persuasive. Pick Short (50-100 words), Medium (100-200), or Long (200-300). Match the email to the relationship.",
  },
  {
    icon: Shield,
    title: "Free, No Signup",
    description:
      "No account, no credit card, no watermark. Generate up to 8 batches per day (24 full emails or 40 subject lines) completely free, forever.",
  },
];

const useCases = [
  {
    icon: Rocket,
    title: "Founders and Operators",
    description:
      "Founders use it for investor updates, customer outreach, and partnership emails. Every line needs to earn its place when your inbox is the company.",
  },
  {
    icon: Briefcase,
    title: "Sales and Business Development",
    description:
      "Sales reps use Cold Outreach, Follow-up, and Break-up modes to run full sequences without templating the same line 40 times. Each variant reads different.",
  },
  {
    icon: UserPen,
    title: "Job Seekers",
    description:
      "Application mode positions you as the fit, not a generic applicant. Combine with Follow-up for post-interview notes and Thank You for after a referral intro.",
  },
  {
    icon: GraduationCap,
    title: "Students and Researchers",
    description:
      "Email professors, request letters of recommendation, reach out to conference speakers. Tone slider calibrates formality so you never over- or under-shoot.",
  },
  {
    icon: Heart,
    title: "Customer Success and Support",
    description:
      "Reply, Thank-you, and Apology modes help craft empathetic responses under pressure. Consistent voice, no generic corporate templates.",
  },
  {
    icon: Megaphone,
    title: "Marketers and Creators",
    description:
      "Newsletter, Welcome, and Break-up modes power the full lifecycle. Use Subject Line Only mode to A/B test headlines without rewriting body copy.",
  },
];

const subjectLineTips = [
  {
    icon: Ruler,
    title: "Keep it under 60 characters",
    description:
      "Most inbox clients cut subject lines off around 60 characters. Aim for 41 to 50 for the highest mobile open rate. Put the most important word in the first 30 characters because that is what readers see first.",
  },
  {
    icon: Target,
    title: "Be specific, not catchy",
    description:
      "Generic 'Quick question' subject lines get ignored. Specific ones like 'Acme + your Q3 pipeline' or 'Answer on the pricing question' earn opens. Name the person, company, number, or outcome.",
  },
  {
    icon: Lightbulb,
    title: "Match the body",
    description:
      "If your subject is 'A 2-minute read on onboarding' and the body is a 600-word essay, you lose trust fast. Preview text is a second subject line. Use both to tell the reader what they are actually about to read.",
  },
  {
    icon: Sparkles,
    title: "Use one of 6 proven styles",
    description:
      "Curiosity (unanswered question), benefit (clear outcome), urgency (specific deadline), personal (their name or detail), question (end with ?), or numeric (a specific number). Pick one per subject, not three.",
  },
  {
    icon: Mail,
    title: "Test multiple angles",
    description:
      "The Subject Line Only mode in this tool returns 5 variants across different styles. Pick the top 2, send each to half your list, and let open rate decide. One test teaches you more than 10 guesses.",
  },
  {
    icon: Shield,
    title: "Avoid spam triggers",
    description:
      "Words like FREE, URGENT, !!!, and ALL CAPS trigger spam filters and signal amateur hour. Avoid excessive punctuation and exclamation marks. A clean subject reads calmly in the inbox.",
  },
];

const proTips = [
  {
    icon: Lightbulb,
    title: "Lead with the ask",
    description:
      "Great emails put the purpose in the first line, not the last. 'I want to schedule a 30-minute call about the Q4 plan' beats four paragraphs ending in 'so I was wondering if you had time to chat'.",
  },
  {
    icon: Target,
    title: "Specificity over generality",
    description:
      "Every concrete detail (name, metric, product feature, date, company) raises reply rate. Fill the context field with the actual situation, not the general idea.",
  },
  {
    icon: MessageSquare,
    title: "Read it aloud",
    description:
      "If your email sounds like a robot when spoken, it reads like one too. Read every draft out loud. Cut any line that stumbles or feels like throat-clearing.",
  },
  {
    icon: Ruler,
    title: "No walls of text",
    description:
      "Paragraphs over 3 lines lose mobile readers instantly. Break into 1-3 sentence paragraphs with space between. Use bullets only when the list is genuinely parallel.",
  },
  {
    icon: ArrowRight,
    title: "One single CTA",
    description:
      "Two calls to action equals zero calls to action. Ask for one specific next step (a call, a reply, a decision, a resource) and make it as easy as possible to say yes.",
  },
  {
    icon: CheckCircle,
    title: "Subject matches body",
    description:
      "Your subject line is a promise. The first paragraph of your body should deliver on it. If they do not match, the email feels like clickbait and trust drops.",
  },
];

const mistakes = [
  {
    mistake: "Opening with 'I hope this email finds you well'",
    fix:
      "This phrase has no information value and signals a template. Open with a specific reference to the recipient, a shared context, or the actual reason you are writing.",
  },
  {
    mistake: "Burying the ask in paragraph 3",
    fix:
      "Readers scan the first 2 lines, then decide. Put the request or purpose in the first sentence or two. Move background context after the ask, not before it.",
  },
  {
    mistake: "Writing like a corporate bot",
    fix:
      "Contractions (I'm, we'll, don't) sound human. Words like 'leverage', 'synergy', 'unlock', 'empower', and 'seamless' sound like a SaaS landing page. This tool strips all of those from output.",
  },
  {
    mistake: "Using two or more CTAs",
    fix:
      "Asking for 'either a call or maybe a meeting or perhaps just a quick reply' equals asking for nothing. Pick one ask, remove the rest, and make that one trivially easy.",
  },
  {
    mistake: "Ignoring the subject line",
    fix:
      "People spend 30 seconds writing a 500-word body then slap on 'Checking in' at the top. The subject is half the email. Run your subjects through the Subject Line Only mode here.",
  },
  {
    mistake: "Sending without reading it aloud",
    fix:
      "Every single professional email should be read out loud before it sends. You will catch awkward phrasing, missed words, and tone mismatches in 20 seconds that no amount of silent re-reading catches.",
  },
];

export default function EmailGeneratorPage() {
  const base = SITE_URL ?? "https://kolavistudio.com";

  return (
    <main className="relative w-full">
      <EmailGeneratorSchema />

      {/* HERO */}
      <section className="relative min-h-[80dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[120px] pb-20">
        <div className="absolute inset-0 bg-hero-atmosphere pointer-events-none" />
        <div className="relative z-10 w-full animate-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                FREE AI TOOL
              </div>
              <h1 className="text-h1 text-foreground mb-6 text-balance">
                Free AI Email Generator - Write Professional Emails in Seconds
              </h1>
              <p className="text-[18px] sm:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-4 text-balance">
                Generate cold outreach, follow-ups, replies, subject lines, and signatures in 10 seconds. 15 email types, 3 variants per generation, ready to copy.
              </p>
              <p className="text-[15px] font-medium text-muted-foreground/80 mb-10">
                No signup. No credit card. Just the email you need, written.
              </p>

              <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
                <a href="#generator">
                  Generate Your Email
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>

              {/* CITATION CAPSULE */}
              <div className="mt-12 mx-auto max-w-2xl rounded-[20px] border border-border bg-card/80 backdrop-blur p-5 text-left">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-1">Speed</p>
                    <p className="text-[16px] font-bold text-foreground">10 seconds</p>
                  </div>
                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-1">Types</p>
                    <p className="text-[16px] font-bold text-foreground">15 email types</p>
                  </div>
                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-1">Variants</p>
                    <p className="text-[16px] font-bold text-foreground">3 per generation</p>
                  </div>
                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-1">Price</p>
                    <p className="text-[16px] font-bold text-foreground">Free forever</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GENERATOR */}
      <section id="generator" className="relative z-10 bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-[24px] border border-border bg-card p-6 sm:p-10 shadow-sm">
              <EmailGenerator />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="relative z-10 bg-background py-24 sm:py-32 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              WHY THIS TOOL
            </div>
            <h2 className="text-h2 text-foreground max-w-2xl mx-auto">
              What Makes This AI Email Generator Different
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Most tools give you one generic draft. Ours gives you 3 angle-diverse variants, 15 email types, and dedicated subject + signature modes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-[20px] font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-small text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT IS AN AI EMAIL GENERATOR */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <h2 className="text-h2 text-foreground">What Is an AI Email Generator?</h2>
          </div>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-5 animate-reveal" style={{ animationDelay: "100ms" }}>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              An AI email generator is a tool that uses artificial intelligence to produce professional emails for you in seconds. You provide the context (who it is from, who it is for, what it is about, the tone you want), and the AI returns a complete email with subject line, preview text, body copy, and a clear call to action. Unlike a generic writing assistant, a purpose-built AI email generator encodes email-specific rules like subject length caps, mobile preview limits, scannable paragraph structure, and banned-phrase lists that catch AI tells before they reach your recipient.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              The best AI email generators differ from general chatbots in three ways. First, they have per-type configurations. A cold outreach email needs different structure than an apology; a newsletter needs different pacing than a job application. Second, they validate output (length, character caps, duplicate subjects) server-side rather than trusting the raw model. Third, they produce multiple angle-diverse variants per generation so you can pick rather than edit.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              Unlike <strong>ChatGPT</strong> (a general conversational model), unlike <strong>Mailchimp</strong> or <strong>Marketo</strong> (email sequencers focused on delivery), and unlike <strong>Superhuman</strong> (an inbox client), this tool specializes in one thing: writing the email itself. It covers 15 email types from cold outreach to break-up emails, plus dedicated modes for subject lines and signatures, so you rarely need a second tool for the same task.
            </p>
          </div>
        </div>
      </section>

      {/* KEY TAKEAWAYS */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <aside className="rounded-[24px] border-2 border-primary/20 bg-primary/5 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-[18px] sm:text-[20px] font-bold text-foreground">Key Takeaways</h2>
            </div>
            <ul className="space-y-2.5 text-[14px] sm:text-[15px] text-foreground leading-relaxed">
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">-</span>
                <span>Professional emails have 5 parts: specific subject under 60 chars, clear opener, short body with one idea, single CTA, brief close.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">-</span>
                <span>Subject lines of 41-50 characters get the highest open rates; over 60 characters get cut off on mobile.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">-</span>
                <span>Most business emails work best at 100-200 words; cold outreach at 50-100 words has higher reply rates.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">-</span>
                <span>AI-written emails are legal for commercial use (CAN-SPAM, CASL, GDPR govern consent and honesty, not authorship).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">-</span>
                <span>Deliverability depends on SPF/DKIM/DMARC and sender reputation, not whether a human or AI wrote the copy.</span>
              </li>
            </ul>
            <p className="mt-4 text-[12px] text-muted-foreground font-mono">
              tldr: free AI tool, 15 email types, 3 variants, mobile-optimized subjects, no signup required.
            </p>
          </aside>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              4 SIMPLE STEPS
            </div>
            <h2 className="text-h2 text-foreground">How to Generate a Professional Email With AI</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              { step: "1", title: "Pick the email type", description: "Choose from 15 email types or start with a quick template. Specialized modes cover subject-lines and signatures." },
              { step: "2", title: "Add context", description: "Enter your name, optional recipient details, and describe what the email is about. The more specific, the sharper the output." },
              { step: "3", title: "Set tone and length", description: "Slide from Formal to Persuasive and pick Short, Medium, or Long depending on how much detail you need." },
              { step: "4", title: "Copy your variant", description: "Review 3 variants with subject, preview text, body, and CTA. Copy the subject, body, or full email with one click." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl mb-5 border border-primary/20">
                  {item.step}
                </div>
                <h3 className="text-[18px] font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-small text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
              <a href="#generator">
                Try It Now - Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 15 EMAIL TYPES GRID */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              EMAIL TYPES
            </div>
            <h2 className="text-h2 text-foreground">What Email Types Can You Generate?</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Fifteen built-in types, each with its own structure, subject guide, and style rules. Plus two specialized modes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-reveal" style={{ animationDelay: "150ms" }}>
            {EMAIL_TYPES_CATALOG.map((emailType) => {
              const Icon = emailType.icon;
              return (
                <div
                  key={emailType.type}
                  className="rounded-[20px] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-[17px] font-bold text-foreground mb-2">{emailType.name}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                    {emailType.purpose}
                  </p>
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-[12px] text-muted-foreground mb-4">
                    <span className="font-semibold">Example:</span> {emailType.exampleSubject}
                  </div>
                  <a
                    href="#generator"
                    className="text-[13px] font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Use this type
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* EMAIL LENGTH GUIDE */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              REFERENCE
            </div>
            <h2 className="text-h2 text-foreground">How Long Should a Professional Email Be?</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Different email types need different lengths. Here is the quick reference.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 sm:px-5 py-4 font-semibold text-foreground">Email Type</th>
                  <th className="text-center px-4 sm:px-5 py-4 font-semibold text-foreground">Word Target</th>
                  <th className="text-left px-4 sm:px-5 py-4 font-semibold text-foreground hidden sm:table-cell">When to Use</th>
                </tr>
              </thead>
              <tbody>
                {LENGTH_GUIDE.map((row, i) => (
                  <tr
                    key={row.useCase}
                    className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                  >
                    <td className="px-4 sm:px-5 py-3.5 font-medium text-foreground">{row.useCase}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-center tabular-nums text-muted-foreground">
                      {row.words}
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-muted-foreground text-xs hidden sm:table-cell">
                      {row.when}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SUBJECT LINE TIPS (dedicated H2 for the subject-line keyword) */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              SUBJECT LINES
            </div>
            <h2 className="text-h2 text-foreground">How to Write a Subject Line That Gets Opened</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Half the value of an email is in the subject. Here are the six rules that consistently raise open rates.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {subjectLineTips.map((tip) => {
              const Icon = tip.icon;
              return (
                <div key={tip.title} className="flex gap-4 rounded-[20px] border border-border bg-card p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-foreground mb-2">{tip.title}</h3>
                    <p className="text-small text-muted-foreground leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg" className="rounded-[48px] text-[15px] h-12 px-6">
              <a href="#generator">
                <TypeIcon className="w-4 h-4 mr-2" />
                Try Subject Line Only Mode
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* REAL EXAMPLE TEMPLATES */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              EXAMPLES
            </div>
            <h2 className="text-h2 text-foreground">Real Email Examples You Can Copy</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Six ready-to-adapt templates covering the most common professional scenarios.
            </p>
          </div>
          <div className="space-y-6 animate-reveal" style={{ animationDelay: "100ms" }}>
            {EXAMPLE_EMAILS.map((example) => (
              <div key={example.type} className="rounded-[20px] border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider">
                    {example.type}
                  </span>
                </div>
                <div className="text-[13px] font-semibold text-foreground mb-1">
                  Subject: <span className="font-normal">{example.subject}</span>
                </div>
                <pre className="mt-3 text-[13px] sm:text-[14px] leading-relaxed text-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-4 border border-border/50 select-all">
                  {example.body}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRO TIPS */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              PRO TIPS
            </div>
            <h2 className="text-h2 text-foreground">Tips for Writing Emails That Actually Get Replies</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Pair the AI with these timeless email-writing principles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {proTips.map((tip) => {
              const Icon = tip.icon;
              return (
                <div key={tip.title} className="flex gap-4 rounded-[20px] border border-border bg-card p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-foreground mb-2">{tip.title}</h3>
                    <p className="text-small text-muted-foreground leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMMON MISTAKES */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              AVOID THESE
            </div>
            <h2 className="text-h2 text-foreground">Common Email Mistakes That Kill Reply Rates</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Even with AI, these six pitfalls will tank your open and reply rates.
            </p>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {mistakes.map((item) => (
              <div key={item.mistake} className="flex gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground mb-1">{item.mistake}</h3>
                  <p className="text-small text-muted-foreground leading-relaxed">{item.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI vs HUMAN */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              COMPARISON
            </div>
            <h2 className="text-h2 text-foreground">AI vs Human-Written Emails: When to Use Each</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              AI is not always the answer. Here is the honest trade-off.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 sm:px-5 py-4 font-semibold text-foreground">Factor</th>
                  <th className="text-left px-4 sm:px-5 py-4 font-semibold text-foreground">AI Generated</th>
                  <th className="text-left px-4 sm:px-5 py-4 font-semibold text-foreground">Human Written</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { factor: "Speed", ai: "10 seconds per email", human: "10-30 minutes per email" },
                  { factor: "Consistency", ai: "Identical structure every time", human: "Varies with mood and fatigue" },
                  { factor: "Personalization", ai: "High if you feed concrete details", human: "Naturally high for people you know" },
                  { factor: "Tone match", ai: "Calibrated by tone slider", human: "Intuitive but variable" },
                  { factor: "Best for", ai: "Cold outreach, follow-ups, common replies", human: "Sensitive topics, deep relationships" },
                  { factor: "Cost", ai: "Free with this tool", human: "Your time at hourly rate" },
                ].map((row, i) => (
                  <tr key={row.factor} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 sm:px-5 py-3.5 font-medium text-foreground">{row.factor}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-muted-foreground">{row.ai}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-muted-foreground">{row.human}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              USE CASES
            </div>
            <h2 className="text-h2 text-foreground">Who Uses an AI Email Generator?</h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Founders, sales teams, job seekers, students, support teams, and marketers all use it to skip the blank-page phase.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {useCases.map((persona) => {
              const Icon = persona.icon;
              return (
                <div
                  key={persona.title}
                  className="rounded-[24px] border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground mb-2">{persona.title}</h3>
                  <p className="text-small text-muted-foreground leading-relaxed">{persona.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              FAQ
            </div>
            <h2 className="text-h2 text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {FAQ_ITEMS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[20px] border border-border bg-card shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-[16px] font-semibold text-foreground hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-200 text-xl leading-none">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* RELATED TOOLS */}
      <section className="border-t border-border bg-muted/30 py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-10 animate-reveal">
            <h2 className="text-h3 text-foreground">More Free AI Tools From KolaviStudio</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              { href: "/tools/bio-generator", title: "AI Bio Generator", desc: "Generate platform-optimized bios for LinkedIn, Twitter/X, Instagram, and more.", icon: UserPen },
              { href: "/tools/slogan-generator", title: "AI Slogan Generator", desc: "8 catchy slogans, taglines, mottos, or catchphrases in seconds.", icon: Megaphone },
              { href: "/tools/motto-generator", title: "Motto Generator", desc: "Inspiring mottos for yourself, your family, your team, or your company.", icon: Compass },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-[20px] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group block"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{tool.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{tool.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-h2 text-foreground mb-6">Ready to Write Your Next Email?</h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10">
            Stop staring at a blank draft. Get 3 ready-to-send options in under 10 seconds.
          </p>
          <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-10">
            <a href="#generator">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Your Email - Free
            </a>
          </Button>
          <p className="mt-6 text-[12px] text-muted-foreground">
            Canonical URL: <code className="text-muted-foreground">{`${base}/tools/email-generator`}</code>
          </p>
        </div>
      </section>
    </main>
  );
}
