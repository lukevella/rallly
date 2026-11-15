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
  startTransition: startNavigation = React.startTransition,
}: {
  placeholder: string;
  className?: string;
  // Lets the page observe the navigation, e.g. to show a loading state.
  startTransition?: React.TransitionStartFunction;
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

  // Debounce URL updates while typing; submitting flushes the pending value
  const pendingValue = React.useRef<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPushedValue = React.useRef(currentSearchValue);

  const updateUrl = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    params.delete("page");

    lastPushedValue.current = value;
    setIsDebouncing(false);
    startTransition(() => {
      startNavigation(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    });
  };

  // A URL change this input didn't make (e.g. the command menu) wins over
  // any edit still waiting on the debounce
  React.useEffect(() => {
    if (currentSearchValue === lastPushedValue.current) return;
    lastPushedValue.current = currentSearchValue;
    clearTimeout(timer.current);
    pendingValue.current = null;
    setIsDebouncing(false);
    setInputValue(currentSearchValue);
  }, [currentSearchValue]);

  // A pending edit must not navigate back here after the user has left.
  // Layout cleanup runs in the unmount commit, before the timer can fire.
  React.useLayoutEffect(() => () => clearTimeout(timer.current), []);

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
