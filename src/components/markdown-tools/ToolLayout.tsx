import { ToolHeader } from "./ToolHeader";
import { ToolFooter } from "./ToolFooter";

interface ToolLayoutProps {
  title: string;
  description: string;
  currentPath: string;
  children: React.ReactNode;
}

export function ToolLayout({
  title,
  description,
  currentPath,
  children,
}: ToolLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ToolHeader title={title} description={description} />
      <div className="mt-8">{children}</div>
      <ToolFooter currentPath={currentPath} />
    </div>
  );
}
