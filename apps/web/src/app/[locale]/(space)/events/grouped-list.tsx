"use client";

import { cn } from "@rallly/ui";
import * as React from "react";

export const GroupedList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-y-6", className)} // Apply spacing between items
    {...props}
  />
));
GroupedList.displayName = "GroupedList";

export const GroupedListItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} /> // Simple container
));
GroupedListItem.displayName = "GroupedListItem";

export const GroupedListHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-muted-foreground mb-2 text-sm font-medium", className)} // Apply styling
    {...props}
  />
));
GroupedListHeader.displayName = "GroupedListHeader";

export const GroupedListContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} /> // Simple container
));
GroupedListContent.displayName = "GroupedListContent";
