import { cn } from "@rallly/ui";
import type { useOptions } from "@/features/poll/components/poll-context";
import VoteIcon from "../vote-icon";
import { voteTint } from "./vote-tint";

type Option = ReturnType<typeof useOptions>["options"][number];

/**
 * One participant's answer for one option: the answer's mark on a tile
 * tinted with its colour. Hovering reveals the option's time (or date, on a
 * date poll), so a cell can be read without tracing back up to the header.
 */
export function VoteTile({
  vote,
  option,
}: {
  vote?: "yes" | "ifNeedBe" | "no";
  option?: Option;
}) {
  const label = option
    ? option.type === "timeSlot"
      ? option.startTime
      : `${option.dow} ${option.day}`
    : null;

  return (
    <div className="group/tile flex items-center justify-center px-1">
      <div
        className={cn(
          "flex h-9 w-full items-center justify-center whitespace-nowrap rounded-sm px-1.5 text-muted-foreground text-xs",
          vote
            ? voteTint[vote]
            : "bg-gray-500/5 ring-1 ring-gray-500/15 ring-inset dark:bg-white/5 dark:ring-white/8",
        )}
      >
        {/* Revealed on hover, sliding the mark aside, so the grid stays
            quiet until a cell is looked at. */}
        {label ? (
          <span
            aria-hidden="true"
            className="max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin] duration-200 ease-out group-hover/tile:mr-1 group-hover/tile:max-w-20 group-hover/tile:opacity-100 motion-reduce:transition-none"
          >
            {label}
          </span>
        ) : null}
        <VoteIcon type={vote} glyph />
      </div>
    </div>
  );
}
