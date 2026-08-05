import { buttonVariants } from "@rallly/ui";
import { CrownIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { IfCloudHosted, IfSelfHosted } from "@/components/environment";
import { isInitialAdmin } from "@/features/instance-settings/utils";
import { getCurrentUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
import { MakeMeAdminButton } from "./make-me-admin-button";
import { SignedInAs } from "./signed-in-as";

export default async function AdminSetupPage() {
  // Read the role from the database — the session cookie cache can hold
  // a stale role.
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  if (user.role === "admin") {
    redirect("/control-panel");
  }

  if (!isInitialAdmin(user.email)) {
    return (
      <main id="main-content" tabIndex={-1} className="flex h-dvh flex-col p-4">
        <EmptyState className="flex-1">
          <EmptyStateIcon>
            <LockIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>
            <Trans
              i18nKey="adminAccessRequired"
              defaults="Administrator access required"
            />
          </EmptyStateTitle>
          <EmptyStateDescription>
            <IfCloudHosted>
              <Trans
                i18nKey="adminAccessRequiredDescription"
                defaults="You need administrator access to view this page."
              />
            </IfCloudHosted>
            <IfSelfHosted>
              <Trans
                i18nKey="adminAccessRequiredSelfHostedHint"
                defaults="If you are the owner of this instance, check that INITIAL_ADMIN_EMAIL is set to the email address of the administrator account."
              />
            </IfSelfHosted>
          </EmptyStateDescription>
          <EmptyStateFooter className="flex gap-2">
            <Link href="/" className={buttonVariants()}>
              <Trans i18nKey="backToHome" defaults="Back to home" />
            </Link>
            <IfSelfHosted>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://support.rallly.co/self-hosting/control-panel"
                className={buttonVariants({ variant: "primary" })}
              >
                <Trans i18nKey="learnMore" defaults="Learn more" />
              </a>
            </IfSelfHosted>
          </EmptyStateFooter>
        </EmptyState>
        <div className="pb-6">
          <SignedInAs
            name={user.name}
            email={user.email}
            image={user.image ?? undefined}
          />
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex h-dvh items-center justify-center"
    >
      <EmptyState className="h-full">
        <EmptyStateIcon>
          <CrownIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="adminSetupTitle" defaults="Are you the admin?" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="adminSetupDescription"
            defaults="Click the button below to make yourself an admin user."
          />
        </EmptyStateDescription>
        <EmptyStateFooter className="flex gap-2">
          <Link href="/" className={buttonVariants()}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </Link>
          <MakeMeAdminButton />
        </EmptyStateFooter>
      </EmptyState>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslation(locale);
  return {
    title: t("adminSetup", { defaultValue: "Admin setup" }),
  };
}
