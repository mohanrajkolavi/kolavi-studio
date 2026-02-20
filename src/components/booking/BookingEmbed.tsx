"use client";

/**
 * Booking embed. Set one of these env vars to enable:
 * - NEXT_PUBLIC_CALENDLY_EMBED_URL
 * - NEXT_PUBLIC_CALCOM_EMBED_URL
 * - NEXT_PUBLIC_ACAL_EMBED_URL (generic)
 */
export function BookingEmbed() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_EMBED_URL;
  const calcomUrl = process.env.NEXT_PUBLIC_CALCOM_EMBED_URL;
  const acalUrl = process.env.NEXT_PUBLIC_ACAL_EMBED_URL;
  const embedUrl = calendlyUrl || calcomUrl || acalUrl;

  if (embedUrl) {
    return (
      <div className="min-h-[600px] w-full overflow-hidden rounded-2xl border border-border bg-muted/30">
        <iframe
          src={embedUrl}
          title="Schedule a call"
          className="h-[700px] w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-12 text-center">
      <p className="text-lg font-medium">Booking calendar coming soon</p>
      <p className="mt-2 text-muted-foreground">
        Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_CALENDLY_EMBED_URL</code>,{" "}
        <code className="rounded bg-muted px-1">NEXT_PUBLIC_CALCOM_EMBED_URL</code>, or{" "}
        <code className="rounded bg-muted px-1">NEXT_PUBLIC_ACAL_EMBED_URL</code> to embed your scheduler.
      </p>
      <a
        href="/contact"
        className="mt-6 inline-block rounded-2xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
      >
        Contact Us Instead
      </a>
    </div>
  );
}
