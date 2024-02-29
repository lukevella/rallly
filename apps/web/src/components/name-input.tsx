import { cn } from "@rallly/ui";
import { useTranslation } from "next-i18next";
import * as React from "react";

import UserAvatar from "./poll/user-avatar";

interface NameInputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  value?: string;
  defaultValue?: string;
  error?: boolean;
}

const NameInput: React.ForwardRefRenderFunction<
  HTMLInputElement,
  NameInputProps
> = ({ value, defaultValue, className, error, ...forwardProps }, ref) => {
  const { t } = useTranslation();
  return (
    <div className="relative flex items-center">
      {value ? (
        <UserAvatar
          name={value ?? defaultValue ?? ""}
          className="absolute left-2"
        />
      ) : null}
      <input
        ref={ref}
        className={cn(
          "input text-sm",
          {
            "pl-9": value || defaultValue,
            "ring-destructive ring-1": error,
          },
          className,
        )}
        placeholder={t("yourName")}
        value={value}
        {...forwardProps}
      />
    </div>
  );
};

export default React.forwardRef(NameInput);
