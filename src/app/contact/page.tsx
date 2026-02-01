import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "Contact Us - Get Your Free Consultation",
  description: "Ready to grow your business? Contact Kolavi Studio for a free consultation. We'll discuss your goals and create a custom digital marketing strategy.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Get in Touch
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Ready to transform your digital presence? Fill out the form below and we'll get back to you within 24 hours.
              </p>
            </div>

            <form className="mt-12 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email Address
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="mt-2"
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium">
                  Business Type
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  className="mt-2 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                >
                  <option value="">Select your business type</option>
                  <option value="medical-spa">Medical Spa</option>
                  <option value="dental">Dental Practice</option>
                  <option value="law">Law Firm</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium">
                  Tell us about your project
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="mt-2"
                  placeholder="What are your goals? What challenges are you facing?"
                  required
                />
              </div>

              <div>
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Send Message
                </Button>
              </div>
            </form>

            <div className="mt-12 border-t pt-12">
              <h2 className="text-2xl font-bold">Other Ways to Reach Us</h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>
                  <strong>Email:</strong> hello@kolavistudio.com
                </p>
                <p>
                  <strong>Phone:</strong> (555) 123-4567
                </p>
                <p>
                  <strong>Hours:</strong> Monday - Friday, 9am - 6pm EST
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
