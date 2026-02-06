import { getPageMetadata } from "@/lib/seo/metadata";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = getPageMetadata({
  title: "Cookie Policy",
  description: "Learn how Kolavi Studio uses cookies and similar technologies on our website.",
  path: "/cookies",
  keywords: "cookie policy, cookies, website tracking, Kolavi Studio",
});

const LAST_UPDATED = "February 6, 2025";

export default function CookiePolicyPage() {
  return (
    <main>
      <LegalPageLayout title="Cookie Policy" lastUpdated={LAST_UPDATED}>
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help sites remember your preferences, analyze traffic, and improve user experience.
        </p>

        <h2>2. Cookies We Use</h2>
        <p>
          We use the following types of cookies on kolavistudio.com:
        </p>

        <h3>Essential Cookies</h3>
        <p>
          These cookies are necessary for the website to function. They enable core features like navigation, form submissions, and theme preferences (e.g., dark mode). You cannot opt out of these without affecting site functionality.
        </p>

        <h3>Analytics Cookies</h3>
        <p>
          We may use Google Analytics or similar tools to understand how visitors use our site—pages visited, time on site, and referral sources. This helps us improve our content and user experience. Analytics data is typically aggregated and anonymized.
        </p>

        <h3>Marketing Cookies</h3>
        <p>
          If we run advertising campaigns, we may use cookies to measure campaign performance and deliver relevant ads. These are only used with your consent where required by law.
        </p>

        <h2>3. How to Manage Cookies</h2>
        <p>
          Most browsers allow you to control cookies through their settings. You can:
        </p>
        <ul>
          <li>Block all cookies (may limit site functionality)</li>
          <li>Block third-party cookies only</li>
          <li>Delete cookies after each session</li>
        </ul>
        <p>
          For instructions, check your browser&apos;s help or privacy settings. Opting out of analytics may be possible via browser extensions (e.g., Google Analytics Opt-out) or ad industry tools (e.g., NAI, DAA).
        </p>

        <h2>4. Do Not Track</h2>
        <p>
          Some browsers support a &quot;Do Not Track&quot; (DNT) signal. We respect DNT where technically feasible and may adjust analytics or tracking accordingly.
        </p>

        <h2>5. Updates</h2>
        <p>
          We may update this Cookie Policy to reflect changes in our practices or applicable law. The &quot;Last updated&quot; date indicates when changes were last made.
        </p>

        <h2>6. More Information</h2>
        <p>
          For details on how we handle personal data collected via cookies, see our <a href="/privacy" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">Privacy Policy</a>. If you have questions, please contact us via our <a href="/contact" className="text-orange-600 underline hover:text-orange-700 dark:text-orange-400">contact page</a>.
        </p>
      </LegalPageLayout>
    </main>
  );
}
