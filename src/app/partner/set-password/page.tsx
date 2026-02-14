"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PartnerAuthShell } from "@/components/partner/PartnerAuthShell";
import { Lock, Loader2 } from "lucide-react";

export default function PartnerSetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState<
    "checking" | "ready" | "invalid" | "config_error"
  >("checking");

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    async function run() {
      try {
        // Fail fast if Supabase is not configured (avoids throw from createClient)
        if (typeof window !== "undefined") {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key =
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
          if (!url || !key) {
            setAuthState("config_error");
            return;
          }
        }

        // Supabase redirects with #error=access_denied when invite expires, is reused, or redirect URL isn't allowed
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        if (hash.includes("error=access_denied") || hash.includes("error=")) {
          setAuthState("invalid");
          return;
        }

        const supabase = createClient();

        // Explicitly parse invite tokens from URL hash and set session (Supabase invite uses implicit flow)
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            // Clear the hash from URL for security (tokens no longer visible)
            window.history.replaceState(null, "", window.location.pathname);
            setAuthState("ready");
            return;
          }
        }

        async function checkSession() {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            setAuthState("ready");
            return;
          }
          // Fallback: token might still be processing. Wait and retry.
          await new Promise((r) => setTimeout(r, 1500));
          const { data: retry } = await supabase.auth.getSession();
          if (retry.session?.user) {
            setAuthState("ready");
          } else {
            setAuthState("invalid");
          }
        }

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) setAuthState("ready");
        });
        subscription = data.subscription;

        await checkSession();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("Missing") ||
          msg.includes("SUPABASE") ||
          msg.includes("anon") ||
          msg.includes("publishable")
        ) {
          setAuthState("config_error");
        } else {
          setAuthState("invalid");
        }
      }
    }

    run();
    return () => subscription?.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      const linkRes = await fetch("/api/partner/link-account", { method: "POST" });
      const linkJson = await linkRes.json();
      if (!linkRes.ok) {
        setError(linkJson.error || "Failed to link account");
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

  if (authState === "checking") {
    return (
      <PartnerAuthShell
        title="Set your password"
        subtitle="You've been invited to the partner program. Set a password to access your dashboard."
      >
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-8 py-16 shadow-md">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          <p className="mt-4 text-sm text-muted-foreground">Setting up your account…</p>
        </div>
      </PartnerAuthShell>
    );
  }

  if (authState === "invalid") {
    return (
      <PartnerAuthShell
        title="Invalid or expired link"
        subtitle="This invitation link may have expired or already been used."
      >
        <div className="rounded-2xl border border-border bg-card px-8 py-10 shadow-md">
          <p className="text-sm text-muted-foreground">
            Please contact your administrator for a new invitation, or try signing in if you already have an account.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-lg bg-orange-600 hover:bg-orange-700">
              <Link href="/partner/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg">
              <Link href="/partner">Back to Partner Program</Link>
            </Button>
          </div>
        </div>
      </PartnerAuthShell>
    );
  }

  if (authState === "config_error") {
    return (
      <PartnerAuthShell
        title="Configuration error"
        subtitle="Partner login is not available. The site administrator needs to configure Supabase."
      >
        <div className="rounded-2xl border border-border bg-card px-8 py-10 shadow-md">
          <p className="text-sm text-muted-foreground">
            Please contact your administrator. They need to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="rounded-lg">
              <Link href="/partner">Back to Partner Program</Link>
            </Button>
          </div>
        </div>
      </PartnerAuthShell>
    );
  }

  return (
    <PartnerAuthShell
      title="Set your password"
      subtitle="Create a password to access your partner dashboard and track commissions."
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md ring-1 ring-black/[0.04] dark:ring-white/5">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5 sm:px-8 sm:py-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Create your password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a secure password (at least 6 characters)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8 sm:pb-8 sm:pt-6">
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
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 pl-11 pr-4 rounded-lg border-border bg-muted/20 focus:bg-background"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
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
            {loading ? "Setting up…" : "Set password & continue"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/partner/login"
              className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 dark:text-orange-400"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </PartnerAuthShell>
  );
}
