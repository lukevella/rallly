import { buttonVariants, cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { ChevronDownIcon } from "lucide-react";
import { Link } from "@/components/link";
import { Trans } from "@/i18n/client";

/**
 * A collapsible Overview card. Native details/summary carries the toggle's
 * keyboard and screen reader behaviour; "View all" sits outside the summary
 * so it stays reachable, and visible, while the card is collapsed.
 */
export function OverviewSection({
  title,
  viewAllHref,
  count,
  children,
}: React.PropsWithChildren<{
  title: React.ReactNode;
  viewAllHref?: string;
  count?: number;
}>) {
  return (
    <section className="relative rounded-xl border border-card-border bg-card text-xs">
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-xl px-3.5 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <h2 className="font-medium text-sm">{title}</h2>
          <ChevronDownIcon
            aria-hidden
            className="size-3.5 -rotate-90 text-muted-foreground transition-transform group-open:rotate-0"
          />
        </summary>
        <div className="px-3.5 pb-3.5">{children}</div>
      </details>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "xs" }),
            "absolute top-2.5 right-2.5",
            // Inset the badge by the same gap it has above and below
            count !== undefined && "pr-0.5 pl-2",
          )}
        >
          <Trans i18nKey="pollOverviewViewAll" defaults="View all" />
          {count !== undefined ? (
            <Badge size="sm" className="tabular-nums">
              {count}
            </Badge>
          ) : null}
        </Link>
      ) : null}
    </section>
  );
}
