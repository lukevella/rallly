import { cn } from "@rallly/ui";
import { MarkdownDescription } from "@rallly/ui/markdown-description";

// Kept apart from event-meta so client components that only need the title
// and meta list don't pull the markdown parser into their bundle. Render it
// on the server wherever the poll is available there, as the invite page does.
export function EventMetaDescription({
  className,
  content,
}: {
  className?: string;
  content?: string | null;
}) {
  if (!content) {
    return null;
  }
  return (
    <MarkdownDescription
      content={content}
      className={cn(className, "min-w-0 opacity-90")}
    />
  );
}
