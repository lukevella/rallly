"use client";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export function AuthErrors() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  if (error === "OAuthAccountNotLinked") {
    return (
      <p className="text-destructive text-sm">
        {t("accountNotLinkedDescription", {
          defaultValue:
            "A user with this email already exists. Please log in using the original method.",
        })}
      </p>
    );
  }

  return null;
}
