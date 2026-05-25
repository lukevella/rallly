import * as React from "react";
import { cn } from "./lib/utils";

const ActionBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-25% from-gray-100/50 to-transparent dark:from-gray-900",
      className,
    )}
    {...props}
  >
    <div className="pointer-events-auto mx-auto flex max-w-xl items-center justify-center gap-3 px-4 pt-12 pb-[max(--spacing(10),env(safe-area-inset-bottom))]">
      {children}
    </div>
  </div>
));
ActionBar.displayName = "ActionBar";

const ActionBarSpacer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1", className)} {...props} />
));
ActionBarSpacer.displayName = "ActionBarSpacer";

const ActionBarOffset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden
    className={cn(
      "h-[calc(--spacing(12)+max(--spacing(8),env(safe-area-inset-bottom)))]",
      className,
    )}
    {...props}
  />
));
ActionBarOffset.displayName = "ActionBarOffset";

export { ActionBar, ActionBarOffset, ActionBarSpacer };
