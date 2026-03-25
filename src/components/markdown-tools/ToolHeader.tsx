import { cn } from "@/lib/utils";

interface ToolHeaderProps {
  title: string;
  description: string;
  className?: string;
}

export function ToolHeader({ title, description, className }: ToolHeaderProps) {
  return (
    <div className={cn("text-center", className)}>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
}
