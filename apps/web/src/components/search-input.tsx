"use client";

import { cn } from "@rallly/ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@rallly/ui/input-group";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/i18n/client";

export function SearchInput({
  placeholder,
  className,
}: {
  placeholder: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Create a ref for the input element to maintain focus
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Get current search value from URL
  const currentSearchValue = searchParams.get("q") || "";

  // Track input value in state
  const [inputValue, setInputValue] = React.useState(currentSearchValue);

  // Searching covers the debounce wait and the navigation that follows
  const [isDebouncing, setIsDebouncing] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const isSearching = isDebouncing || isPending;

  const updateUrl = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    params.delete("page");

    setIsDebouncing(false);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Debounce URL updates while typing; submitting flushes the pending value
  const pendingValue = React.useRef<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const flushUpdate = () => {
    clearTimeout(timer.current);
    if (pendingValue.current === null) return;
    const value = pendingValue.current;
    pendingValue.current = null;
    updateUrl(value);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsDebouncing(true);
    pendingValue.current = newValue;
    clearTimeout(timer.current);
    timer.current = setTimeout(flushUpdate, 500);
  };

  return (
    <form
      className={cn("w-72", className)}
      onSubmit={(e) => {
        e.preventDefault();
        flushUpdate();
      }}
    >
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          type="search"
          autoFocus={searchParams.get("q") !== null}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
        />
        {isSearching ? (
          <InputGroupAddon align="inline-end">
            <Spinner className="size-4" />
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      <output aria-live="polite" className="sr-only">
        {isSearching ? (
          <Trans i18nKey="searching" defaults="Searching…" />
        ) : null}
      </output>
    </form>
  );
}
