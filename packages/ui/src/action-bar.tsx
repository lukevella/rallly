"use client";

import { Toolbar } from "@base-ui/react/toolbar";
import type { VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";
import { buttonVariants } from "./button-variants";
import { cn } from "./lib/utils";

function ActionBar({ className, children, ...props }: Toolbar.Root.Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-25% from-gray-100/50 to-transparent dark:from-gray-900">
      <Toolbar.Root
        data-slot="action-bar"
        className={cn(
          "pointer-events-auto mx-auto flex max-w-xl items-center justify-center gap-3 px-4 pt-12 pb-[max(--spacing(4),env(safe-area-inset-bottom))] sm:pb-[max(--spacing(8),env(safe-area-inset-bottom))]",
          className,
        )}
        {...props}
      >
        {children}
      </Toolbar.Root>
    </div>
  );
}

function ActionBarButton({
  className,
  variant,
  size = "lg",
  loading,
  disabled,
  children,
  ...props
}: Toolbar.Button.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <Toolbar.Button
      data-slot="action-bar-button"
      className={cn(
        "group",
        buttonVariants({ variant, size }),
        { "pointer-events-none": loading },
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2Icon
          data-icon="inline-start"
          className="size-4 animate-spin opacity-75"
        />
      ) : null}
      {children}
    </Toolbar.Button>
  );
}

function ActionBarSpacer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1", className)} {...props} />;
}

function ActionBarOffset({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-[calc(--spacing(12)+max(--spacing(6),env(safe-area-inset-bottom)))] sm:h-[calc(--spacing(12)+max(--spacing(12),env(safe-area-inset-bottom)))]",
        className,
      )}
      {...props}
    />
  );
}

export { ActionBar, ActionBarButton, ActionBarOffset, ActionBarSpacer };
