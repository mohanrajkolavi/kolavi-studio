"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PartnerAuthShell } from "@/components/partner/PartnerAuthShell";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function PartnerSetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState<
    "checking" | "ready" | "invalid" | "config_error"
  >("checking");

  // Basic password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-muted" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score < 2) return { score, label: "Weak", color: "bg-destructive" };
    if (score === 2) return { score, label: "Fair", color: "bg-orange-500" };
    return { score, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);
  
  // Real-time mismatch check
  const passwordsMatch = !confirmPassword || password === confirmPassword;

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
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
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
      <PartnerAuthShell maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-6" />
          <h1 className="text-h3 text-foreground mb-2">Setting up...</h1>
          <p className="text-small text-muted-foreground">Preparing your account access.</p>
        </div>
      </PartnerAuthShell>
    );
  }

  if (authState === "invalid") {
    return (
      <PartnerAuthShell maxWidth="480px">
        <div className="text-center mb-6">
          <h1 className="text-h3 text-foreground mb-2">Link Expired</h1>
          <p className="text-small text-muted-foreground">
            This link is no longer valid. Please request a new password reset.
          </p>
        </div>

        <div className="h-px bg-border my-8 w-full" />

        <div className="space-y-4">
          <Button asChild className="h-12 w-full rounded-[48px] bg-primary text-button text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Link href="/partner/forgot-password">Request New Link</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 w-full rounded-[48px] text-button">
            <Link href="/partner/login">Back to Login</Link>
          </Button>
        </div>
      </PartnerAuthShell>
    );
  }

  if (authState === "config_error") {
    return (
      <PartnerAuthShell maxWidth="480px">
        <div className="text-center mb-6">
          <h1 className="text-h3 text-foreground mb-2">Configuration Error</h1>
          <p className="text-small text-muted-foreground">
            Partner login is not available. Please contact your administrator.
          </p>
        </div>

        <div className="h-px bg-border my-8 w-full" />

        <div className="space-y-4">
          <Button asChild className="h-12 w-full rounded-[48px] bg-primary text-button text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Link href="/partner/apply">Apply to Partner</Link>
          </Button>
        </div>
      </PartnerAuthShell>
    );
  }

  return (
    <PartnerAuthShell maxWidth="480px">
      <div className="text-center mb-6">
        <h1 className="text-h3 text-foreground mb-2">Set Your New Password</h1>
        <p className="text-small text-muted-foreground">
          Choose a strong password for your partner account.
        </p>
      </div>

      <div className="h-px bg-border my-8 w-full" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="password" className="text-[14px] font-medium text-foreground">
            New Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-4 pr-12 rounded-[12px] border border-input bg-background text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-colors"
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="pt-1">
              <div className="flex gap-1 mb-1.5 h-1">
                <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-muted'}`} />
                <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-muted'}`} />
                <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-muted'}`} />
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className={`font-medium ${strength.color.replace('bg-', 'text-')}`}>
                  {strength.label}
                </span>
                <span className="text-muted-foreground">
                  At least 8 characters, one uppercase letter, one number
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-[14px] font-medium text-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`h-12 pl-4 pr-12 rounded-[12px] border bg-background text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-colors ${!passwordsMatch ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}`}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1 transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="text-[12px] text-destructive mt-1">Passwords do not match</p>
          )}
        </div>

        {error && (
          <div
            className="text-[14px] text-destructive flex items-start gap-2"
            role="alert"
          >
            <span className="block">{error}</span>
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-[48px] bg-primary text-button text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-4"
          disabled={loading || !passwordsMatch || password.length < 8}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Password...
            </>
          ) : (
            "Set Password"
          )}
        </Button>
      </form>
    </PartnerAuthShell>
  );
}
