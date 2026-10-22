import { buttonVariants, cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Link } from "@/components/link";
import { Trans } from "@/i18n/client";

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
    <section className="rounded-[18px] border border-card-border bg-card p-5 text-xs">
      <div className="mb-3 flex h-6 items-center justify-between gap-4">
        <h2 className="font-medium">{title}</h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "xs" }),
              "-mr-1.5",
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
      </div>
      {children}
    </section>
  );
}
