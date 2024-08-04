"use client";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "./lib/utils";
import React from "react";

const infoCardVariants = cva("rounded-lg border p-0.5 shadow-sm", {
  variants: {
    color: {
      green: "border-green-400/20 bg-green-200/15 text-green-800/90",
      gray: "border-gray-400/20 bg-gray-50 text-gray-800/90 to-gray-50",
    },
  },
});

export function InfoCardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

export function InfoCard({
  children,
  className,
  title,
  color = "gray",
}: {
  children?: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
} & VariantProps<typeof infoCardVariants>) {
  return (
    <div className={cn(infoCardVariants({ color }), className)}>
      {title ? (
        <div
          className={cn("flex items-center gap-x-2 rounded-md px-4 py-3", {
            "bg-gray-500/10": color === "gray",
            "bg-green-600/10": color === "green",
          })}
        >
          <h2 className="text-sm font-medium text-opacity-90">{title}</h2>
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </div>
  );
}
