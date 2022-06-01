import clsx from "clsx";
import * as React from "react";

import SpinnerIcon from "@/components/icons/spinner.svg";

export interface ButtonProps
  extends Omit<
    React.DetailedHTMLProps<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    "type" | "ref"
  > {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactElement;
  htmlType?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  type?: "default" | "primary" | "danger" | "link";
  form?: string;
  rounded?: boolean;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      loading,
      type = "default",
      htmlType = "button",
      className,
      icon,
      disabled,
      rounded,
      ...passThroughProps
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={htmlType}
        className={clsx(
          {
            "btn-default": type === "default",
            "btn-primary": type === "primary",
            "btn-danger": type === "danger",
            "btn-link": type === "link",
            "btn-disabled": disabled,
            "h-auto rounded-full p-2": rounded,
            "w-10 p-0": !children,
          },
          className,
        )}
        {...passThroughProps}
        disabled={disabled || loading}
      >
        {loading ? (
          <SpinnerIcon
            className={clsx("inline-block w-5 animate-spin", {
              "mr-2": !!children,
            })}
          />
        ) : icon ? (
          React.cloneElement(icon, {
            className: clsx("w-5 h-5", { "-ml-1 mr-2": !!children }),
          })
        ) : null}
        {children}
      </button>
    );
  },
);
