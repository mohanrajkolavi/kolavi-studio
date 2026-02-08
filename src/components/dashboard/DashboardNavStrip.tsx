"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileEdit, FileSearch, Loader2 } from "lucide-react";
import { useBlogGenerationOptional } from "@/components/dashboard/BlogGenerationProvider";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/blog", label: "Blog Maker", icon: FileEdit },
  { href: "/dashboard/content-maintenance", label: "Content", icon: FileSearch },
];

export function DashboardNavStrip() {
  const pathname = usePathname();
  const safePath = pathname ?? "";
  const blogGen = useBlogGenerationOptional();
  const isGenerating = blogGen?.generating ?? false;

  return (
    <nav
      aria-label="Dashboard sections"
      className="flex flex-nowrap gap-2 overflow-x-auto border-b border-border pb-6 scrollbar-hide"
    >
      {navItems.map((item) => {
        const isActive =
          safePath === item.href ||
          (item.href !== "/dashboard" && safePath.startsWith(item.href));
        const Icon = item.icon;
        const isBlogMaker = item.href === "/dashboard/blog";
        const showGenerating = isBlogMaker && isGenerating;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-orange-600 text-white dark:bg-orange-500"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {showGenerating ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {item.label}
            {showGenerating && (
              <span className="ml-1 text-xs opacity-90">Generating…</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
