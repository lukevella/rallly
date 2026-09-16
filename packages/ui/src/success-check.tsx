import type * as React from "react";

import { cn } from "./lib/utils";

/**
 * Appear transition for a success icon: fade, rotate, blur and a Y bob on
 * the wrapper, and a stroke draw on any SVG <path> inside (give the path
 * pathLength={20}). Sizing and colour belong to the icon. Styles live in
 * the shared stylesheet under `.t-success-check`.
 */
function SuccessCheck({
  state,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  /** "out" is invisible with no animation; "in" plays the transition. */
  state: "in" | "out";
}) {
  return (
    <span
      data-slot="success-check"
      data-state={state}
      aria-hidden="true"
      className={cn("t-success-check", className)}
      {...props}
    >
      {children}
    </span>
  );
}

/** A circled check whose tick draws in under SuccessCheck. */
function SuccessCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <title>Success</title>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" pathLength={20} />
    </svg>
  );
}

export { SuccessCheck, SuccessCheckIcon };
