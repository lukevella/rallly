"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { XIcon } from "lucide-react";
import React from "react";
import { buttonVariants } from "./button-variants";
import { cn } from "./lib/utils";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

export type DialogProps = Omit<
  DialogPrimitive.Root.Props,
  "children" | "onOpenChange"
> & {
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
};

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm data-closed:animate-out data-open:animate-in",
        className,
      )}
      {...props}
    />
  );
}

const dialogVariants = cva(
  cn(
    "data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 relative my-auto flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-popover-border bg-popover shadow-lg outline-none duration-200 data-closed:animate-out data-open:animate-in",
  ),
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
        "3xl": "sm:max-w-3xl",
        "4xl": "sm:max-w-4xl",
        "5xl": "sm:max-w-5xl",
        "6xl": "sm:max-w-6xl",
        "7xl": "sm:max-w-7xl",
      },
    },
  },
);

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "md",
  fullScreenOnMobile = false,
  ...props
}: DialogPrimitive.Popup.Props &
  VariantProps<typeof dialogVariants> & {
    showCloseButton?: boolean;
    /**
     * Below the `sm` breakpoint the dialog fills the viewport and a short
     * dialog's footer sits on the bottom edge. Use for form dialogs, not
     * confirmations.
     */
    fullScreenOnMobile?: boolean;
  }) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      {/* A dialog taller than the screen scrolls as one card inside the
          viewport rather than scrolling its own content. */}
      <DialogPrimitive.Viewport
        data-slot="dialog-viewport"
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain p-4",
          fullScreenOnMobile && "max-sm:p-0",
        )}
      >
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            dialogVariants({ size }),
            fullScreenOnMobile &&
              "max-sm:my-0 max-sm:min-h-dvh max-sm:rounded-none max-sm:border-0",
            className,
          )}
          data-close-button={showCloseButton ? "" : undefined}
          {...props}
        >
          <div
            data-slot="dialog-scroller"
            className={cn(
              "grid gap-4 p-4",
              fullScreenOnMobile &&
                "max-sm:flex max-sm:grow max-sm:flex-col max-sm:*:data-[slot=dialog-footer]:mt-auto! max-sm:*:data-[slot=dialog-footer]:pb-[max(0.75rem,env(safe-area-inset-bottom))]!",
            )}
          >
            {children}
          </div>
          {showCloseButton && (
            <DialogClose
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "absolute top-2 right-2 z-20 max-sm:top-1 max-sm:right-1 max-sm:size-10",
              )}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "dialog-edge:pb-2",
        // Only the first row sits beside the close button.
        "dialog-edge:in-data-close-button:*:first:pr-10",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        "dialog-edge:-mx-4 dialog-edge:mt-2 dialog-edge:-mb-4 dialog-edge:border-popover-border dialog-edge:border-t dialog-edge:bg-card dialog-edge:px-4 dialog-edge:py-3",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-medium text-base text-foreground tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "mt-0.5 text-pretty text-muted-foreground text-sm leading-normal",
        className,
      )}
      {...props}
    />
  );
}

function useDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  function trigger() {
    setIsOpen(true);
  }

  function dismiss() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return {
    triggerProps: {
      ref: triggerRef,
      onClick: trigger,
    },
    dialogProps: {
      open: isOpen,
      onOpenChange: (open: boolean) => {
        if (open) trigger();
        else dismiss();
      },
    },
    trigger,
    dismiss,
  };
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  useDialog,
};
