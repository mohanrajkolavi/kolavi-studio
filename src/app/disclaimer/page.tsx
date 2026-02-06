import { getPageMetadata } from "@/lib/seo/metadata";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = getPageMetadata({
  title: "Disclaimer",
  description: "Important disclaimers regarding Kolavi Studio's website content, services, and marketing results.",
  path: "/disclaimer",
  keywords: "disclaimer, marketing results, Kolavi Studio",
});

const LAST_UPDATED = "February 6, 2025";

export default function DisclaimerPage() {
  return (
    <main>
      <LegalPageLayout title="Disclaimer" lastUpdated={LAST_UPDATED}>
        <h2>1. General Disclaimer</h2>
        <p>
          The information on the Kolavi Studio website is provided for general informational purposes only. While we strive to keep content accurate and up to date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the website or the information contained on it.
        </p>

        <h2>2. No Professional Advice</h2>
        <p>
          Content on this site—including blog posts, case studies, and service descriptions—does not constitute professional advice (legal, medical, financial, or otherwise). For advice specific to your situation, consult a qualified professional in the relevant field.
        </p>

        <h2>3. Marketing Results</h2>
        <p>
          We cannot guarantee specific marketing results. Outcomes such as increased traffic, leads, or revenue depend on many factors, including industry, market conditions, competition, and your business operations. Past performance and testimonials are not indicative of future results. Any projections or examples we provide are estimates only.
        </p>

        <h2>4. Third-Party Content and Links</h2>
        <p>
          Our website may contain links to third-party sites or references to external products and services. We do not endorse or assume responsibility for third-party content, privacy practices, or accuracy. Use of third-party links is at your own risk.
        </p>

        <h2>5. Client Testimonials</h2>
        <p>
          Testimonials and case studies reflect the experiences of individual clients. Results vary and are not typical. We do not claim that all clients will achieve similar outcomes.
        </p>

        <h2>6. No Warranties</h2>
        <p>
          Kolavi Studio disclaims all warranties, express or implied, including merchantability and fitness for a particular purpose. Use of our website and services is at your sole risk.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Kolavi Studio shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of our website or services. This includes damages resulting from reliance on information provided on the site.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update this Disclaimer at any time. Continued use of our website after changes constitutes acceptance of the revised Disclaimer.
        </p>

        <h2>9. Contact</h2>
        <p>
          For questions about this Disclaimer, please contact us via our <a href="/contact" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">contact page</a>.
        </p>
      </LegalPageLayout>
    </main>
  );
}
