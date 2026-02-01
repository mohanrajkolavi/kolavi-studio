import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CTA } from "@/components/sections/CTA";
import { getPageMetadata } from "@/lib/seo/metadata";
import { Search, Globe, PenTool, BarChart, Megaphone, Code } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Our Services - Digital Marketing & Web Design",
  description: "Comprehensive digital marketing services including SEO, web design, content marketing, PPC advertising, and more. Tailored solutions for your business growth.",
  path: "/services",
});

const services = [
  {
    icon: <Search className="h-10 w-10" />,
    title: "Search Engine Optimization",
    description: "Improve your search rankings and drive organic traffic with technical SEO, on-page optimization, and strategic link building.",
  },
  {
    icon: <Globe className="h-10 w-10" />,
    title: "Web Design & Development",
    description: "Beautiful, mobile-first websites that convert visitors into customers. Built for performance and optimized for search engines.",
  },
  {
    icon: <PenTool className="h-10 w-10" />,
    title: "Content Marketing",
    description: "Engage your audience with high-quality content that educates, builds trust, and drives conversions.",
  },
  {
    icon: <BarChart className="h-10 w-10" />,
    title: "Analytics & Reporting",
    description: "Data-driven insights to measure performance, identify opportunities, and optimize your marketing ROI.",
  },
  {
    icon: <Megaphone className="h-10 w-10" />,
    title: "Pay-Per-Click Advertising",
    description: "Targeted PPC campaigns on Google Ads and social media platforms to drive immediate results and qualified leads.",
  },
  {
    icon: <Code className="h-10 w-10" />,
    title: "Technical SEO",
    description: "Optimize your website's technical foundation for better crawlability, indexing, and Core Web Vitals performance.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Our Services
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Comprehensive digital marketing solutions designed to help your business grow. From strategy to execution, we deliver results that matter.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="mb-4 text-primary">{service.icon}</div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tailored Solutions for Your Industry
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              We specialize in serving specific industries, understanding their unique challenges and opportunities. Whether you run a medical spa, dental practice, or law firm, we have the expertise to help you succeed.
            </p>
          </div>
        </div>
      </section>

      <CTA
        title="Let's Discuss Your Project"
        description="Ready to take your digital marketing to the next level? Get in touch for a free consultation."
      />
    </>
  );
}
