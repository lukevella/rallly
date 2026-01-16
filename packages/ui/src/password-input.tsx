import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";

import type { InputProps } from "./input";
import { Input } from "./input";
import { cn } from "./lib/utils";

export interface PasswordInputProps extends InputProps {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          className="absolute top-1/2 right-4 -translate-y-1/2"
          onClick={() => setShowPassword(!showPassword)}
          disabled={props.disabled}
        >
          {showPassword ? (
            <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
