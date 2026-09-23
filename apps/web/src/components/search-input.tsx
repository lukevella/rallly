"use client";

import { cn } from "@rallly/ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@rallly/ui/input-group";
import debounce from "lodash/debounce";
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

  // Create a debounced function to update the URL
  // biome-ignore lint/correctness/useExhaustiveDependencies: Fix this later
  const debouncedUpdateUrl = React.useCallback(
    debounce((value: string) => {
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
    }, 500),
    [pathname, router, searchParams],
  );

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsDebouncing(true);
    debouncedUpdateUrl(newValue);
  };

  return (
    <form
      className={cn("w-72", className)}
      onSubmit={(e) => {
        e.preventDefault();
        debouncedUpdateUrl.flush();
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
