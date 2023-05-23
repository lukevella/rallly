"use client";

import { CheckIcon, ChevronDownIcon } from "@rallly/icons";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { Button } from "@/components/button";
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

interface ComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  options: { label: React.ReactNode; value: string }[];
}

export function Combobox({ value, onChange, options }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          role="combobox"
          aria-expanded={open}
          className="w-[200px]"
        >
          {value ? (
            options.find((option) => option.value === value)?.label
          ) : (
            <Trans i18nKey="combobox_defaultValue" defaults="Select…" />
          )}
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full bg-white p-0">
        {/* <Command>
          <CommandInput placeholder={t("combobox_inputPlaceholder", {
            defaultValue: "Search…",
          })} />
          <CommandEmpty>
            <Trans i18nKey="combobox_noOption" defaults="No option found" />
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={(currentValue) => {
                  onChange?.(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0",
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command> */}
      </PopoverContent>
    </Popover>
  );
}
