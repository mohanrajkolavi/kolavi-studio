import { CTA } from "@/components/sections/CTA";
import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "About Us - Digital Marketing Experts",
  description: "Learn about Kolavi Studio, our mission to help businesses grow through strategic digital marketing, and the team behind our success.",
  path: "/about",
  keywords: "digital marketing agency, about Kolavi Studio, marketing team, business growth experts",
});

export default function AboutPage() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About Kolavi Studio
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              We're a digital marketing agency on a mission to help businesses thrive in the digital age. With a focus on medical spas, dental practices, and law firms, we combine industry expertise with cutting-edge marketing strategies to deliver exceptional results.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Story
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-8 text-muted-foreground">
              <p>
                Kolavi Studio was founded with a simple belief: every business deserves a digital presence that truly represents their brand and drives real results. Too many agencies promise the world but deliver generic, cookie-cutter solutions that don't move the needle.
              </p>
              <p>
                We took a different approach. By specializing in specific industries—starting with medical spas—we developed deep expertise in what actually works. We understand the unique challenges, regulations, and opportunities in each market we serve.
              </p>
              <p>
                Today, we're proud to partner with businesses across the country, helping them attract more clients, increase revenue, and build brands that stand out in competitive markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Approach
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-8 text-muted-foreground">
              <p>
                We believe in transparency, data-driven decisions, and building long-term partnerships. Our approach combines strategic thinking with hands-on execution, ensuring every campaign is optimized for maximum ROI.
              </p>
              <p>
                Whether it's SEO, web design, content marketing, or paid advertising, we focus on what matters most: driving real business results. No vanity metrics, no fluff—just strategies that work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Work With Us
            </h2>
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-xl font-semibold">Industry Expertise</h3>
                <p className="mt-2 text-muted-foreground">
                  We specialize in serving specific industries, giving us unique insights into what works and what doesn't in your market.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Proven Results</h3>
                <p className="mt-2 text-muted-foreground">
                  Our track record speaks for itself. We've helped dozens of businesses achieve significant growth through strategic digital marketing.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Transparent Communication</h3>
                <p className="mt-2 text-muted-foreground">
                  You'll always know what we're working on, why we're doing it, and what results to expect. No surprises, just clear communication.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Long-Term Partnership</h3>
                <p className="mt-2 text-muted-foreground">
                  We're not interested in quick wins. We build lasting relationships and continuously optimize to ensure your sustained success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTA
        title="Let's Work Together"
        description="Ready to partner with a team that's committed to your success? Get in touch today."
      />
    </>
  );
}
