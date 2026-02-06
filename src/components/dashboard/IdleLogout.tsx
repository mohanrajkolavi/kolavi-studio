"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Ops/env config:
// - `NEXT_PUBLIC_IDLE_LOGOUT_MS`: idle timeout (milliseconds) before dashboard auto-logout.
//   Must be a positive number. If unset/invalid, defaults to 15 minutes.
const DEFAULT_IDLE_MS = 15 * 60 * 1000;
const IDLE_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_IDLE_LOGOUT_MS;
  if (raw == null || raw.trim() === "") return DEFAULT_IDLE_MS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      "Invalid NEXT_PUBLIC_IDLE_LOGOUT_MS; falling back to default.",
      { value: raw, fallbackMs: DEFAULT_IDLE_MS }
    );
    return DEFAULT_IDLE_MS;
  }

  return parsed;
})();

export function IdleLogout() {
  const router = useRouter();
  const pathname = usePathname();

  const timerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const loggingOutRef = useRef(false);

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    async function doLogout(reason: "idle") {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      clearTimer();

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        // ignore: we'll still navigate to login
      }

      const redirectTo =
        typeof pathname === "string" && pathname.startsWith("/dashboard")
          ? pathname
          : "/dashboard";
      router.push(
        `/dashboard/login?redirect=${encodeURIComponent(redirectTo)}&reason=${reason}`
      );
      router.refresh();
    }

    function schedule() {
      clearTimer();
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = Math.max(0, IDLE_MS - elapsed);

      timerRef.current = window.setTimeout(() => {
        const since = Date.now() - lastActivityRef.current;
        if (since >= IDLE_MS) {
          void doLogout("idle");
          return;
        }
        schedule();
      }, remaining) as unknown as number;
    }

    function markActivity() {
      lastActivityRef.current = Date.now();
      schedule();
    }

    // Start timer when mounted.
    schedule();

    const opts: AddEventListenerOptions = { passive: true };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
      "wheel",
    ];

    for (const evt of events) window.addEventListener(evt, markActivity, opts);
    document.addEventListener("visibilitychange", markActivity, opts);
    window.addEventListener("focus", markActivity, opts);

    return () => {
      clearTimer();
      for (const evt of events) window.removeEventListener(evt, markActivity);
      document.removeEventListener("visibilitychange", markActivity);
      window.removeEventListener("focus", markActivity);
    };
  }, [router, pathname]);

  return null;
}

