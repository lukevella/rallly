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

/** A filled green disc with a white tick that draws in under SuccessCheck. */
function SuccessCheckIcon({ className }: { className?: string }) {
  return (
    <span
      data-slot="success-check-icon"
      className={cn(
        "flex size-12 items-center justify-center rounded-full bg-green-500 text-white shadow-green-500/30 shadow-md",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-1/2"
      >
        <title>Success</title>
        <path d="M14 25l7 7 13-15" pathLength={20} />
      </svg>
    </span>
  );
}

export { SuccessCheck, SuccessCheckIcon };
