"use client";

import { SelectProps } from "@radix-ui/react-select";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rallly/ui/command";
import { useDialog } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import { CheckIcon, GlobeIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import React from "react";

import { Trans } from "@/components/trans";
import { groupedTimeZones } from "@/utils/grouped-time-zone";

interface TimeZoneCommandProps {
  value?: string;
  onSelect?: (value: string) => void;
}

export const TimeZoneCommand = ({ onSelect, value }: TimeZoneCommandProps) => {
  const { t } = useTranslation();
  return (
    <Command>
      <CommandInput
        placeholder={t("timeZoneSelect__inputPlaceholder", {
          defaultValue: "Search…",
        })}
      />
      <CommandList className="max-h-[300px] w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-content-available-width)] overflow-y-auto">
        <CommandEmpty>
          <Trans
            i18nKey="timeZoneSelect__noOption"
            defaults="No option found"
          />
        </CommandEmpty>
        {Object.entries(groupedTimeZones).map(([region, timeZones]) => (
          <CommandGroup heading={region} key={region}>
            {timeZones.map(({ timezone, city }) => {
              return (
                <CommandItem
                  key={timezone}
                  onSelect={() => onSelect?.(timezone)}
                  className="flex min-w-0 gap-x-2.5"
                >
                  <CheckIcon
                    className={cn(
                      "size-4 shrink-0",
                      value === timezone ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 grow truncate">{city}</span>
                  <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {dayjs().tz(timezone).format("LT")}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
};

export const TimeZoneSelect = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onValueChange, disabled }, ref) => {
    const dialog = useDialog();
    return (
      <>
        <CommandDialog {...dialog.dialogProps}>
          <TimeZoneCommand
            value={value}
            onSelect={(newValue) => {
              onValueChange?.(newValue);
              dialog.dismiss();
            }}
          />
        </CommandDialog>
        <Button
          ref={ref}
          disabled={disabled}
          onClick={() => {
            dialog.trigger();
          }}
        >
          <Icon>
            <GlobeIcon />
          </Icon>
          {value}
        </Button>
      </>
    );
  },
);

TimeZoneSelect.displayName = "TimeZoneSelect";
