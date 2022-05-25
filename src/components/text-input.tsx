import clsx from "clsx";
import * as React from "react";

export interface TextInputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ className, error, ...forwardProps }, ref) {
    return (
      <input
        ref={ref}
        type="text"
        className={clsx("input", className, {
          "input-error": error,
          "bg-slate-50 text-slate-500": forwardProps.disabled,
        })}
        {...forwardProps}
      />
    );
  },
);
