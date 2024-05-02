import { cn } from "@rallly/ui";
import { Input, InputProps } from "@rallly/ui/input";
import { useTranslation } from "next-i18next";
import * as React from "react";

import UserAvatar from "./poll/user-avatar";

interface NameInputProps extends InputProps {
  value?: string;
  defaultValue?: string;
  error?: boolean;
}

const NameInput = React.forwardRef<HTMLInputElement, NameInputProps>(function (
  { value, defaultValue, className, error, ...forwardProps },
  ref,
) {
  const { t } = useTranslation();
  return (
    <div className="relative flex items-center">
      {value ? (
        <UserAvatar
          name={value ?? defaultValue ?? ""}
          className="absolute left-2"
        />
      ) : null}
      <Input
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
});

NameInput.displayName = "NameInput";

export default NameInput;
