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
      <div className="flex rounded-full border-2 border-neutral-200 bg-white overflow-hidden focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-[border-color,box-shadow] duration-200">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
          }}
          placeholder="Enter your email"
          className="flex-1 min-w-0 bg-transparent pl-6 pr-5 py-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full m-1.5 px-6 py-3 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-colors"
        >
          Join
        </button>
      </div>
      <p className={`mt-2 text-xs ${variant === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>
        We care about your data.{" "}
        <Link href="/privacy-policy" className={variant === "dark" ? "text-orange-400 hover:text-orange-300 hover:underline" : "text-orange-600 hover:underline"}>
          Read our privacy policy.
        </Link>
      </p>
      {status === "success" && (
        <p className={`mt-2 text-xs ${variant === "dark" ? "text-green-400" : "text-green-600"}`}>
          Great! Check your inbox and click the link.
        </p>
      )}
      {status === "error" && (
        <p className={`mt-2 text-xs ${variant === "dark" ? "text-red-400" : "text-red-600"}`}>
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}
