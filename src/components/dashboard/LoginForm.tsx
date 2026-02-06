"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  redirectTo: string;
  error?: string;
  unlocked?: boolean;
};

export function LoginForm({ redirectTo, error, unlocked }: LoginFormProps) {
  let decodedError = "";
  if (error) {
    try {
      decodedError = decodeURIComponent(error.replace(/\+/g, " "));
    } catch {
      decodedError = error.replace(/\+/g, " ") || "An error occurred";
    }
  }

  return (
    <form action="/api/auth/login" method="POST" className="mt-8 space-y-5">
      <input type="hidden" name="redirect" value={redirectTo} readOnly />

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          type="password"
          id="password"
          name="password"
          className="mt-2 h-11 rounded-lg border-input"
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
      </div>

      {unlocked && (
        <div
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
          role="status"
        >
          Lockout cleared. You can try again.
        </div>
      )}
      {error && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {decodedError}
        </div>
      )}

      <Button
        type="submit"
        className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Sign in
      </Button>
    </form>
  );
}
