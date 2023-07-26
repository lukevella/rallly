import { SelectProps } from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, GlobeIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@rallly/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { CommandList } from "cmdk";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import React from "react";

import { Trans } from "@/components/trans";

import timeZones from "./time-zones.json";

const options = Object.entries(timeZones).map(([value, label]) => ({
  value,
  label,
}));

export { timeZones };

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
      <CommandList className="max-h-[300px] max-w-[var(--radix-popover-content-available-width)] overflow-y-auto">
        <CommandEmpty>
          <Trans
            i18nKey="timeZoneSelect__noOption"
            defaults="No option found"
          />
        </CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const min = dayjs().tz(option.value).utcOffset();
            const hr =
              `${(min / 60) ^ 0}:` +
              (min % 60 === 0 ? "00" : Math.abs(min % 60));
            const offset = `GMT${hr.includes("-") ? hr : `+${hr}`}`;
            return (
              <CommandItem
                key={option.value}
                onSelect={() => onSelect?.(option.value)}
                className="flex min-w-0 gap-x-2.5"
              >
                <CheckIcon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    value === option.value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 grow truncate">{option.label}</span>
                <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {offset}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export const TimeZoneSelect = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onValueChange, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const popoverContentId = "timeZoneSelect__popoverContent";

    return (
      <Popover modal={false} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild={true}>
          <button
            ref={ref}
            disabled={disabled}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={popoverContentId}
            className="bg-input-background flex h-9 w-full min-w-0 items-center gap-x-1.5 rounded-md border px-2 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GlobeIcon className="h-4 w-4" />
            <span className="grow truncate text-left">
              {value ? (
                options.find((option) => option.value === value)?.label
              ) : (
                <Trans
                  i18nKey="timeZoneSelect__defaultValue"
                  defaults="Select time zone…"
                />
              )}
            </span>
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          id={popoverContentId}
          align="start"
          className="z-[1000] max-w-[var(--radix-popover-trigger-width)] bg-white p-0"
        >
          <TimeZoneCommand
            value={value}
            onSelect={(newValue) => {
              onValueChange?.(newValue);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

TimeZoneSelect.displayName = "TimeZoneSelect";
