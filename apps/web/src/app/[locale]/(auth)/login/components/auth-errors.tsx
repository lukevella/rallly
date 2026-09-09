"use client";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/client";

export function AuthErrors() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  if (!error) {
    return null;
  }
  switch (error) {
    case "account_not_linked":
      return (
        <p className="text-destructive text-sm">
          {t("accountNotLinkedDescription", {
            defaultValue:
              "A user with this email already exists. Please log in using the original method.",
          })}
        </p>
      );
    case "email_not_verified":
      return (
        <p className="text-destructive text-sm">
          {t("authErrorsEmailNotVerified", {
            defaultValue:
              "Your email address is not verified. Please verify your email before logging in.",
          })}
        </p>
      );
    // Better-Auth appends its own code to errorCallbackURL; anything not
    // mapped above still deserves a message rather than a silent login page.
    default:
      return (
        <p className="text-destructive text-sm">
          {t("authErrorsOAuthSignInFailed", {
            defaultValue:
              "An error occurred while signing in. Please try again or contact the system administrator.",
          })}
        </p>
      );
  }
}
