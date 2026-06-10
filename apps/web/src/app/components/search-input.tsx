"use client";

import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export function SearchInput({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Create a ref for the input element to maintain focus
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Get current search value from URL
  const currentSearchValue = searchParams.get("q") || "";

  // Track input value in state
  const [inputValue, setInputValue] = React.useState(currentSearchValue);

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pendingValueRef = React.useRef<string | null>(null);

  const updateUrl = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    params.delete("page");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle input changes, updating the URL after the user stops typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    pendingValueRef.current = newValue;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      pendingValueRef.current = null;
      updateUrl(newValue);
    }, 500);
  };

  const flushPendingUpdate = () => {
    if (pendingValueRef.current !== null) {
      clearTimeout(timeoutRef.current);
      const value = pendingValueRef.current;
      pendingValueRef.current = null;
      updateUrl(value);
    }
  };

  React.useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <form
      className="relative w-72"
      onSubmit={(e) => {
        e.preventDefault();
        flushPendingUpdate();
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
        <Icon>
          <SearchIcon />
        </Icon>
      </div>
      <Input
        ref={inputRef}
        type="search"
        autoFocus={searchParams.get("q") !== null}
        placeholder={placeholder}
        className="pl-8"
        value={inputValue}
        onChange={handleChange}
      />
    </form>
  );
}
