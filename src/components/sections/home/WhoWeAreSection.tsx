"use client";

import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const PROOF_CARDS = [
  { number: "31K", label: "Monthly organic visitors", detail: "Built from zero. No paid traffic. A system that compounded month over month." },
  { number: "60K+", label: "Organic followers", detail: "Content strategy only. Zero paid promotion." },
  { number: "5", label: "Content sponsors", detail: "Groww, Paytm, Amazon, PayPal, Citibank." },
];

export function WhoWeAreSection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-20 sm:py-24 md:py-28 flex flex-col justify-center"
      id="about"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div
          className={`mx-auto text-center mb-14 sm:mb-16 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-5">
            About Kolavi
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8 text-balance leading-tight tracking-tight">
            Built different from day one.
          </h2>

          <div className="space-y-6 text-base sm:text-lg text-muted-foreground text-left leading-[1.65]">
            <p>
              Most agencies were built to manage clients, not grow them. They sell strategy decks. They deliver reports. We asked what an agency would look like if it were built today, with results as the only metric that matters.
            </p>
            <p>
              Before Kolavi, the founder built{" "}
              <a
                href="https://businessmavericks.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium underline underline-offset-2 hover:opacity-90"
              >
                Business Mavericks
              </a>{" "}
              to 31,000 monthly visitors and 60,000 followers. Not through ad spend. Through the same systems we now build for clients. SEO, automation, content, and lead generation running together as one engine.
            </p>
            <p>
              That same system is what we build for every client. Every service. Every workflow. Built for your market and your revenue goals.
            </p>
          </div>

          <blockquote className="mt-12 p-7 sm:p-8 rounded-2xl bg-muted/30 border border-border/50 text-left">
            <p className="text-base sm:text-lg text-foreground italic mb-5 leading-relaxed">
              &ldquo;We built Kolavi because we were tired of watching good businesses get mediocre results from agencies that were coasting. Every client gets the same system we used to build our own.&rdquo;
            </p>
            <footer className="text-small text-muted-foreground">
              Mohanraj, Founder, Kolavi Studio
            </footer>
          </blockquote>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12">
          {PROOF_CARDS.map((card, index) => (
            <div
              key={card.label}
              className={`p-6 sm:p-7 rounded-[24px] border border-border bg-card/50 text-center ${
                isVisible ? "animate-reveal" : "opacity-0"
              }`}
              style={{
                animationDelay: isVisible ? `${200 + index * 100}ms` : "0ms",
              }}
            >
              <div className="text-stat text-primary font-bold">{card.number}</div>
              <p className="text-label text-foreground mt-2">{card.label}</p>
              <p className="text-small text-muted-foreground mt-2">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
