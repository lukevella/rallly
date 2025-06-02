"use client";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export function AuthErrors() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  switch (error) {
    case "OAuthAccountNotLinked":
      return (
        <p className="text-destructive text-sm">
          {t("accountNotLinkedDescription", {
            defaultValue:
              "A user with this email already exists. Please log in using the original method.",
          })}
        </p>
      );
    case "RegistrationDisabled":
      return (
        <p className="text-destructive text-sm">
          {t("authErrorsRegistrationDisabled", {
            defaultValue:
              "Registration is currently disabled. Please try again later.",
          })}
        </p>
      );
    case "EmailNotVerified":
      return (
        <p className="text-destructive text-sm">
          {t("authErrorsEmailNotVerified", {
            defaultValue:
              "Your email address is not verified. Please verify your email before logging in.",
          })}
        </p>
      );
    case "Banned":
      return (
        <p className="text-destructive text-sm">
          {t("authErrorsUserBanned", {
            defaultValue:
              "This account has been banned. Please contact support if you believe this is an error.",
          })}
        </p>
      );
    case "EmailBlocked":
      return (
        <p className="text-destructive text-sm">
          {t("authErrorsEmailBlocked", {
            defaultValue:
              "This email address is not allowed. Please use a different email or contact support.",
          })}
        </p>
      );
    case "UserNotFound":
      return (
        <p className="text-destructive text-sm">
          {t("authErrorsUserNotFound", {
            defaultValue:
              "No account found with this email address. Please check the email or register for a new account.",
          })}
        </p>
      );
    default:
      return null;
  }
}
