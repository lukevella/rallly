"use client";
import { buttonVariants, cn } from "@rallly/ui";
import { Checkbox } from "@rallly/ui/checkbox";
import * as React from "react";
import { Trans } from "@/i18n/client";

/**
 * Hides options that have already passed.
 *
 * A checkbox inside a button shell: `Checkbox` renders a native button of
 * its own, so it cannot be nested in another one. A label wraps it instead
 * and carries the button styling, which keeps the primitive's own box and
 * check mark and leaves the whole control clickable.
 */
export function HidePastToggle({
  checked,
  onCheckedChange,
  isTimeSlot,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  isTimeSlot: boolean;
}) {
  const id = React.useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "cursor-pointer gap-2 font-normal",
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      {isTimeSlot ? (
        <Trans i18nKey="hidePastTimes" defaults="Hide past times" />
      ) : (
        <Trans i18nKey="hidePastDates" defaults="Hide past dates" />
      )}
    </label>
  );
}
