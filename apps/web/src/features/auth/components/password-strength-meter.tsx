"use client";
import { cn } from "@rallly/ui";
import { Trans } from "@/i18n/client";
import type { PasswordQuality } from "../types";
import { getPasswordQuality } from "../utils";

function PasswordStrengthLabel({ quality }: { quality: PasswordQuality }) {
  switch (quality) {
    case "veryWeak":
      return <Trans i18nKey="passwordStrengthVeryWeak" defaults="Very weak" />;
    case "weak":
      return <Trans i18nKey="passwordStrengthWeak" defaults="Weak" />;
    case "fair":
      return <Trans i18nKey="passwordStrengthFair" defaults="Fair" />;
    case "good":
      return <Trans i18nKey="passwordStrengthGood" defaults="Good" />;
    case "strong":
      return <Trans i18nKey="passwordStrengthStrong" defaults="Strong" />;
  }
}

export function PasswordStrengthMeter({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  const quality = getPasswordQuality(password);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={`password-strength-bar-${bar}`}
            className={cn(
              "h-1 rounded-full bg-gray-200 transition-all duration-300 dark:bg-gray-700",
              {
                "bg-red-500 dark:bg-red-700": quality === "weak" && bar === 1,
                "bg-amber-500 dark:bg-amber-700":
                  quality === "fair" && bar <= 2,
                "bg-green-500 dark:bg-green-700":
                  quality === "good" && bar <= 3,
                "bg-teal-500 dark:bg-teal-700":
                  quality === "strong" && bar <= 4,
              },
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground text-xs">
          <Trans i18nKey="passwordStrength" defaults="Password Strength" />
        </span>
        <span
          className={cn("font-medium", {
            "text-gray-500": quality === "veryWeak",
            "text-red-600": quality === "weak",
            "text-amber-600": quality === "fair",
            "text-green-600": quality === "good",
            "text-teal-600": quality === "strong",
          })}
        >
          <PasswordStrengthLabel quality={quality} />
        </span>
      </div>
    </div>
  );
}
