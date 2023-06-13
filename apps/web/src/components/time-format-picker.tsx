import { TimeFormat } from "@rallly/database";
import { cn } from "@rallly/ui";
import React from "react";

import { Trans } from "@/components/trans";

interface TimeFormatPickerProps {
  value: TimeFormat;
  onChange?: (value: TimeFormat) => void;
  disabled?: boolean;
}

const RadioButton = (
  props: React.PropsWithChildren<{ checked?: boolean; onClick?: () => void }>,
) => {
  return (
    <button
      {...props}
      role="radio"
      type="button"
      aria-checked={props.checked}
      className={cn(
        props.checked ? "" : "hover:bg-accent",
        "text-muted-foreground aria-checked:text-foreground grow rounded-none px-2 font-medium aria-checked:bg-white",
      )}
    />
  );
};

const TimeFormatPicker = ({
  disabled,
  value,
  onChange,
}: TimeFormatPickerProps) => {
  return (
    <div
      aria-disabled={disabled}
      role="radiogroup"
      className="inline-flex h-9 divide-x overflow-hidden whitespace-nowrap rounded-md border bg-gray-50 text-sm aria-disabled:pointer-events-none aria-disabled:opacity-50"
    >
      <RadioButton
        onClick={() => {
          onChange?.("hours12");
        }}
        checked={value === "hours12"}
      >
        <Trans i18nKey={"12h"} defaults={"12h"} />
      </RadioButton>
      <RadioButton
        onClick={() => {
          onChange?.("hours24");
        }}
        checked={value === "hours24"}
      >
        <Trans i18nKey={"24h"} defaults={"24h"} />
      </RadioButton>
    </div>
  );
};

export { TimeFormatPicker };
