import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { cn } from "./lib/utils";

interface ActionBarProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    "open" | "onOpenChange"
  > {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const ActionBar = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  ActionBarProps
>(({ open, onOpenChange, children, className, ...props }, ref) => {
  return (
    <DialogPrimitive.Root modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Content
        ref={ref}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "-translate-x-1/2 pointer-events-auto fixed bottom-8 left-1/2 z-50 inline-flex items-center gap-4 rounded-xl border bg-action-bar p-2 text-action-bar-foreground shadow-lg transition-transform duration-200 ease-out data-[state=closed]:translate-y-full data-[state=open]:translate-y-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 md:bottom-16 md:left-[calc(50vw+var(--sidebar-width)/2)]",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
});
ActionBar.displayName = "ActionBar";

const ActionBarTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "flex flex-1 items-center whitespace-nowrap px-2.5",
      className,
    )}
    {...props}
  >
    {children}
  </DialogPrimitive.Title>
));
ActionBarTitle.displayName = "ActionBarTitle";

const ActionBarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("inline-flex items-center gap-2", className)}
    {...props}
  />
));
ActionBarGroup.displayName = "ActionBarGroup";

export { ActionBar, ActionBarTitle, ActionBarGroup };
