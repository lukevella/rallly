"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@rallly/ui";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: number;
  }
>(({ className, size = 48, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      className,
    )}
    style={{ width: size, height: size }}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const colorPairs = [
  { bg: "#E6F4FF", text: "#0065BD" }, // Light blue
  { bg: "#DCFCE7", text: "#15803D" }, // Light green
  { bg: "#FFE6F4", text: "#BD007A" }, // Light pink
  { bg: "#F4E6FF", text: "#6200BD" }, // Light purple
  { bg: "#FFE6E6", text: "#BD0000" }, // Light red
  { bg: "#FFE6FF", text: "#A300A3" }, // Bright pink
  { bg: "#F0E6FF", text: "#5700BD" }, // Lavender
  { bg: "#FFE6F9", text: "#BD0066" }, // Rose
  { bg: "#E6E6FF", text: "#0000BD" }, // Periwinkle
  { bg: "#FFE6EC", text: "#BD001F" }, // Salmon pink
  { bg: "#EBE6FF", text: "#4800BD" }, // Light indigo
];

export function getColor(seed: string): {
  bgColor: string;
  textColor: string;
} {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorPair = colorPairs[Math.abs(hash) % colorPairs.length];
  return { bgColor: colorPair.bg, textColor: colorPair.text };
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    seed: string;
  }
>(({ className, seed, ...props }, ref) => {
  const { bgColor, textColor } = getColor(seed);
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full font-medium",
        className,
      )}
      style={{ backgroundColor: bgColor, color: textColor }}
      {...props}
    />
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
