"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileEdit, FileSearch } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/blog", label: "Blog Maker", icon: FileEdit },
  { href: "/dashboard/content-maintenance", label: "Content", icon: FileSearch },
];

export function DashboardNavStrip() {
  const pathname = usePathname();
  const safePath = pathname ?? "";

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
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
