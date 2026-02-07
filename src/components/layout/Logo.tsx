import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Include trailing period (Header/Footer: yes; MobileNav/Login: no) */
  withPeriod?: boolean;
};

/** Logo text with o, i, and . in "Studio." in orange. Kolavi is plain. */
export function Logo({ className, withPeriod = true }: LogoProps) {
  return (
    <span className={cn("inline", className)}>
      Kolavi Stud
      <span className="text-[#ea580c] dark:text-[#fb923c]">i</span>
      <span className="text-[#ea580c] dark:text-[#fb923c]">o</span>
      {withPeriod && <span className="text-[#ea580c] dark:text-[#fb923c]">.</span>}
    </span>
  );
}
