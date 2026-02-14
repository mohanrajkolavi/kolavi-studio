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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!acceptedTerms) {
      setError("Please accept the Program Terms and Terms of Service to continue.");
      return;
    }
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/partner/forgot-password"
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 py-2">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-orange-600 focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
              <span className="text-sm text-foreground">
                I accept the{" "}
                <Link href="/partner/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 dark:text-orange-400">
                  Partner Program Terms
                </Link>{" "}
                and{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 dark:text-orange-400">
                  Kolavi Studio Terms of Service
                </Link>
              </span>
            </label>

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
              disabled={loading || !acceptedTerms}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Not a partner yet?{" "}
              <Link
                href="/partner/apply"
                className="text-foreground underline underline-offset-4 hover:no-underline"
              >
                Apply here
              </Link>
            </p>
          </form>
      </div>
    </PartnerAuthShell>
  );
}
