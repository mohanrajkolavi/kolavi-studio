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
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex rounded-full border-2 border-border bg-card overflow-hidden focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-[border-color,box-shadow] duration-200 dark:border-white/15 dark:bg-[#1d1e22] dark:focus-within:border-orange-500 dark:focus-within:ring-orange-500/25">
        <label htmlFor="blog-newsletter-email" className="sr-only">
          Email address for newsletter
        </label>
        <input
          id="blog-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
          }}
          placeholder="Enter your email"
          autoComplete="email"
          className="flex-1 min-w-0 bg-transparent pl-6 pr-5 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none dark:placeholder:text-neutral-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full m-1.5 px-6 py-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition-colors dark:bg-orange-500 dark:hover:bg-orange-400"
        >
          Join
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground text-center">
        We care about your data.{" "}
        <Link
          href="/privacy"
          className="text-orange-700 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
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
