import { getPageMetadata } from "@/lib/seo/metadata";
import { SloganGenerator } from "@/components/tools/SloganGenerator";
import { SITE_URL } from "@/lib/constants";
import {
  Sparkles,
  Zap,
  Target,
  Users,
  Shield,
  ArrowRight,
  Megaphone,
  Palette,
  Wand2,
  GraduationCap,
  Heart,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = getPageMetadata({
  title: "Free AI Slogan Generator - Catchy Business Slogan Maker",
  description:
    "Free AI slogan generator that creates catchy, memorable slogans for any business in seconds. Pick your industry, tone, and style. No signup, unlimited generations.",
  path: "/tools/slogan-generator",
  keywords:
    "ai slogan generator, slogan generator, slogan maker, slogan creator, free slogan generator, business slogan generator, ai slogan maker, catchy slogan generator, slogan generator ai, company slogan generator, brand slogan generator",
});

/** JSON-LD SoftwareApplication + FAQPage schema for rich results. */
function SloganGeneratorSchema() {
  const base = SITE_URL ?? "https://kolavistudio.com";
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${base}/tools` },
        { "@type": "ListItem", position: 3, name: "AI Slogan Generator", item: `${base}/tools/slogan-generator` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AI Slogan Generator",
      url: `${base}/tools/slogan-generator`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Free AI-powered slogan generator that creates catchy, memorable slogans, taglines, mottos, and catchphrases for any business or brand in seconds.",
      featureList: [
        "8 unique slogans per generation",
        "Slogan, tagline, motto, and catchphrase modes",
        "Industry-aware suggestions",
        "Tone slider (serious to witty)",
        "Style preferences (rhyming, alliterative, metaphoric)",
        "One-click copy for every result",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a slogan?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A slogan is a short, memorable phrase used in advertising and marketing to promote a brand, product, or idea. Good slogans are 3 to 8 words, easy to remember, and communicate a clear benefit or feeling. Famous examples include Nike's Just Do It, Apple's Think Different, and McDonald's I'm Lovin' It.",
          },
        },
        {
          "@type": "Question",
          name: "How does the AI slogan generator work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your brand name, describe what you do, pick your industry and tone, then click Generate. The AI creates 8 unique slogans instantly, each labeled with a style tag (punchy, rhyming, alliterative, metaphoric, emotional, or witty) and a word count. You can copy any slogan with one click or regenerate to see new options.",
          },
        },
        {
          "@type": "Question",
          name: "Is the AI slogan generator really free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No signup, no credit card, no hidden paywall. You can generate up to 8 batches per day (64 slogans total) from a single IP address.",
          },
        },
        {
          "@type": "Question",
          name: "How do you write a good slogan?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A good slogan is short (3 to 8 words), specific to your brand, easy to remember, and communicates one clear benefit or feeling. Use techniques like rhyme, alliteration, contrast, or metaphor. Avoid cliches like the best or leading provider. Always test a slogan by reading it aloud - if it does not roll off the tongue, keep iterating.",
          },
        },
        {
          "@type": "Question",
          name: "What makes a slogan memorable?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Memorable slogans share a few traits: rhythm (a natural beat when spoken), simplicity (short words, clear meaning), specificity (tied to a real benefit, not generic), and emotional resonance. Techniques like alliteration (Coca-Cola: Open Happiness), rhyme (Beanz Meanz Heinz), and contrast (Apple: Think Different) all make slogans stick.",
          },
        },
        {
          "@type": "Question",
          name: "Slogan vs tagline - what is the difference?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A tagline is a persistent brand identifier that stays with the company for years (Nike: Just Do It). A slogan is typically tied to a specific campaign or product and may change over time (McDonald's: I'm Lovin' It for the current campaign). Taglines capture brand essence, slogans drive specific messages. This generator supports both modes.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use the generated slogan commercially?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, you own the slogans you generate and can use them commercially. Before deploying a slogan publicly, we recommend a trademark search to check that your preferred phrase is not already registered in your industry and territory. A trademark attorney can confirm originality and help you register your own.",
          },
        },
        {
          "@type": "Question",
          name: "Can I customize the tone of the slogans?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Use the tone slider to choose from five levels: Serious, Professional, Balanced, Playful, or Bold & Witty. You can also target specific audiences (enterprise buyers, Gen Z, families, creatives) and pick up to three style preferences (punchy, rhyming, alliterative, metaphoric, emotional, or benefit-led) for even finer control.",
          },
        },
        {
          "@type": "Question",
          name: "Does the slogan generator work for any industry?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The generator supports 35+ industries out of the box (tech, food & beverage, healthcare, finance, retail, SaaS, fashion, fitness, and more) and will accept any custom industry you type into the field. The AI tailors vocabulary, rhythm, and benefit framing to your specific category.",
          },
        },
        {
          "@type": "Question",
          name: "Should I trademark my slogan?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "If your slogan becomes central to your brand and you plan to use it consistently in advertising, trademarking it is a smart move. A trademark prevents competitors from using a confusingly similar phrase in your category. Consult a trademark attorney or use services like LegalZoom or USPTO's TEAS to register. Taglines are more commonly trademarked than campaign-specific slogans.",
          },
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const features = [
  {
    icon: Wand2,
    title: "8 Slogans Per Generation",
    description:
      "One click gives you 8 distinct options, each with a different angle, rhythm, and style tag. No more staring at a blank page or writing 50 variants yourself.",
  },
  {
    icon: Zap,
    title: "Four Modes In One Tool",
    description:
      "Generate slogans, taglines, mottos, or catchphrases with a single toggle. Each mode has its own rules, examples, and length guidance baked into the AI.",
  },
  {
    icon: Target,
    title: "Industry-Aware Output",
    description:
      "Pick from 35+ industries or type your own. The AI tailors vocabulary, benefit framing, and cultural references to your specific category.",
  },
  {
    icon: Palette,
    title: "Style Preferences",
    description:
      "Prefer rhyming, alliterative, or metaphoric slogans? Pick up to 3 style preferences and the AI will weight its output toward your choice.",
  },
  {
    icon: Shield,
    title: "Free, No Signup",
    description:
      "No account, no credit card, no watermark. Generate up to 8 batches per day (64 slogans total) completely free, forever.",
  },
];

const lengthGuide = [
  { type: "Billboard Slogan", words: "3-5", example: "Just Do It (Nike)", note: "Maximum recall, minimum words" },
  { type: "Classic Slogan", words: "5-8", example: "Melts in Your Mouth, Not in Your Hands (M&Ms)", note: "Most common length" },
  { type: "Tagline", words: "2-7", example: "Think Different (Apple)", note: "Brand essence, evergreen" },
  { type: "Motto", words: "3-7", example: "Semper Fidelis (US Marines)", note: "Values-driven, often formal" },
  { type: "Catchphrase", words: "2-6", example: "I'll Be Back (Terminator)", note: "Personality-led, repeatable" },
  { type: "Mission Statement", words: "8-15", example: "To organize the world's information (Google)", note: "Longer, purpose-focused" },
];

export default function SloganGeneratorPage() {
  return (
    <main className="relative w-full">
      <SloganGeneratorSchema />

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
                Free AI Slogan Generator for Any Business
              </h1>
              <p className="text-[18px] sm:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-4 text-balance">
                Generate 8 catchy, memorable slogans in seconds. Works for slogans, taglines, mottos, and catchphrases across any industry.
              </p>
              <p className="text-[15px] font-medium text-muted-foreground/80 mb-12">
                No signup. No credit card. Just your next tagline, ready to copy.
              </p>

              <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
                <a href="#generator">
                  Generate Your Slogan
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* GENERATOR */}
      <section id="generator" className="relative z-10 bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-[24px] border border-border bg-card p-6 sm:p-10 shadow-sm">
              <SloganGenerator />
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
              What Makes This AI Slogan Generator Different
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Most slogan generators give you one generic line. Ours gives you 8 distinct options with style tags, mode toggles, and industry-aware framing.
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
                  <h3 className="text-[20px] font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-small text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT IS AN AI SLOGAN GENERATOR */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <h2 className="text-h2 text-foreground">
              What Is an AI Slogan Generator?
            </h2>
          </div>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-5 animate-reveal" style={{ animationDelay: "100ms" }}>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              An AI slogan generator is a tool that uses artificial intelligence to write short, memorable phrases for your brand, product, or campaign. Instead of brainstorming 50 options in a notebook, you give the AI a few inputs (your brand name, what you do, your tone) and it returns polished slogans in seconds. The best AI generators go beyond random phrase assembly and actually understand the structural techniques that make slogans stick: rhythm, rhyme, alliteration, contrast, and emotional resonance.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              This tool is trained on the patterns behind famous slogans (Nike&apos;s Just Do It, Apple&apos;s Think Different, McDonald&apos;s I&apos;m Lovin&apos; It) and applies those patterns to your specific brand. It knows a restaurant slogan should feel different from a SaaS tagline, and that a motto needs different weight than a catchphrase. Every output is labeled with a style tag so you can see at a glance whether a slogan is punchy, rhyming, alliterative, metaphoric, or benefit-led.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              Our free AI slogan generator takes this further with <strong>four modes in one tool</strong>. Toggle between slogan (campaign-driven), tagline (persistent brand identity), motto (values-driven for people and teams), and catchphrase (personality-led for characters and creators). Each mode swaps the underlying prompt, examples, and length guidance so the output matches what you actually need. No other free tool does this.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              3 SIMPLE STEPS
            </div>
            <h2 className="text-h2 text-foreground">
              How to Use the Slogan Generator
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                step: "1",
                title: "Enter your brand",
                description:
                  "Type your business name, pick your industry, and briefly describe what you do. The more specific, the better the output.",
              },
              {
                step: "2",
                title: "Set tone and style",
                description:
                  "Slide the tone from Serious to Witty, pick your target audience, and optionally choose up to 3 style preferences.",
              },
              {
                step: "3",
                title: "Copy your favorite",
                description:
                  "Review 8 unique slogans with style tags and word counts. Copy any you like with one click, or regenerate for new options.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl mb-5 border border-primary/20">
                  {item.step}
                </div>
                <h3 className="text-[20px] font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-small text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
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

      {/* TIPS FOR WRITING A MEMORABLE SLOGAN */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              PRO TIPS
            </div>
            <h2 className="text-h2 text-foreground">
              Tips for Writing a Memorable Slogan
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Get more out of the generator by pairing it with proven slogan-writing principles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Lightbulb,
                title: "Lead With One Benefit",
                description:
                  "The strongest slogans communicate one clear benefit, not three. FedEx says When It Absolutely, Positively Has to Be There Overnight. Pick your single sharpest value prop before generating.",
              },
              {
                icon: Target,
                title: "Read It Aloud Twice",
                description:
                  "If you stumble reading a slogan out loud, so will your customers. Great slogans have natural rhythm and rolling consonants. Test every option you shortlist by saying it three times fast.",
              },
              {
                icon: Sparkles,
                title: "Use Sound Devices",
                description:
                  "Alliteration (Made to Move), rhyme (Beanz Meanz Heinz), and assonance (Maybe She's Born With It) all boost recall. Pick these as style preferences in the advanced options.",
              },
              {
                icon: CheckCircle,
                title: "Be Specific to Your Brand",
                description:
                  "Generic slogans feel AI-written. A great slogan could only belong to your brand. Fill in the description field with your actual positioning, not just the industry.",
              },
              {
                icon: Users,
                title: "Match Audience Vocabulary",
                description:
                  "A slogan for Gen Z uses different words than one for enterprise buyers. Set the Audience field so the AI calibrates vocabulary, formality, and references to your actual customer.",
              },
              {
                icon: Zap,
                title: "Regenerate for Variations",
                description:
                  "The first batch gives you 8 options, but the second and third batches explore different angles. Run 2-3 generations and shortlist your favorites before deciding.",
              },
            ].map((tip) => {
              const Icon = tip.icon;
              return (
                <div
                  key={tip.title}
                  className="flex gap-4 rounded-[20px] border border-border bg-card p-6 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-foreground mb-2">
                      {tip.title}
                    </h3>
                    <p className="text-small text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHO USES A SLOGAN GENERATOR */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              USE CASES
            </div>
            <h2 className="text-h2 text-foreground">
              Who Uses an AI Slogan Generator?
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Founders, marketers, students, and agencies all use it to skip the blank-page phase.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Briefcase,
                title: "Startup Founders",
                description:
                  "Launch a new product or company with a tagline ready to ship. Use the tool during naming sessions to test how different angles feel on the page and on a pitch deck.",
              },
              {
                icon: Megaphone,
                title: "Marketers & Agencies",
                description:
                  "Generate 50+ slogan candidates across multiple campaigns in an afternoon. Use the style tags to cluster options before presenting shortlists to clients.",
              },
              {
                icon: Palette,
                title: "Brand Strategists",
                description:
                  "Explore tagline directions for brand refreshes. Toggle between slogan and tagline modes to pressure-test persistent vs campaign-specific options.",
              },
              {
                icon: GraduationCap,
                title: "Students & Educators",
                description:
                  "Marketing students use it for project work. Teachers use it as a starting point for creative briefs and brand-building assignments.",
              },
              {
                icon: Heart,
                title: "Non-Profits",
                description:
                  "Craft mission-driven taglines and mottos that capture purpose in fewer words. Set the tone to Serious or Bold to match your cause.",
              },
              {
                icon: Users,
                title: "Small Business Owners",
                description:
                  "Freshen up your signage, website header, or business card in minutes. No agency fees, no long briefing process - just your next tagline, ready to use.",
              },
            ].map((persona) => {
              const Icon = persona.icon;
              return (
                <div
                  key={persona.title}
                  className="rounded-[24px] border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground mb-2">
                    {persona.title}
                  </h3>
                  <p className="text-small text-muted-foreground leading-relaxed">
                    {persona.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LENGTH GUIDE TABLE */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              REFERENCE
            </div>
            <h2 className="text-h2 text-foreground">
              Slogan Length Guide
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Different formats need different lengths. Here is what to aim for.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-4 font-semibold text-foreground">Type</th>
                  <th className="text-center px-5 py-4 font-semibold text-foreground">Words</th>
                  <th className="text-right px-5 py-4 font-semibold text-foreground hidden sm:table-cell">Example</th>
                </tr>
              </thead>
              <tbody>
                {lengthGuide.map((row, i) => (
                  <tr key={row.type} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.type}</td>
                    <td className="px-5 py-3.5 text-center tabular-nums text-muted-foreground">{row.words}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground text-xs hidden sm:table-cell">{row.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <h2 className="text-h2 text-foreground">
              Common Slogan Mistakes to Avoid
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Even with AI, these pitfalls will make your slogan fall flat.
            </p>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              {
                mistake: "Using generic filler words",
                fix: "Phrases like the best, premium quality, or leading provider sound interchangeable with every competitor. Replace with specific language tied to your actual value.",
              },
              {
                mistake: "Trying to say everything",
                fix: "You have 3 to 8 words, not a paragraph. Pick one benefit, one feeling, or one angle. Save the rest for your about page or homepage hero.",
              },
              {
                mistake: "Copying a famous slogan's structure",
                fix: "Slogans like Just Do X or Think X are overused to the point of parody. Use the famous slogans as inspiration for rhythm and technique, not as templates to fill in.",
              },
              {
                mistake: "Skipping the read-aloud test",
                fix: "A slogan that stumbles off the tongue dies in ads. Every option you shortlist should feel natural when spoken three times in a row.",
              },
              {
                mistake: "Ignoring trademark conflicts",
                fix: "Before using a slogan publicly, search the USPTO database (or your country's equivalent) and run a Google search to check for conflicts in your category.",
              },
              {
                mistake: "Changing the slogan too often",
                fix: "Taglines need repetition to become memorable. Nike has used Just Do It since 1988. Commit to a slogan for at least 2-3 years before revisiting it.",
              },
            ].map((item) => (
              <div
                key={item.mistake}
                className="flex gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground mb-1">
                    {item.mistake}
                  </h3>
                  <p className="text-small text-muted-foreground leading-relaxed">
                    {item.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              FAQ
            </div>
            <h2 className="text-h2 text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              {
                q: "What is a slogan?",
                a: "A slogan is a short, memorable phrase used in advertising and marketing to promote a brand, product, or idea. Good slogans are 3 to 8 words, easy to remember, and communicate a clear benefit or feeling. Famous examples include Nike's Just Do It, Apple's Think Different, and McDonald's I'm Lovin' It.",
              },
              {
                q: "How does the AI slogan generator work?",
                a: "Enter your brand name, describe what you do, pick your industry and tone, then click Generate. The AI creates 8 unique slogans instantly, each labeled with a style tag (punchy, rhyming, alliterative, metaphoric, emotional, or witty) and a word count. You can copy any slogan with one click or regenerate to see new options.",
              },
              {
                q: "Is the AI slogan generator really free?",
                a: "Yes, completely free. No signup, no credit card, no hidden paywall. You can generate up to 8 batches per day (64 slogans total) from a single IP address.",
              },
              {
                q: "How do you write a good slogan?",
                a: "A good slogan is short (3 to 8 words), specific to your brand, easy to remember, and communicates one clear benefit or feeling. Use techniques like rhyme, alliteration, contrast, or metaphor. Avoid cliches like the best or leading provider. Always test a slogan by reading it aloud: if it does not roll off the tongue, keep iterating.",
              },
              {
                q: "What makes a slogan memorable?",
                a: "Memorable slogans share a few traits: rhythm (a natural beat when spoken), simplicity (short words, clear meaning), specificity (tied to a real benefit, not generic), and emotional resonance. Techniques like alliteration (Coca-Cola: Open Happiness), rhyme (Beanz Meanz Heinz), and contrast (Apple: Think Different) all make slogans stick.",
              },
              {
                q: "Slogan vs tagline: what is the difference?",
                a: "A tagline is a persistent brand identifier that stays with the company for years (Nike: Just Do It). A slogan is typically tied to a specific campaign or product and may change over time. Taglines capture brand essence, slogans drive specific messages. This generator supports both modes.",
              },
              {
                q: "Can I use the generated slogan commercially?",
                a: "Yes, you own the slogans you generate and can use them commercially. Before deploying a slogan publicly, we recommend a trademark search to check that your preferred phrase is not already registered in your industry and territory.",
              },
              {
                q: "Can I customize the tone of the slogans?",
                a: "Yes. Use the tone slider to choose from five levels: Serious, Professional, Balanced, Playful, or Bold & Witty. You can also target specific audiences and pick up to three style preferences for even finer control.",
              },
              {
                q: "Does the slogan generator work for any industry?",
                a: "Yes. The generator supports 35+ industries out of the box and will accept any custom industry you type into the field. The AI tailors vocabulary, rhythm, and benefit framing to your specific category.",
              },
              {
                q: "Should I trademark my slogan?",
                a: "If your slogan becomes central to your brand and you plan to use it consistently in advertising, trademarking it is a smart move. A trademark prevents competitors from using a confusingly similar phrase in your category. Taglines are more commonly trademarked than campaign-specific slogans.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[20px] border border-border bg-card shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-[16px] font-semibold text-foreground hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-200 text-xl leading-none">+</span>
                </summary>
                <div className="px-6 pb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-h2 text-foreground mb-6">
            Ready to Write Your Slogan?
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10">
            Stop staring at a blank page. Get 8 catchy options in under 10 seconds.
          </p>
          <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-10">
            <a href="#generator">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Your Slogan - Free
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
