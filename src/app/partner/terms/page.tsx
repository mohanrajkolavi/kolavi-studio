import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { ArrowLeft } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Partner Program Terms",
  description:
    "Terms and conditions for the Kolavi Studio Partner Program. Commission structure, eligibility, and program rules.",
  path: "/partner/terms",
  keywords: "partner program terms, affiliate terms, commission terms",
});

export default function PartnerTermsPage() {
  return (
    <main>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Partner Program
            </Link>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Partner Program Terms
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: February 2025
            </p>

            <div className="mt-12 space-y-10 prose prose-neutral dark:prose-invert max-w-none">
              <section>
                <h2 className="text-xl font-semibold">1. Eligibility</h2>
                <p>
                  The Kolavi Studio Partner Program is open to individuals and businesses who can refer qualified leads. We reserve the right to approve or reject applications at our discretion. Partners must comply with these terms and all applicable laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">2. Commission Structure</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>One-time fees:</strong> 15% of the amount paid by the referred client for one-time projects or services.</li>
                  <li><strong>Monthly recurring:</strong> 10% of each monthly payment from referred clients on ongoing retainers or subscriptions.</li>
                  <li>Commission is paid only when the referred lead becomes a paying client (takes the service and pays).</li>
                  <li>Commission does not apply to leads that do not convert to paying clients.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">3. Attribution</h2>
                <p>
                  Attribution is based on a 30-day first-touch cookie. When a visitor clicks your partner link (kolavistudio.com/partner?ref=YOURCODE), we set a cookie. If they submit a contact form within 30 days, the lead is attributed to you. The first partner link clicked receives credit.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">4. FTC Disclosure</h2>
                <p>
                  Partners must disclose their material connection to Kolavi Studio when promoting. If you earn commission from referrals, you must clearly disclose this to your audience (e.g., &quot;I may earn a commission if you sign up through my link&quot;). Follow FTC endorsement guidelines.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">5. Prohibited Conduct</h2>
                <p>Partners may not:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use misleading claims, fake reviews, or deceptive practices</li>
                  <li>Spam or use unsolicited marketing</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Impersonate Kolavi Studio or make unauthorized commitments</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">6. Payouts</h2>
                <p>
                  Payouts are processed manually on a schedule determined by Kolavi Studio (e.g., monthly). Minimum payout thresholds may apply. Partners are responsible for any tax obligations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">7. Termination</h2>
                <p>
                  We may suspend or terminate a partner&apos;s participation at any time for violation of these terms or for any other reason. Upon termination, unpaid commission may be forfeited at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">8. Changes</h2>
                <p>
                  We may update these terms at any time. Continued participation in the program constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">9. Contact</h2>
                <p>
                  Questions about the Partner Program? <Link href="/contact" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">Contact us</Link>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
