"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent, EVENTS } from "@/lib/analytics/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Shield, Search, Zap, AlertTriangle, MonitorSmartphone, Code, FileText, ArrowRight } from "lucide-react";

export function SpeedAuditForm() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [spaName, setSpaName] = useState("");

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) setUrl(decodeURIComponent(urlParam));
  }, [searchParams]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Results State
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !email.trim() || !name.trim() || !spaName.trim()) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/speed-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: url.trim(), 
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          spaName: spaName.trim()
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        if (!res.ok) throw new Error(text || "Failed to analyze website");
        throw new Error("Invalid response from analysis server");
      }

      if (!res.ok) {
        throw new Error(data.error || text || "Failed to analyze website");
      }

      trackEvent(EVENTS.SPEED_AUDIT_SUBMIT, { url: url.trim() });

      // Show results view
      setResults(data.results);
      setShowResults(true);
      setIsSubmitting(false);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
      setIsSubmitting(false);
    }
  }

  // Live preview logic (blur decreases when URL is entered)
  const isTypingUrl = url.trim().length > 5;

  if (showResults && results) {
    return (
      <div className="w-full animate-reveal">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-6 border border-green-500/20 shadow-sm">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-foreground mb-4">
            Analysis Complete
          </h2>
          <p className="text-[18px] text-muted-foreground max-w-2xl mx-auto">
            We&apos;ve generated your instant digital health snapshot. Your comprehensive manual audit report will be delivered to <span className="font-semibold text-foreground">{email}</span> within 24 hours.
          </p>
        </div>

        {/* Overall Score */}
        {(() => {
          const score = typeof results?.score === "number" ? results.score : null;
          const borderColor = score === null ? "#94a3b8" : score >= 90 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
          const message = score === null ? "Score unavailable." : score >= 90 ? "Excellent! Your foundation is strong." : score >= 50 ? "Average. Significant room for improvement." : "Critical issues detected. Immediate action required.";
          return (
            <div className="bg-card border border-border rounded-[24px] p-8 sm:p-10 mb-8 shadow-premium text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <h3 className="text-[16px] font-semibold uppercase tracking-wider text-muted-foreground mb-6">Composite Health Score</h3>
              <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-[8px] mb-4 relative" style={{ borderColor }}>
                <span className="text-[56px] font-bold text-foreground" style={{ color: borderColor }}>
                  {score === null ? "N/A" : score}
                </span>
              </div>
              <p className="text-[18px] font-medium text-foreground">{message}</p>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* PageSpeed Card */}
          <div className="bg-card border border-border rounded-[20px] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-[18px] font-bold text-foreground">PageSpeed Insights</h3>
            </div>
            
            {results.pageSpeed ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-[15px] font-medium text-foreground flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4 text-muted-foreground" /> Mobile Score
                  </span>
                  <span className={`text-[20px] font-bold px-3 py-1 rounded-full ${
                    !results.pageSpeed.mobile ? 'bg-muted text-muted-foreground' :
                    results.pageSpeed.mobile >= 90 ? 'bg-green-500/10 text-green-500' : 
                    results.pageSpeed.mobile >= 50 ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {results.pageSpeed.mobile || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-[15px] font-medium text-foreground flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Desktop Score
                  </span>
                  <span className={`text-[20px] font-bold px-3 py-1 rounded-full ${
                    !results.pageSpeed.desktop ? 'bg-muted text-muted-foreground' :
                    results.pageSpeed.desktop >= 90 ? 'bg-green-500/10 text-green-500' : 
                    results.pageSpeed.desktop >= 50 ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {results.pageSpeed.desktop || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-[15px] font-medium text-foreground flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" /> SEO Score
                  </span>
                  <span className={`text-[20px] font-bold px-3 py-1 rounded-full ${
                    !results.pageSpeed.seo ? 'bg-muted text-muted-foreground' :
                    results.pageSpeed.seo >= 90 ? 'bg-green-500/10 text-green-500' : 
                    results.pageSpeed.seo >= 50 ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {results.pageSpeed.seo || 'N/A'}
                  </span>
                </div>
                
                <p className="text-[14px] text-muted-foreground leading-relaxed pt-2">
                  <span className="font-semibold text-foreground">Recommendation:</span> Sites scoring below 90 on mobile lose up to 40% of their organic traffic. Kolavi builds exclusively on Next.js to guarantee 95+ scores.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-[14px] font-medium">PageSpeed API timed out or failed. We will run this manually and include it in your emailed report.</p>
              </div>
            )}
          </div>

          {/* Technical Health Card */}
          <div className="bg-card border border-border rounded-[20px] p-6 sm:p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Code className="w-5 h-5 text-primary" />
              <h3 className="text-[18px] font-bold text-foreground">Technical Infrastructure</h3>
            </div>
            
            {results.meta ? (
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <span className="text-[15px] font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4" /> SSL Security (HTTPS)
                  </span>
                  {results.meta.hasHttps ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <span className="text-[15px] font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Title Tag
                  </span>
                  {results.meta?.title?.present ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <span className="text-[15px] font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Meta Description
                  </span>
                  {results.meta?.description?.present ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <span className="text-[15px] font-medium text-muted-foreground flex items-center gap-2">
                    <Code className="w-4 h-4" /> Schema Markup
                  </span>
                  {results.meta?.schema?.present ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                </div>
                
                <p className="text-[14px] text-muted-foreground leading-relaxed pt-4 mt-auto">
                  <span className="font-semibold text-foreground">Recommendation:</span> Missing technical tags or schema markup prevents Google from understanding and ranking your med spa services effectively in local search.
                </p>
              </div>
            ) : (
               <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-start gap-3 mt-auto">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-[14px] font-medium">Infrastructure scan delayed. We will analyze your source code manually.</p>
              </div>
            )}
          </div>
        </div>

        {/* Post-results CTA */}
        <div className="text-center bg-primary/5 border border-primary/20 rounded-[24px] p-8 sm:p-12 shadow-sm">
          <h3 className="text-[24px] font-bold text-foreground mb-4">Want the full picture?</h3>
          <p className="text-[16px] text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            This instant snapshot only scratches the surface. Our team is running a manual review of your competitor gaps, local SEO visibility, and treatment page optimizations right now.
          </p>
          <p className="text-[15px] font-semibold text-primary">
            Watch your inbox at {email}. Your custom roadmap will arrive within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start pb-20">
      {/* LEFT: FORM */}
      <div className="animate-reveal max-w-[500px] lg:max-w-none mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[24px] border border-border/50 bg-card p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-[14px] font-semibold text-foreground">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-12 sm:h-14 px-4 text-[15px] rounded-[12px] bg-background border-border/40 shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary/30 hover:border-border"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="spaName" className="text-[14px] font-semibold text-foreground">
                Med Spa Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="spaName"
                placeholder="Luxe Aesthetics"
                value={spaName}
                onChange={(e) => setSpaName(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-12 sm:h-14 px-4 text-[15px] rounded-[12px] bg-background border-border/40 shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary/30 hover:border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[14px] font-semibold text-foreground">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@luxeaesthetics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-12 sm:h-14 px-4 text-[15px] rounded-[12px] bg-background border-border/40 shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary/30 hover:border-border"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-[14px] font-semibold text-foreground flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-muted-foreground font-normal text-[13px]">(Optional)</span>
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                className="h-12 sm:h-14 px-4 text-[15px] rounded-[12px] bg-background border-border/40 shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary/30 hover:border-border"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label htmlFor="url" className="text-[14px] font-semibold text-foreground">
              Website URL <span className="text-red-500">*</span>
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://luxeaesthetics.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isSubmitting}
              className="h-14 px-4 text-[16px] rounded-[12px] bg-background border-border/40 shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary/30 hover:border-border"
            />
          </div>

          {status && status.type === "error" && (
            <div className="rounded-[12px] p-4 text-[14px] bg-red-500/10 text-red-600 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{status.message}</span>
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-[48px] bg-primary font-bold text-[16px] text-primary-foreground shadow-premium transition-all hover:-translate-y-0.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing your website...
                </span>
              ) : (
                "Generate My Free Audit"
              )}
            </Button>
            <p className="text-center text-[13px] text-muted-foreground mt-4">
              Your information is never shared. We use it only to deliver your audit.
            </p>
          </div>
        </form>
      </div>

      {/* RIGHT: LIVE PREVIEW TEASER */}
      <div className="hidden lg:block relative sticky top-32 animate-reveal max-w-[500px] w-full ml-auto" style={{ animationDelay: "150ms" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-[32px] blur-xl" />
        
        <div className={`relative rounded-[32px] border border-border bg-card/80 backdrop-blur-xl p-8 shadow-premium overflow-hidden transition-all duration-700 ease-in-out ${isTypingUrl ? 'ring-1 ring-primary/30 shadow-[0_0_40px_rgba(234,88,12,0.1)]' : ''}`}>
          
          <div className="flex items-center justify-between border-b border-border/50 pb-6 mb-6">
            <div>
              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
              <div className="h-6 w-48 bg-foreground/10 rounded animate-pulse" />
            </div>
            <div className="w-12 h-12 rounded-full border-[4px] border-muted flex items-center justify-center relative overflow-hidden">
              <div className={`absolute inset-0 bg-primary/20 transition-all duration-1000 ${isTypingUrl ? 'opacity-100' : 'opacity-0'}`} />
              <span className={`text-[12px] font-bold transition-all duration-1000 ${isTypingUrl ? 'text-primary blur-[2px]' : 'text-muted-foreground blur-[4px]'}`}>??</span>
            </div>
          </div>

          <div className="space-y-4 relative">
            {/* Overlay */}
            <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-700 bg-background/40 backdrop-blur-[2px] ${isTypingUrl ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="bg-background border border-border px-6 py-3 rounded-[48px] shadow-lg font-semibold text-[14px] text-foreground flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                Enter your website to unlock
              </div>
            </div>

            {/* Mock Rows */}
            {[
              { label: 'PageSpeed Score', color: 'bg-orange-500' },
              { label: 'Mobile Optimization', color: 'bg-green-500' },
              { label: 'SEO Health Score', color: 'bg-red-500' },
              { label: 'Local SEO Visibility', color: 'bg-orange-500' },
              { label: 'Core Web Vitals', color: 'bg-red-500' },
              { label: 'Schema Markup', color: 'bg-green-500' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border border-border/50 transition-all duration-700 ${isTypingUrl ? 'bg-muted/30 blur-[1px]' : 'bg-muted/10 blur-[3px]'}`}>
                <span className="text-[14px] font-medium text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-bold opacity-50`}>???</span>
                  <div className={`w-2 h-2 rounded-full ${item.color} opacity-40`} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}