import * as React from "react";

import { cn } from "./lib/utils";

const ActionBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ className, open, onOpenChange, ...props }, ref) => {
  return (
    <div
      role="dialog"
      aria-modal={open}
      aria-labelledby="action-bar-title"
      data-state={open ? "open" : "closed"}
      ref={ref}
      className={cn(
        {
          "opacity-0": !open,
          "opacity-100": open,
        },
        "-translate-x-1/2 pointer-events-auto fixed bottom-16 left-1/2 z-50 inline-flex items-center gap-4 rounded-xl border bg-action-bar p-2 text-action-bar-foreground shadow-lg md:left-[calc(50vw+var(--sidebar-width)/2)]",
        className,
      )}
      {...props}
    />
  );
});
ActionBar.displayName = "ActionBar";

const ActionBarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-2.5", className)}
    {...props}
  />
));
ActionBarContent.displayName = "ActionBarContent";

const ActionBarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
));
ActionBarGroup.displayName = "ActionBarGroup";

export { ActionBar, ActionBarContent, ActionBarGroup };
