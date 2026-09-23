"use client";

import { cn } from "@rallly/ui";
import { useSearchParams } from "next/navigation";
import { Link } from "@/components/link";

/**
 * A single-select filter kept in a URL search param. Each option is a link,
 * so the selection survives reloads and can be shared.
 */
export function FilterPills<T extends string>({
  param,
  value,
  options,
  label,
}: {
  param: string;
  value: T;
  options: {
    value: T;
    label: React.ReactNode;
  }[];
  label: string;
}) {
  const searchParams = useSearchParams();

  const hrefFor = (optionValue: T) => {
    const params = new URLSearchParams(searchParams);
    params.set(param, optionValue);
    params.delete("page");
    return `?${params.toString()}`;
  };

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Link
            key={option.value}
            href={hrefFor(option.value)}
            replace
            scroll={false}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm ring-1 ring-transparent ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-white text-sidebar-accent-foreground ring-button-outline dark:bg-muted"
                : "text-muted-foreground hover:bg-white dark:hover:bg-muted",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
