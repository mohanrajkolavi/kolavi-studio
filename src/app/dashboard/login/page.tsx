import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/dashboard/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  searchParams: Promise<{ error?: string; redirect?: string; unlocked?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error;
  const unlocked = params.unlocked === "1";
  const redirectTo = params.redirect || "/dashboard";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />

      <div className="relative w-full max-w-[400px]">
        <div className="rounded-[2rem] border border-border bg-card px-8 py-10 shadow-sm sm:px-10 sm:py-12">
          {/* Header: brand + heading */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-block text-lg font-semibold tracking-tight text-foreground hover:opacity-80"
            >
              Kolavi Studio
            </Link>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your admin password to access the dashboard
            </p>
          </div>

          <LoginForm redirectTo={redirectTo} error={error} unlocked={unlocked} />
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
          >
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
