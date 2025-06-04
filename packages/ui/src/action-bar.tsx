import * as Portal from "@radix-ui/react-portal";
import * as React from "react";

import { cn } from "./lib/utils";

const ACTION_BAR_PORTAL_ID = "action-bar-portal";

const ActionBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "pointer-events-none sticky bottom-8 flex justify-center pb-5",
      className,
    )}
    id={ACTION_BAR_PORTAL_ID}
    {...props}
  />
));
ActionBar.displayName = "ActionBar";

const ActionBarPortal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Portal.Root
    container={document.getElementById(ACTION_BAR_PORTAL_ID)}
    ref={ref}
    className={className}
    {...props}
  />
));
ActionBarPortal.displayName = "ActionBarPortal";

const ActionBarContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "-translate-x-1/2 pointer-events-auto fixed bottom-16 left-[calc(50vw+var(--sidebar-width)/2)] z-50 inline-flex items-center gap-4 rounded-xl bg-action-bar p-2 text-action-bar-foreground shadow-lg",
        className,
      )}
      {...props}
    />
  );
});
ActionBarContainer.displayName = "ActionBarContainer";

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

export {
  ActionBar,
  ActionBarContainer,
  ActionBarContent,
  ActionBarGroup,
  ActionBarPortal,
};
