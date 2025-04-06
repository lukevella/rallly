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
      "text-card-foreground flex flex-col justify-end rounded-xl bg-gray-100 p-3 hover:bg-gray-200",
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
  <span
    className={cn(
      "bg-primary mb-3 inline-flex size-8 items-center justify-center rounded-lg text-white",
      className,
    )}
  >
    <Slot ref={ref} className="size-4" {...props}>
      {children}
    </Slot>
  </span>
));
TileIcon.displayName = "TileIcon";

const TileTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-sm", className)} {...props} />
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
    className={cn(
      "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      className,
    )}
    {...props}
  />
));
TileGrid.displayName = "TileGrid";

export { Tile, TileDescription, TileGrid, TileIcon, TileTitle };
