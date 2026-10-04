import { LayoutGridIcon, ListIcon } from "lucide-react";
import { Link } from "@/components/link";
import { pillVariants } from "@/components/pill-variants";
import { Trans } from "@/i18n/client";

export function PollResultsViewSwitch({
  pollId,
  view,
}: {
  pollId: string;
  view: "grid" | "list";
}) {
  return (
    <nav className="flex items-center gap-1">
      <Link
        href={`/polls/${pollId}`}
        aria-current={view === "grid" ? "page" : undefined}
        className={pillVariants({ selected: view === "grid" })}
      >
        <LayoutGridIcon className="size-4" />
        <Trans i18nKey="pollResultsGridView" defaults="Grid" />
      </Link>
      <Link
        href={`/polls/${pollId}?view=list`}
        aria-current={view === "list" ? "page" : undefined}
        className={pillVariants({ selected: view === "list" })}
      >
        <ListIcon className="size-4" />
        <Trans i18nKey="pollResultsListView" defaults="List" />
      </Link>
    </nav>
  );
}
