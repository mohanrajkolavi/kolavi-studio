import { ToolHeader } from "@/components/markdown-tools/ToolHeader";
import { YamlToolFooter } from "./YamlToolFooter";

interface YamlToolLayoutProps {
  title: string;
  description: string;
  currentPath: string;
  children: React.ReactNode;
}

export function YamlToolLayout({
  title,
  description,
  currentPath,
  children,
}: YamlToolLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ToolHeader title={title} description={description} />
      <div className="mt-8">{children}</div>
      <YamlToolFooter currentPath={currentPath} />
    </div>
  );
}
