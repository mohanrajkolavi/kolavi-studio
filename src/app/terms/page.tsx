import { getPageMetadata } from "@/lib/seo/metadata";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = getPageMetadata({
  title: "Terms of Service",
  description: "Read the terms and conditions governing your use of Kolavi Studio's website and digital marketing services.",
  path: "/terms",
  keywords: "terms of service, terms and conditions, Kolavi Studio",
});

const LAST_UPDATED = "February 6, 2025";

export default function TermsOfServicePage() {
  return (
    <main>
      <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing or using the Kolavi Studio website and services (&quot;Services&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use our Services.
        </p>

        <h2>2. Description of Services</h2>
        <p>
          Kolavi Studio provides digital marketing services, including but not limited to web design, SEO, content marketing, and paid advertising. Our Services are tailored for businesses in industries such as medical spas, dental practices, and law firms.
        </p>

        <h2>3. Use of the Website</h2>
        <p>
          You agree to use our website and Services only for lawful purposes. You must not:
        </p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on the intellectual property or privacy rights of others</li>
          <li>Transmit malicious code, spam, or harmful content</li>
          <li>Attempt to gain unauthorized access to our systems or any third-party systems</li>
          <li>Use our Services in any way that could damage, disable, or impair our website</li>
        </ul>

        <h2>4. Client Services</h2>
        <p>
          When you engage us for marketing services, a separate agreement or statement of work will define the scope, deliverables, pricing, and payment terms. Those terms supplement these Terms of Service and govern the specific engagement.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All content on this website—including text, graphics, logos, and design—is owned by Kolavi Studio or our licensors. You may not copy, reproduce, or distribute our content without written permission. For client projects, intellectual property rights are governed by the applicable service agreement.
        </p>

        <h2>6. User Content</h2>
        <p>
          When you submit content to us (e.g., via contact forms or project briefs), you grant us a license to use that content to provide our Services. You represent that you have the right to share such content and that it does not violate any third-party rights.
        </p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>
          Our website and Services are provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee specific business results (e.g., traffic, leads, or revenue). Marketing outcomes depend on many factors beyond our control. Please see our <a href="/disclaimer" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">Disclaimer</a> for more information.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Kolavi Studio shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our Services. Our total liability for any claim shall not exceed the amount paid by you for the specific services giving rise to the claim.
        </p>

        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Kolavi Studio, its officers, and affiliates from any claims, damages, or expenses arising from your use of our Services or violation of these Terms.
        </p>

        <h2>10. Termination</h2>
        <p>
          We may suspend or terminate your access to our website or Services at any time, with or without cause. Provisions that by their nature should survive termination (e.g., intellectual property, limitation of liability) will remain in effect.
        </p>

        <h2>11. Modifications</h2>
        <p>
          We may update these Terms of Service at any time. Continued use of our Services after changes constitutes acceptance of the revised Terms. The &quot;Last updated&quot; date reflects the most recent changes.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the United States. Any disputes shall be resolved in the courts of competent jurisdiction.
        </p>

        <h2>13. Contact</h2>
        <p>
          For questions about these Terms of Service, please contact us via our <a href="/contact" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">contact page</a>.
        </p>
      </LegalPageLayout>
    </main>
  );
}
