"use client";

import { Slot } from "@radix-ui/react-slot";
import Link from "next/link";
import * as React from "react";

import { cn } from "./lib/utils";

const Tile = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, children, ...props }, ref) => (
  <Link
    ref={ref}
    className={cn(
      "bg-card text-card-foreground hover:bg-accent/50 rounded-lg border p-4",
      className,
    )}
    {...props}
  >
    {children}
  </Link>
));
Tile.displayName = "Tile";

const TileIcon = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <Slot
    ref={ref}
    className={cn("text-muted-foreground mb-3 size-4", className)}
    {...props}
  >
    {children}
  </Slot>
));
TileIcon.displayName = "TileIcon";

const TileTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-sm font-medium", className)} {...props} />
));
TileTitle.displayName = "TileTitle";

const TileDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground text-center text-sm", className)}
    {...props}
  />
));
TileDescription.displayName = "TileDescription";

const TileGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}
    {...props}
  />
));
TileGrid.displayName = "TileGrid";

export { Tile, TileDescription, TileGrid, TileIcon, TileTitle };
