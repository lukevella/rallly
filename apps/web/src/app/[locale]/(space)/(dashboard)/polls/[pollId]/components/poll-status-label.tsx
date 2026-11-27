import { cn } from "@rallly/ui";
import { Trans } from "@/i18n/client";

const tones = {
  open: "bg-green-500 ring-green-500/20",
  scheduled: "bg-primary ring-primary/20",
  closed: "bg-muted-foreground/60 ring-muted-foreground/15",
} as const;

/** The poll's status beside its title: a coloured dot and the word. */
export function PollStatusLabel({
  status,
}: {
  status: "open" | "closed" | "scheduled" | "canceled";
}) {
  if (status === "canceled") {
    return null;
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-muted-foreground text-sm">
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full ring-[3px]", tones[status])}
      />
      {status === "open" ? (
        <Trans i18nKey="pollStatusOpen" defaults="Open" />
      ) : status === "closed" ? (
        <Trans i18nKey="pollStatusClosed" defaults="Closed" />
      ) : (
        <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
      )}
    </span>
  );
}
