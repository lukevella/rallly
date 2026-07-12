"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { cn } from "./lib/utils";

function Tile({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "relative flex flex-col justify-end rounded-xl bg-card p-3 text-card-foreground ring-1 ring-button-outline ring-inset transition-transform hover:bg-card-accent active:translate-y-0.5",
          className,
        ),
      },
      props,
    ),
    state: {
      slot: "tile",
    },
  });
}

const TileTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("mt-3 text-sm", className)} {...props} />
));
TileTitle.displayName = "TileTitle";

const TileDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "pointer-events-none absolute top-3 right-3 text-muted-foreground text-sm",
      className,
    )}
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
    className={cn("grid gap-4 md:grid-cols-3 2xl:grid-cols-4", className)}
    {...props}
  />
));
TileGrid.displayName = "TileGrid";

export { Tile, TileDescription, TileGrid, TileTitle };
