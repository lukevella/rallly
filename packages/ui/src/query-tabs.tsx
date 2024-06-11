"use client";

import * as Primitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "./lib/utils";

const QueryTabs = Primitive.Root;

const QueryTabsList = React.forwardRef<
  React.ElementRef<typeof Primitive.List>,
  React.ComponentPropsWithoutRef<typeof Primitive.List>
>(({ className, ...props }, ref) => (
  <Primitive.List
    ref={ref}
    className={cn("flex gap-1", className)}
    {...props}
  />
));
QueryTabsList.displayName = Primitive.List.displayName;

const QueryTabsTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(({ className, ...props }, ref) => (
  <Primitive.Trigger
    ref={ref}
    className={cn(
      "text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-primary  h-8 rounded-full border px-3 text-sm font-medium",
      className,
    )}
    {...props}
  />
));
QueryTabsTrigger.displayName = Primitive.Trigger.displayName;

const QueryTabsContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, ...props }, ref) => (
  <Primitive.Content ref={ref} className={cn(className)} {...props} />
));
QueryTabsContent.displayName = Primitive.Content.displayName;

export { QueryTabs, QueryTabsContent, QueryTabsList, QueryTabsTrigger };
