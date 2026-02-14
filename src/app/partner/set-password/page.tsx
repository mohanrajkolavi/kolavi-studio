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

  const boxBase = "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/5 px-6 py-8 sm:px-8 sm:py-10";

  if (authState === "checking") {
    return (
      <PartnerAuthShell
        title="Set your password"
        subtitle="You've been invited to the partner program. Set a password to access your dashboard."
      >
        <div className={boxBase}>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="mt-4 text-sm text-muted-foreground">Setting up your account…</p>
          </div>
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
        <div className={boxBase}>
          <div>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator for a new invitation, or try signing in if you already have an account.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="h-11 rounded-2xl bg-orange-600 hover:bg-orange-700">
                <Link href="/partner/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-2xl">
                <Link href="/partner/apply">Apply to Partner</Link>
              </Button>
            </div>
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
        <div className={boxBase}>
          <div>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator. They need to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="h-11 rounded-2xl bg-orange-600 hover:bg-orange-700">
                <Link href="/partner/apply">Apply to Partner</Link>
              </Button>
            </div>
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
      <div className={boxBase}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
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
                  minLength={6}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
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
              {loading ? "Setting up…" : "Set password & continue"}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-1">
              Already have an account?{" "}
              <Link
                href="/partner/login"
                className="font-medium text-orange-600 underline-offset-4 hover:text-orange-700 dark:text-orange-400"
              >
                Sign in
              </Link>
            </p>
        <div className="pt-2">
          <Button asChild variant="outline" className="h-11 w-full rounded-2xl">
            <Link href="/partner/apply">Apply to Partner</Link>
          </Button>
        </div>
      </form>
      </div>
    </PartnerAuthShell>
  );
}
