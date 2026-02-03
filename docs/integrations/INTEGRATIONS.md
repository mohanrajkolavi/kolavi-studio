# Integrations

Environment variables and third-party integrations used by the site.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL (canonical, Open Graph, sitemap, RSS). Local: `http://localhost:3000`; production: use your own domain. |
| `NEXT_PUBLIC_WP_GRAPHQL_URL` | WordPress GraphQL endpoint for headless blog. When set, blog data is loaded from WordPress; when unset, sample data is used. Example: `https://your-cms.example.com/graphql`. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID (e.g. `G-XXXXXXXXXX`). When set, GA4 scripts are loaded on every page. Optional; leave unset to disable analytics. Use your own ID; never commit real values. |
| `NEXT_PUBLIC_TYPEFORM_EMBED_URL` | Typeform embed URL. When set, the contact page shows the Typeform instead of the built-in form. Submissions are stored in your Typeform workspace. |
| `NEXT_PUBLIC_TALLY_FORM_EMBED_URL` | Tally form embed URL. When set, the contact page shows the Tally form instead of the built-in form. Submissions are stored in your Tally dashboard. |
| `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL` | Google Form embed URL (iframe `src`). When set, the contact page shows the Google Form instead of the built-in form. Submissions go to Google Forms. |

## Contact form (Typeform, Tally, or Google Forms)

The contact page can use a third-party form so submissions are stored and managed for you.

- **Typeform**: Create a form at [typeform.com](https://typeform.com). In Share → Embed, copy the **form ID** from the embed code (the value of `data-tf-live="..."`, e.g. `01KGJEJHFEM5Q5S88DS411X006`). Set `NEXT_PUBLIC_TYPEFORM_EMBED_URL` to that ID in `.env.local`. Responses appear in your Typeform workspace and can be exported or connected to Zapier, webhooks, etc.
- **Tally**: Create a form at [tally.so](https://tally.so). In Share → Get the code, copy the **embed URL** (e.g. `https://tally.so/embed/xxxxx`). Set `NEXT_PUBLIC_TALLY_FORM_EMBED_URL` in `.env.local`. Submissions appear in your Tally dashboard and can be emailed or exported.
- **Google Forms**: Create a form in Google Forms. Use Send → embed HTML and copy the iframe `src` URL (e.g. `https://docs.google.com/forms/d/e/.../viewform?embedded=true`). Set `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL` in `.env.local`. Responses are stored in the form’s Responses tab.

Precedence when multiple are set: **Typeform** → Tally → Google Forms. If none is set, the built-in contact form is shown (it has no backend; add an API route or use one of these integrations to store submissions).

## Google Analytics 4

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local`. The layout loads the gtag script with `strategy="afterInteractive"`. No code changes needed beyond the env var.

## Google Tag Manager (GTM)

To add GTM instead of or in addition to GA4:

1. Add `NEXT_PUBLIC_GTM_ID` to `.env.example` and `.env.local` (e.g. `GTM-XXXXXXX`).
2. In `src/app/layout.tsx`, conditionally render the GTM script when `NEXT_PUBLIC_GTM_ID` is set:
   - Add a `<Script>` that loads `https://www.googletagmanager.com/gtag/js?id=${NEXT_PUBLIC_GTM_ID}` or the GTM snippet as per [GTM docs](https://developers.google.com/tag-platform/tag-manager/web).
   - Ensure the script runs after the page is interactive (e.g. `strategy="afterInteractive"`).

GTM can then manage GA4, other tags, and consent without changing the codebase for each tool.

## WordPress (headless)

Blog content is fetched via WPGraphQL. The app uses:

- **Rank Math SEO**: Post metadata (title, description, OG, Twitter) is parsed from `seo { fullHead }` and merged with Next.js metadata. Canonical and robots are set by Next.js.
- **WPGraphQL**: Queries live in `src/lib/graphql/queries.ts`. Auth or custom headers can be added in `src/lib/graphql/client.ts` if the WordPress GraphQL endpoint is later locked down.

## Caching

- **Data**: Blog and sitemap data use Next.js `unstable_cache` with a 60s revalidate so WordPress is not hit on every request.
- **Routes**: Blog pages use `revalidate = 60` (ISR). Sitemap and RSS responses send `Cache-Control: public, max-age=3600, s-maxage=3600`.

See [README](../../README.md) or [architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) for how to run bundle analysis and architecture overview.
