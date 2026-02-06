"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  onClick?: () => void;
};

export function LogoutButton({ className, onClick }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    onClick?.();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      type="button"
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground dark:hover:bg-muted",
        className
      )}
    >
      Logout
    </button>
  );
}
