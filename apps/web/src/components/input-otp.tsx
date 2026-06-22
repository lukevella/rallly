"use client";

import {
  InputOTP as InputOTPBase,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@rallly/ui/input-otp";
import type * as React from "react";
import { useTranslation } from "@/i18n/client";

type InputOTPProps = Omit<
  React.ComponentProps<typeof InputOTPBase>,
  "maxLength" | "pattern" | "children" | "render" | "onComplete"
> & {
  onValidCode?: (code: string) => void;
};

function InputOTP({ onValidCode, ...props }: InputOTPProps) {
  const { t } = useTranslation();
  return (
    <InputOTPBase
      maxLength={6}
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      aria-label={t("verificationCodePlaceholder")}
      onComplete={onValidCode}
      {...props}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTPBase>
  );
}

export { InputOTP };
