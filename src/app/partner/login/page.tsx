"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PartnerAuthShell } from "@/components/partner/PartnerAuthShell";
import { Mail, Lock } from "lucide-react";

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!HAS_SUPABASE) {
        setError(
          "Partner login requires Supabase. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured in your environment."
        );
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/partner/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PartnerAuthShell>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md ring-1 ring-black/[0.04] dark:ring-white/5">
        {/* Accent header */}
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5 sm:px-8 sm:py-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Sign in with email & password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your partner account credentials. If you&apos;ve been approved, check your email for an invitation link to set up your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8 sm:pb-8 sm:pt-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-11 pr-4 rounded-lg border-border bg-muted/20 focus:bg-background"
                placeholder="partner@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pl-11 pr-4 rounded-lg border-border bg-muted/20 focus:bg-background"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-lg bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Not a partner yet?{" "}
            <Link
              href="/partner/apply"
              className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 dark:text-orange-400"
            >
              Apply here
            </Link>
          </p>
        </form>
      </div>
    </PartnerAuthShell>
  );
}
