import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CTA } from "@/components/sections/CTA";
import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "Our Portfolio - Client Success Stories",
  description: "Explore our portfolio of successful digital marketing campaigns and web design projects for medical spas, dental practices, and law firms.",
  path: "/portfolio",
});

const projects = [
  {
    title: "Serenity Med Spa",
    category: "Medical Spa",
    description: "Complete website redesign and SEO strategy that increased organic traffic by 200% and bookings by 150% in 6 months.",
    results: ["200% increase in organic traffic", "150% increase in bookings", "45% reduction in bounce rate"],
  },
  {
    title: "Elite Wellness Center",
    category: "Medical Spa",
    description: "Comprehensive digital marketing campaign including PPC, SEO, and content marketing to establish market leadership.",
    results: ["300% ROI on ad spend", "Top 3 rankings for key terms", "85% increase in consultation requests"],
  },
  {
    title: "Radiance Aesthetics",
    category: "Medical Spa",
    description: "Brand refresh and website development with integrated booking system and patient education resources.",
    results: ["Modern, mobile-first design", "Seamless booking experience", "40% increase in conversion rate"],
  },
  {
    title: "Luxury Med Spa Group",
    category: "Medical Spa",
    description: "Multi-location SEO strategy and local search optimization to dominate regional markets.",
    results: ["Ranked #1 in 3 cities", "250% increase in local calls", "Consistent 5-star reviews"],
  },
  {
    title: "Renewal Wellness",
    category: "Medical Spa",
    description: "Content marketing and email automation strategy to nurture leads and increase customer lifetime value.",
    results: ["60% email open rate", "35% repeat booking rate", "Strong brand authority"],
  },
  {
    title: "Premier Aesthetics",
    category: "Medical Spa",
    description: "Social media marketing and influencer partnerships to build brand awareness and attract younger demographics.",
    results: ["10K+ new followers", "500% increase in engagement", "30% of bookings from social"],
  },
];

export default function PortfolioPage() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Our Portfolio
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Real results for real businesses. See how we've helped our clients achieve their digital marketing goals and grow their businesses.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {project.category}
                    </span>
                  </div>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription className="text-base">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="mb-2 text-sm font-semibold">Key Results:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {project.results.map((result, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTA
        title="Ready to See Similar Results?"
        description="Let's create a success story for your business. Schedule a free consultation today."
        buttonText="Start Your Project"
      />
    </>
  );
}
