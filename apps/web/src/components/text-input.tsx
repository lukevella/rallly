import clsx from "clsx";
import * as React from "react";

export interface TextInputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  error?: boolean;
  proportions?: "lg" | "md";
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { className, error, proportions: size = "md", ...forwardProps },
    ref,
  ) {
    return (
      <input
        ref={ref}
        type="text"
        className={clsx(
          "appearance-none rounded border border-gray-300 text-slate-700 placeholder:text-slate-500",
          className,
          {
            "px-2 py-1": size === "md",
            "px-3 py-2 text-xl": size === "lg",
            "input-error": error,
            "bg-slate-50 text-slate-500": forwardProps.disabled,
          },
        )}
        {...forwardProps}
      />
    );
  },
);
