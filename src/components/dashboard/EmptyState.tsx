import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  heading: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, heading, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-12 px-6 text-center">
      <div className="rounded-lg bg-muted p-3 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{heading}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
