"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PartnerAuthShell } from "@/components/partner/PartnerAuthShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function SetPasswordErrorFallback() {
  return (
    <PartnerAuthShell
      title="Something went wrong"
      subtitle="We couldn't load the password setup page. This may be due to a temporary issue or an invalid invite link."
    >
      <div className="rounded-2xl border border-border bg-card px-8 py-10 shadow-md">
        <p className="text-sm text-muted-foreground">
          Please try again. If the problem persists, the invite link may have expired or already been used. Contact your administrator for a new invitation.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-orange-600 hover:bg-orange-700"
          >
            Try again
          </Button>
          <Button asChild variant="outline" className="rounded-lg">
            <Link href="/partner/login">Sign in</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-lg">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </PartnerAuthShell>
  );
}

export function SetPasswordErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallback={<SetPasswordErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
}
