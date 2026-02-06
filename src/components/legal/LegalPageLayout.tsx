interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <section className="relative border-b border-border bg-background">
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
      <div className="relative overflow-visible">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            <div className="prose prose-neutral mt-10 dark:prose-invert max-w-none prose-p:text-muted-foreground prose-li:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
