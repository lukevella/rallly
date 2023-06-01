import { TimeFormat } from "@rallly/database";
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
      className="hover:bg-accent text-muted-foreground aria-checked:text-foreground aria-checked:border-border grow border border-transparent px-1.5 font-medium aria-checked:bg-white aria-checked:shadow-sm"
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
      className="inline-flex h-9 gap-x-1 whitespace-nowrap rounded-md border bg-gray-200/50 p-0.5 text-sm aria-disabled:pointer-events-none aria-disabled:opacity-50"
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
