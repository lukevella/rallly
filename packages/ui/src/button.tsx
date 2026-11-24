"use client";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";

import { buttonVariants } from "./button-variants";
import { cn } from "./lib/utils";

export type { VariantProps };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = ({
  className,
  loading,
  children,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) => {
  const isIconButton = size?.startsWith("icon");
  return (
    <ButtonPrimitive
      className={cn(
        "group",
        buttonVariants({ variant, size }),
        {
          "pointer-events-none": loading,
          "[&_svg:not([data-slot=spinner])]:hidden": loading && isIconButton,
        },
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2Icon
          data-slot="spinner"
          data-icon={isIconButton ? undefined : "inline-start"}
          className="size-4 animate-spin opacity-75"
        />
      ) : null}
      {children}
    </ButtonPrimitive>
  );
};

Button.displayName = "Button";

export { Button };
