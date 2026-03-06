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
  return (
    <ButtonPrimitive
      className={cn(
        "group",
        buttonVariants({ variant, size }),
        {
          "pointer-events-none": loading,
        },
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2Icon className="size-4 animate-spin opacity-75" />
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
};

Button.displayName = "Button";

export { Button };
