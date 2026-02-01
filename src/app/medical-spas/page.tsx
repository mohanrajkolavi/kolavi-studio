import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { Benefits } from "@/components/sections/Benefits";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";
import { getPageMetadata } from "@/lib/seo/metadata";
import { Target, TrendingUp, Users, Award } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Medical Spa Marketing & Web Design Services",
  description: "Specialized digital marketing and web design services for medical spas. Increase bookings, attract more clients, and grow your med spa business with proven strategies.",
  path: "/medical-spas",
});

const medSpaBenefits = [
  {
    icon: <Target className="h-8 w-8" />,
    title: "Targeted Marketing",
    description: "Reach your ideal clients with precision-targeted campaigns designed specifically for the medical spa industry.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Increase Bookings",
    description: "Convert more website visitors into paying clients with optimized booking funnels and compelling calls-to-action.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Build Trust",
    description: "Establish credibility with professional branding, testimonials, and before-and-after showcases.",
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Stand Out",
    description: "Differentiate your med spa from competitors with unique positioning and premium web design.",
  },
];

export default function MedicalSpasPage() {
  return (
    <>
      <Hero
        title="Grow Your Medical Spa with Strategic Digital Marketing"
        subtitle="We specialize in helping medical spas attract more clients, increase bookings, and build a premium brand that stands out in a competitive market."
        ctaText="Schedule a Consultation"
      />
      
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Medical Spas Choose Kolavi Studio
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              The medical spa industry is highly competitive. To succeed, you need more than just great services—you need a strategic digital presence that attracts your ideal clients and converts them into loyal customers.
            </p>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Our team understands the unique challenges of marketing medical spas, from compliance considerations to showcasing results in an authentic way. We create custom strategies that drive real results.
            </p>
            <div className="mt-8">
              <Link
                href="/blog/category/medical-spa-marketing"
                className="text-primary hover:underline"
              >
                Read our medical spa marketing insights →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Benefits
        title="What We Deliver for Medical Spas"
        benefits={medSpaBenefits}
      />
      
      <Process
        title="Our Medical Spa Marketing Process"
      />
      
      <Testimonials />
      
      <CTA
        title="Ready to Grow Your Medical Spa?"
        description="Let's create a custom marketing strategy that attracts more clients and increases your revenue."
        buttonText="Get Your Free Consultation"
      />
    </>
  );
}
