import { DISCOUNTS } from "@/lib/constants/pricing";

export function DiscountsSection() {
  return (
    <section className="border-t border-border bg-muted/20 py-16 sm:py-20" aria-labelledby="discounts-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 id="discounts-heading" className="text-2xl font-bold text-foreground">
            Discounts
          </h2>
          <ul className="mt-6 space-y-4">
            {DISCOUNTS.map((d) => (
              <li key={d.name} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <span className="font-semibold text-foreground shrink-0 sm:w-40">{d.name}</span>
                <span className="text-foreground">{d.amount}</span>
                <span className="text-muted-foreground text-sm">{d.notes}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
