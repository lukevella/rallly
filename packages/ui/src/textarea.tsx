import * as React from "react";

import { cn } from "./lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "border-input placeholder:text-muted-foreground flex min-h-[80px] rounded border bg-gray-50 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:ring-offset-input-background focus-visible:ring-1 focus-visible:ring-offset-1",
          "focus-visible:border-primary-400  focus-visible:ring-primary-100",
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
