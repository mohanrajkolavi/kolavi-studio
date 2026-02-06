"use client";

import Link from "next/link";
import { useState } from "react";

export function BlogSubscribe({ variant = "default" }: { variant?: "default" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // UI only - no backend integration per plan
    if (email) {
      setStatus("success");
      setEmail("");
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex rounded-2xl border border-border bg-background overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-colors">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
          }}
          placeholder="Enter your email"
          className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 px-5 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          Join
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground text-center">
        We care about your data.{" "}
        <Link
          href="/privacy"
          className="text-primary hover:underline"
        >
          Read our privacy policy.
        </Link>
      </p>
      {status === "success" && (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400 text-center">
          Thanks. Subscription saved locally (no email sent).
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 text-center">
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}
