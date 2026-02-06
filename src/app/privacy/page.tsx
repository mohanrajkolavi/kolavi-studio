import { getPageMetadata } from "@/lib/seo/metadata";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = getPageMetadata({
  title: "Privacy Policy",
  description: "Learn how Kolavi Studio collects, uses, and protects your personal information when you use our website and services.",
  path: "/privacy",
  keywords: "privacy policy, data protection, personal information, Kolavi Studio",
});

const LAST_UPDATED = "February 6, 2025";

export default function PrivacyPolicyPage() {
  return (
    <main>
      <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
        <h2>1. Introduction</h2>
        <p>
          Kolavi Studio (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
        </p>

        <h2>2. Information We Collect</h2>
        <p>
          We may collect information that you provide directly to us, including:
        </p>
        <ul>
          <li><strong>Contact information</strong> — Name, email address, phone number, and company name when you fill out our contact form or request a consultation</li>
          <li><strong>Communication data</strong> — Messages and correspondence you send to us</li>
          <li><strong>Technical data</strong> — IP address, browser type, device information, and pages visited (collected automatically via cookies and similar technologies)</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Respond to your inquiries and provide requested services</li>
          <li>Send marketing communications (with your consent) about our services, blog updates, and industry insights</li>
          <li>Improve our website, content, and user experience</li>
          <li>Analyze site traffic and usage patterns (e.g., via Google Analytics)</li>
          <li>Comply with legal obligations and protect our rights</li>
        </ul>

        <h2>4. Cookies and Tracking</h2>
        <p>
          We use cookies and similar technologies to enhance your browsing experience. For more details, please see our <a href="/cookies" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">Cookie Policy</a>.
        </p>

        <h2>5. Data Sharing and Disclosure</h2>
        <p>
          We do not sell your personal information. We may share your data with:
        </p>
        <ul>
          <li><strong>Service providers</strong> — Third parties who assist us (e.g., hosting, analytics, email delivery) under strict confidentiality agreements</li>
          <li><strong>Legal authorities</strong> — When required by law or to protect our rights</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          We retain your personal information only as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required by law.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          Depending on your location, you may have the right to access, correct, delete, or restrict the processing of your personal data. You may also withdraw consent for marketing communications at any time. To exercise these rights, contact us at the email below.
        </p>

        <h2>8. Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
        </p>

        <h2>9. Links to Other Sites</h2>
        <p>
          Our website may contain links to third-party sites. We are not responsible for the privacy practices of those sites. We encourage you to read their privacy policies.
        </p>

        <h2>10. Children</h2>
        <p>
          Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. The &quot;Last updated&quot; date at the top indicates when changes were last made. Continued use of our site after changes constitutes acceptance of the revised policy.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          For questions about this privacy policy or your personal data, please contact us via our <a href="/contact" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">contact page</a>.
        </p>
      </LegalPageLayout>
    </main>
  );
}
