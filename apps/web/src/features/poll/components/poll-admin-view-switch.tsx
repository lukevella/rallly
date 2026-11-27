"use client";

import { cn } from "@rallly/ui";
import { useRouter } from "next/navigation";
import { Trans } from "@/i18n/client";
import { setPollAdminView } from "@/lib/poll-admin-view-client";

/**
 * Turns the new poll admin on or off for this browser, from either admin,
 * and takes the host to the poll in the view they picked. A ghost button,
 * first among each header's actions, with a small track as the on/off
 * indicator rather than a full switch.
 */
export function PollAdminViewSwitch({
  pollId,
  checked,
}: {
  pollId: string;
  /** Whether this is the new admin */
  checked: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        const next = !checked;
        setPollAdminView({ view: next ? "new" : "legacy", pollId });
        router.push(next ? `/polls/${pollId}` : `/poll/${pollId}`);
      }}
      className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full pr-3 pl-3.5 text-muted-foreground text-xs outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Trans i18nKey="pollAdminTryNewView" defaults="Try the new view" />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-3 w-5 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-green-500" : "bg-foreground/15",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full transition-transform motion-reduce:transition-none",
            checked ? "translate-x-2 bg-white" : "bg-background",
          )}
        />
      </span>
    </button>
  );
}
