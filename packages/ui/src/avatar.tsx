"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@rallly/ui";
import * as React from "react";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: number;
  }
>(({ className, size = 48, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex shrink-0 overflow-hidden", className)}
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

const synthwaveGradients = [
  { from: "#FF36F5", to: "#FF36F5CC" }, // Vibrant Pink to Transparent Pink
  { from: "#B026FF", to: "#B026FFCC" }, // Vibrant Purple to Transparent Purple
  { from: "#FF2182", to: "#FF2182CC" }, // Hot Pink to Transparent Hot Pink
  { from: "#9D4EDD", to: "#9D4EDDCC" }, // Bright Purple to Transparent Bright Purple
  { from: "#7B2CBF", to: "#7B2CBFCC" }, // Deep Purple to Transparent Deep Purple
  { from: "#F72585", to: "#F72585CC" }, // Vibrant Pink to Transparent Vibrant Pink
  { from: "#4361EE", to: "#4361EECC" }, // Bright Blue to Transparent Bright Blue
  { from: "#FF0099", to: "#FF0099CC" }, // Neon Pink to Transparent Neon Pink
  { from: "#6A00F4", to: "#6A00F4CC" }, // Electric Purple to Transparent Electric Purple
  { from: "#D100D1", to: "#D100D1CC" }, // Magenta to Transparent Magenta
  { from: "#FF61C3", to: "#FF61C3CC" }, // Bright Pink to Transparent Bright Pink
];

export function getGradient(seed: string): {
  fromColor: string;
  toColor: string;
} {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradient =
    synthwaveGradients[Math.abs(hash) % synthwaveGradients.length];
  return { fromColor: gradient.from, toColor: gradient.to };
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    seed: string;
  }
>(({ className, seed, ...props }, ref) => {
  const { fromColor, toColor } = getGradient(seed);
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center font-medium",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`,
        color: "white",
      }}
      {...props}
    />
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarFallback, AvatarImage };
