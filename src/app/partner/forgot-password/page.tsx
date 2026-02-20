"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PartnerAuthShell } from "@/components/partner/PartnerAuthShell";
import { Mail, Loader2 } from "lucide-react";
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
      <PartnerAuthShell maxWidth="480px">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-h3 text-foreground mb-2">Check Your Inbox</h1>
          <p className="text-body text-muted-foreground mt-4 mb-8">
            We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>. The link expires in 1 hour. If you don't see it, check your spam folder.
          </p>
          <Button asChild variant="outline" className="h-12 w-full rounded-[48px] text-button">
            <Link href="/partner/login">Back to Login</Link>
          </Button>
        </div>
      </PartnerAuthShell>
    );
  }

  return (
    <PartnerAuthShell maxWidth="480px">
      <div className="text-center mb-6">
        <h1 className="text-h3 text-foreground mb-2">Reset Your Password</h1>
        <p className="text-small text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <div className="h-px bg-border my-8 w-full" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[14px] font-medium text-foreground">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 px-4 rounded-[12px] border border-input bg-background text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-colors"
            placeholder="partner@example.com"
            required
            autoComplete="email"
            disabled={loading}
          />
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
          className="h-12 w-full rounded-[48px] bg-primary text-button text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        <p className="text-center text-[14px] text-muted-foreground pt-2">
          Remember your password?{" "}
          <Link
            href="/partner/login"
            className="font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            Back to login
          </Link>
        </p>
      </form>
    </PartnerAuthShell>
  );
}
