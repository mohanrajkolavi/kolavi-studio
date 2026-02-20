import React from "react";

interface PageHeroProps {
  title: string;
  description: string;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHero({ title, description, badge, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24 border-b border-border">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-reveal">
        {badge && (
          <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
            {badge}
          </div>
        )}

        <h1 className="text-h2 text-foreground max-w-[800px] mx-auto text-balance mb-6">
          {title}
        </h1>

        <p className="text-body text-muted-foreground max-w-[600px] mx-auto text-balance">
          {description}
        </p>

        {children && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
