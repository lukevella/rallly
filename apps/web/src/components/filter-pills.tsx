"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Link } from "@/components/link";
import { pillVariants } from "@/components/pill-variants";

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
    <nav aria-label={label} className="flex items-center gap-1">
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
              React.startTransition(() => {
                setSelectedValue(option.value);
                router.replace(href, { scroll: false });
              });
            }}
            aria-current={selected ? "page" : undefined}
            className={pillVariants({ selected })}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
