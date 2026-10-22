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
    <section className="space-y-2">
      <div className="flex h-9 items-center justify-between gap-4">
        <h2 className="font-medium text-sm">{title}</h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              // Inset the badge by the same gap it has above and below
              count !== undefined && "pr-1 pl-2.5",
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
