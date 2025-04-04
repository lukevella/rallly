"use client";

import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import debounce from "lodash/debounce";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Create a ref for the input element to maintain focus
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Get current search value from URL
  const currentSearchValue = searchParams.get("q") || "";

  // Track input value in state
  const [inputValue, setInputValue] = React.useState(currentSearchValue);

  // Create a debounced function to update the URL
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateUrl = React.useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      params.delete("page");

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 500),
    [pathname, router, searchParams],
  );

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    debouncedUpdateUrl(newValue);
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon>
          <SearchIcon />
        </Icon>
      </div>
      <Input
        ref={inputRef}
        type="search"
        autoFocus={searchParams.get("q") !== null}
        placeholder="Search polls by title..."
        className="pl-10"
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
}
