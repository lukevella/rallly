import { buttonVariants } from "@rallly/ui";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { ShieldAlertIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { ErrorPage } from "@/components/error-page";
import { Link } from "@/components/link";
import { env } from "@/env";
import { DefaultLogo } from "@/features/branding/components/default-logo";
import { getTranslation } from "@/i18n/server";

export type PollUnavailableReason = "deleted" | "removed";

// Shown in place of the invite page when the poll exists but must not be
// served. "removed" means the creator was banned, which is usually a scam:
// the viewer is the intended victim, so the copy warns them and offers a
// way to report the link. It never names the poll, its creator, or a reason
// more specific than the terms of use.
export async function PollUnavailable({
  reason,
}: {
  reason: PollUnavailableReason;
}) {
  const { t, i18n } = await getTranslation();

  if (reason === "deleted") {
    return (
      <ErrorPage
        logo={<DefaultLogo />}
        label={t("pollUnavailableLabel", { defaultValue: "Poll unavailable" })}
        title={t("pollDeletedTitle", {
          defaultValue: "This poll has been deleted",
        })}
        description={t("pollDeletedDescription", {
          defaultValue: "The person who created this poll has deleted it.",
        })}
        actions={
          <Link
            href="/"
            className={buttonVariants({ size: "lg", variant: "primary" })}
          >
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="errorBackToHome"
              defaults="Back to home"
            />
          </Link>
        }
      />
    );
  }

  return (
    <ErrorPage
      logo={<DefaultLogo />}
      label={t("pollUnavailableLabel", { defaultValue: "Poll unavailable" })}
      title={t("pollRemovedTitle", {
        defaultValue: "This poll has been removed",
      })}
      description={t("pollRemovedDescription", {
        defaultValue:
          "It violated our terms of use and is no longer available.",
      })}
      actions={
        <a
          href={`mailto:${env.SUPPORT_EMAIL}`}
          className={buttonVariants({ size: "lg", variant: "primary" })}
        >
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="pollRemovedReportLink"
            defaults="Report this link"
          />
        </a>
      }
      notice={
        <Alert variant="warning" className="p-4">
          <ShieldAlertIcon />
          <AlertTitle>
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="pollRemovedWarningTitle"
              defaults="Weren't expecting this link?"
            />
          </AlertTitle>
          <AlertDescription>
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="pollRemovedWarningDescription"
              defaults="Treat the message that sent you here as suspicious. Do not call phone numbers, follow links, or send money or personal details in response to it."
            />
          </AlertDescription>
        </Alert>
      }
    />
  );
}
