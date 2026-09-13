import { buttonVariants } from "@rallly/ui";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { ShieldAlertIcon, TrashIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { InstanceFooterLinks } from "@/components/instance-footer-links";
import { Link } from "@/components/link";
import { DefaultLogo } from "@/features/branding/components/default-logo";
import { getTranslation } from "@/i18n/server";

export type PollUnavailableReason = "deleted" | "removed";

function PollUnavailableShell({
  footerLinks,
  children,
}: {
  footerLinks: { label: string; href: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main-content" tabIndex={-1} className="flex-1 p-4 pt-10">
        <DefaultLogo className="mx-auto" />
        <EmptyState className="py-12">{children}</EmptyState>
      </main>
      {footerLinks.length > 0 ? (
        <footer className="flex justify-center p-4 pb-10">
          <InstanceFooterLinks links={footerLinks} />
        </footer>
      ) : null}
    </div>
  );
}

// Shown in place of the invite page when the poll exists but must not be
// served. "removed" means the creator was banned, which is usually a scam:
// the viewer is the intended victim, so the copy warns them. It never names
// the poll, its creator, or a reason more specific than the terms of use.
export async function PollUnavailable({
  reason,
  footerLinks,
}: {
  reason: PollUnavailableReason;
  footerLinks: { label: string; href: string }[];
}) {
  const { t, i18n } = await getTranslation();

  if (reason === "deleted") {
    return (
      <PollUnavailableShell footerLinks={footerLinks}>
        <EmptyStateIcon>
          <TrashIcon />
        </EmptyStateIcon>
        <EmptyStateTitle as="h1">
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="pollDeletedTitle"
            defaults="This poll has been deleted"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="pollDeletedDescription"
            defaults="It may have been deleted by its creator or removed after a period of inactivity."
          />
        </EmptyStateDescription>
        <EmptyStateFooter>
          <Link href="/" className={buttonVariants()}>
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="errorBackToHome"
              defaults="Back to home"
            />
          </Link>
        </EmptyStateFooter>
      </PollUnavailableShell>
    );
  }

  return (
    <PollUnavailableShell footerLinks={footerLinks}>
      <EmptyStateIcon>
        <ShieldAlertIcon />
      </EmptyStateIcon>
      <EmptyStateTitle as="h1">
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="pollRemovedTitle"
          defaults="This poll has been removed"
        />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="pollRemovedDescription"
          defaults="It violated our terms of use and is no longer available."
        />
      </EmptyStateDescription>
      <Alert variant="warning" className="mt-6 max-w-md">
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
    </PollUnavailableShell>
  );
}
