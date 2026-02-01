"use client";

import { useState } from "react";

export function BlogSubscribe() {
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
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setStatus("idle");
        }}
        placeholder="Your email address"
        className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      />
      <button
        type="submit"
        className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Subscribe
      </button>
      {status === "success" && (
        <p className="w-full text-center text-sm text-green-600 sm:text-left">
          Great! Check your inbox and click the link.
        </p>
      )}
      {status === "error" && (
        <p className="w-full text-center text-sm text-red-600 sm:text-left">
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}
