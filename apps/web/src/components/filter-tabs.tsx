"use client";

import { cn } from "@rallly/ui";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Link } from "@/components/link";

/**
 * A single-select filter kept in a URL search param, styled like TabsList.
 * Each option is a link, so the selection survives reloads and can be shared.
 */
export function FilterTabs<T extends string>({
  param,
  value,
  options,
  label,
  startTransition = React.startTransition,
}: {
  param: string;
  value: T;
  options: {
    value: T;
    label: React.ReactNode;
  }[];
  label: string;
  // Lets the page observe the navigation, e.g. to show a loading state.
  startTransition?: React.TransitionStartFunction;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // The URL only updates once the server render lands, so mark the clicked
  // pill selected for the duration of the navigation.
  const [selectedValue, setSelectedValue] = React.useOptimistic(value);

  const hrefFor = (optionValue: T) => {
    const params = new URLSearchParams(searchParams);
    params.set(param, optionValue);
    params.delete("page");
    return `?${params.toString()}`;
  };

  return (
    <nav
      aria-label={label}
      className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-control border border-input bg-muted p-0.5 dark:bg-gray-900"
    >
      {options.map((option) => {
        const selected = option.value === selectedValue;
        const href = hrefFor(option.value);
        return (
          <Link
            key={option.value}
            href={href}
            replace
            scroll={false}
            onNavigate={(e) => {
              e.preventDefault();
              startTransition(() => {
                setSelectedValue(option.value);
                router.replace(href, { scroll: false });
              });
            }}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-full items-center whitespace-nowrap rounded-control-sm px-3 text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-card text-foreground shadow-xs dark:bg-gray-800"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
