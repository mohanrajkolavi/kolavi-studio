import { Hero } from "@/components/sections/Hero";
import { Benefits } from "@/components/sections/Benefits";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";
import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "Digital Marketing Agency for Medical Spas, Dental & Law Firms",
  description: "Kolavi Studio helps businesses grow with expert digital marketing, web design, and SEO services. Specializing in medical spas, dental practices, and law firms.",
  path: "/",
  keywords:
    "digital marketing agency, medical spa marketing, dental practice SEO, law firm marketing, web design, SEO services, business growth",
});

export default function HomePage() {
  return (
    <>
      <Hero
        title="Transform Your Business with Expert Digital Marketing"
        subtitle="We help medical spas, dental practices, and law firms grow their online presence and attract more clients through strategic digital marketing and stunning web design."
      />
      <Benefits />
      <Process />
      <Testimonials />
      <CTA />
    </>
  );
}
