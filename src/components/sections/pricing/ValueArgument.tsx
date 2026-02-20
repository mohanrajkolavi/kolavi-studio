import { VALUE_ARGUMENT } from "@/lib/constants/pricing";

export function ValueArgument() {
  return (
    <section className="border-t border-border py-16 sm:py-20" aria-labelledby="value-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 id="value-heading" className="text-xl font-bold text-foreground">
            The value argument
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {VALUE_ARGUMENT}
          </p>
        </div>
      </div>
    </section>
  );
}
