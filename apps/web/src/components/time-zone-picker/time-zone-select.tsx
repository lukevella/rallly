import { SelectProps } from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@rallly/icons";
import { CommandList } from "cmdk";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import React from "react";

import { Trans } from "@/components/trans";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import timeZones from "./time-zones.json";

const options = Object.entries(timeZones).map(([value, label]) => ({
  value,
  label,
}));

export const TimeZoneSelect = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onValueChange, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const { t } = useTranslation();
    const popoverContentId = "timeZoneSelect__popoverContent";

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild={true}>
          <button
            ref={ref}
            disabled={disabled}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={popoverContentId}
            className="bg-input-background flex h-10 w-full items-center justify-between rounded border px-3 py-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {value ? (
              options.find((option) => option.value === value)?.label
            ) : (
              <Trans
                i18nKey="timeZoneSelect__defaultValue"
                defaults="Select time zone…"
              />
            )}
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          id={popoverContentId}
          align="start"
          className="w-[var(--radix-popover-trigger-width)] bg-white p-0"
        >
          <Command>
            <CommandInput
              placeholder={t("timeZoneSelect__inputPlaceholder", {
                defaultValue: "Search…",
              })}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                <Trans
                  i18nKey="timeZoneSelect__noOption"
                  defaults="No option found"
                />
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onValueChange?.(option.value);
                      setOpen(false);
                    }}
                    className="flex"
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="grow">{option.label}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {dayjs().tz(option.value).format("LT")}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

TimeZoneSelect.displayName = "TimeZoneSelect";
