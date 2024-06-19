"use client";

import * as Primitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "./lib/utils";

const RadioPills = React.forwardRef<
  React.ElementRef<typeof Primitive.Root>,
  React.ComponentPropsWithoutRef<typeof Primitive.Root>
>(({ className, ...props }, ref) => (
  <Primitive.Root
    ref={ref}
    className={cn("display flex items-center gap-x-2", className)}
    {...props}
  />
));

const RadioPillsItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(
      "text-muted-foreground data-[state=checked]:text-primary data-[state=checked]:border-primary data-[state=unchecked]:hover:text-foreground h-8 rounded-full border px-3 text-sm font-medium",
      className,
    )}
    {...props}
  />
));
RadioPillsItem.displayName = Primitive.Item.displayName;

export { RadioPills as RadioCards, RadioPillsItem as RadioCardsItem };
