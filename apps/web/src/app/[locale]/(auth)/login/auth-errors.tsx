import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { AlertTriangleIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export function AuthErrors() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  if (error === "OAuthAccountNotLinked") {
    return (
      <Alert icon={AlertTriangleIcon} variant="destructive">
        <AlertTitle>
          {t("accountNotLinkedTitle", {
            defaultValue: "Your account cannot be linked to an existing user",
          })}
        </AlertTitle>
        <AlertDescription>
          {t("accountNotLinkedDescription", {
            defaultValue:
              "A user with this email already exists. Please log in using the original method.",
          })}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
