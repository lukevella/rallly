"use client";

import { cn } from "@rallly/ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@rallly/ui/input-group";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "@/i18n/client";

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { large?: boolean }
>(({ className, large, ...props }, ref) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <InputGroup className={cn("w-full", large ? "h-12" : "h-9")}>
      <InputGroupInput
        ref={ref}
        className={cn("h-full", large && "text-base", className)}
        {...props}
        type={showPassword ? "text" : "password"}
      />
      <InputGroupAddon
        align="inline-end"
        className={cn("has-[>button]:mr-0", large ? "pr-2" : "pr-1.5")}
      >
        <InputGroupButton
          variant="ghost"
          size={large ? "icon-sm" : "icon-xs"}
          className="text-muted-foreground"
          disabled={props.disabled}
          aria-label={
            showPassword
              ? t("hidePassword", { defaultValue: "Hide password" })
              : t("showPassword", { defaultValue: "Show password" })
          }
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
});

PasswordInput.displayName = "PasswordInput";
