import * as Portal from "@radix-ui/react-portal";
import * as React from "react";

import { cn } from "./lib/utils";

const ACTION_BAR_PORTAL_ID = "action-bar-portal";

const ActionBarPortal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    id={ACTION_BAR_PORTAL_ID}
    className={cn(
      "pointer-events-none sticky bottom-12 z-50 flex justify-center",
      className,
    )}
    {...props}
  />
));
ActionBarPortal.displayName = "ActionBarPortal";

const ActionBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <Portal.Root container={document.getElementById(ACTION_BAR_PORTAL_ID)}>
      <div
        ref={ref}
        className={cn(
          "bg-action-bar text-action-bar-foreground pointer-events-auto flex max-w-2xl flex-1 items-center gap-4 rounded-xl p-2 shadow-lg",
          className,
        )}
        {...props}
      />
    </Portal.Root>
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

export { ActionBar, ActionBarContent, ActionBarGroup, ActionBarPortal };
