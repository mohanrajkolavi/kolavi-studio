import Script from "next/script";
import { headers } from "next/headers";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { FAQ } from "@/components/sections/FAQ";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = getPageMetadata({
  title: "Contact Us - Get Your Free Consultation",
  description: "Ready to grow your business? Contact Kolavi Studio for a free consultation. We'll discuss your goals and create a custom digital marketing strategy.",
  path: "/contact",
  keywords: "contact Kolavi Studio, free marketing consultation, digital marketing quote",
});

const CONTACT_FAQ_ITEMS = [
  {
    question: "How quickly can I expect to hear back after submitting the form?",
    answer: "We respond to all inquiries within 24 hours during business days (Monday–Friday).",
  },
  {
    question: "Is the initial consultation really free?",
    answer: "Yes. We offer a free consultation to discuss your goals and explore how we can help. There’s no obligation.",
  },
  {
    question: "Which industries do you work with?",
    answer: "We specialize in medical spas, dental practices, and law firms, but we also work with other service-based businesses.",
  },
];

const TYPEFORM_EMBED_URL = process.env.NEXT_PUBLIC_TYPEFORM_EMBED_URL;
const TALLY_EMBED_URL = process.env.NEXT_PUBLIC_TALLY_FORM_EMBED_URL;
const GOOGLE_FORM_EMBED_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL;
const USE_THIRD_PARTY_FORM = TYPEFORM_EMBED_URL || TALLY_EMBED_URL || GOOGLE_FORM_EMBED_URL;

export default async function ContactPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const faqSchema = getFAQSchema(CONTACT_FAQ_ITEMS);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        nonce={nonce}
      />
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Get in Touch
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Ready to transform your digital presence? Fill out the form below and we'll get back to you within 24 hours.
              </p>
            </div>

            {USE_THIRD_PARTY_FORM ? (
              <div className="mt-12 min-h-[500px] w-full overflow-hidden rounded-lg border bg-muted/30">
                {TYPEFORM_EMBED_URL ? (
                  <>
                    <div
                      data-tf-widget={TYPEFORM_EMBED_URL}
                      data-tf-live={TYPEFORM_EMBED_URL}
                      data-tf-inline-on-mobile
                      className="min-h-[600px] w-full"
                    />
                    <Script
                      src="https://embed.typeform.com/next/embed.js"
                      strategy="afterInteractive"
                      nonce={nonce}
                    />
                  </>
                ) : TALLY_EMBED_URL ? (
                  <>
                    <Script
                      src="https://tally.so/widgets/embed.js"
                      strategy="lazyOnload"
                      nonce={nonce}
                    />
                    <iframe
                      data-tally-embed
                      src={TALLY_EMBED_URL}
                      title="Contact form"
                      className="h-[600px] w-full border-0"
                    />
                  </>
                ) : GOOGLE_FORM_EMBED_URL ? (
                  <iframe
                    src={GOOGLE_FORM_EMBED_URL}
                    title="Contact form"
                    className="h-[600px] w-full border-0"
                    frameBorder={0}
                  />
                ) : null}
              </div>
            ) : (
              <ContactForm />
            )}

            <div className="mt-12 border-t pt-12">
              <h2 className="text-2xl font-bold">Other Ways to Reach Us</h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>
                  <strong>Email:</strong> hello@kolavistudio.com
                </p>
                <p>
                  <strong>Phone:</strong> (555) 123-4567
                </p>
                <p>
                  <strong>Hours:</strong> Monday - Friday, 9am - 6pm EST
                </p>
              </div>
            </div>

            <FAQ
              title="Frequently Asked Questions"
              items={CONTACT_FAQ_ITEMS}
              className="mt-16"
            />
          </div>
        </div>
      </section>
    </>
  );
}
