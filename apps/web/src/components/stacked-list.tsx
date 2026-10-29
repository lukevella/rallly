"use client";

import { cn } from "@rallly/ui";
import React from "react";

type StackedListVariant = "default" | "plain";

const StackedListVariantContext =
  React.createContext<StackedListVariant>("default");

// "plain" drops the frame so the list can sit inside a card.
export function StackedList({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: StackedListVariant;
}) {
  return (
    <StackedListVariantContext.Provider value={variant}>
      <ul
        className={cn(
          "divide-y",
          variant === "default" &&
            "overflow-hidden rounded-xl border border-card-border bg-card/25",
          className,
        )}
      >
        {children}
      </ul>
    </StackedListVariantContext.Provider>
  );
}

export function StackedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const variant = React.useContext(StackedListVariantContext);
  return (
    <li
      className={cn(
        "flex items-center gap-x-6",
        variant === "default"
          ? "p-4 hover:bg-card-accent"
          : "py-4 first:pt-0 last:pb-0",
        className,
      )}
    >
      {children}
    </li>
  );
}
