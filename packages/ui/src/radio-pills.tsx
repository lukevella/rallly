"use client";

import * as Primitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "./lib/utils";

const RadioCards = React.forwardRef<
  React.ElementRef<typeof Primitive.Root>,
  React.ComponentPropsWithoutRef<typeof Primitive.Root>
>(({ className, ...props }, ref) => (
  <Primitive.Root
    ref={ref}
    className={cn("display flex items-center gap-x-2", className)}
    {...props}
  />
));

const RadioCardsItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(
      "text-muted-foreground data-[state=checked]:text-primary data-[state=checked]:border-primary h-8 rounded-full border px-3 text-sm font-medium",
      className,
    )}
    {...props}
  />
));
RadioCardsItem.displayName = Primitive.Item.displayName;

export { RadioCards, RadioCardsItem };
