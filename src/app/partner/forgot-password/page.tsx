"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PartnerAuthShell } from "@/components/partner/PartnerAuthShell";
import { Mail } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export default function PartnerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      if (!HAS_SUPABASE) {
        setError(
          "Password reset is not available. Please contact your administrator."
        );
        return;
      }

      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${SITE_URL}/partner/set-password` }
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <PartnerAuthShell
        title="Check your email"
        subtitle="If an account exists for that email, we've sent a password reset link."
      >
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/5 px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-5">
            <div
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
              role="status"
            >
              Check your inbox for a link to reset your password. If you don&apos;t see it, check your spam folder.
            </div>
            <Button asChild className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-medium text-white hover:bg-orange-700">
              <Link href="/partner/login">Back to sign in</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/partner/login" className="text-foreground underline underline-offset-4 hover:no-underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </PartnerAuthShell>
    );
  }

  return (
    <PartnerAuthShell
      title="Forgot password"
      subtitle="Enter your partner account email and we'll send you a link to reset your password."
    >
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/5 px-6 py-8 sm:px-8 sm:py-10">
        <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              placeholder="partner@example.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-2xl bg-orange-600 text-sm font-medium text-white hover:bg-orange-700"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send reset link"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/partner/login" className="text-foreground underline underline-offset-4 hover:no-underline">
            Sign in
          </Link>
        </p>
      </form>
      </div>
    </PartnerAuthShell>
  );
}
