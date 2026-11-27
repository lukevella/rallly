import { cn } from "@rallly/ui";
import type React from "react";

/** Groups the section cards; they share the page's spacing. */
export function PollSections({ children }: { children: React.ReactNode }) {
  return <div className="contents">{children}</div>;
}

/**
 * A section card: a header with the title on the left and the section's
 * controls on the right, or a summary when it has none.
 */
export function PollSection({
  id,
  title,
  count,
  summary,
  action,
  flush = false,
  children,
}: {
  id: string;
  title: React.ReactNode;
  count?: number;
  summary?: React.ReactNode;
  action?: React.ReactNode;
  /** Content runs edge to edge, for tables. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="overflow-hidden rounded-xl border border-button-outline bg-card text-card-foreground dark:bg-foreground/5"
    >
      <div className="flex min-h-14 items-center gap-4 border-button-outline border-b px-5 py-2">
        <h2 id={id} className="min-w-0 flex-1 font-medium text-sm">
          {title}
          {count !== undefined ? (
            <span className="ml-2 font-normal text-muted-foreground tabular-nums">
              {count}
            </span>
          ) : null}
        </h2>
        {action ? (
          <div className="shrink-0">{action}</div>
        ) : summary ? (
          <div className="shrink-0 truncate text-muted-foreground text-sm">
            {summary}
          </div>
        ) : null}
      </div>
      <div className={cn(!flush && "p-5")}>{children}</div>
    </section>
  );
}

export function PollSectionEmpty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
