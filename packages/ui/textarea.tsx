import * as React from "react";

import { cn } from "./lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "border-input ring-offset-input-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-ring flex min-h-[80px] w-full rounded border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
