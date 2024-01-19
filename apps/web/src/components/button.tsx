import { Button as NewButton } from "@rallly/ui/button";
import * as React from "react";

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
  type?: "default" | "primary" | "danger";
  form?: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const LegacyButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      loading,
      type = "default",
      htmlType = "button",
      icon,
      disabled,
      ...passThroughProps
    },
    ref,
  ) {
    return (
      <NewButton
        ref={ref}
        type={htmlType}
        loading={loading}
        variant={type === "danger" ? "destructive" : type}
        {...passThroughProps}
        role="button"
        disabled={disabled}
      >
        {icon ? React.cloneElement(icon, { className: "size-5 mr-1.5" }) : null}
        {children}
      </NewButton>
    );
  },
);
