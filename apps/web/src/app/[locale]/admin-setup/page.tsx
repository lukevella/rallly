import { buttonVariants } from "@rallly/ui";
import { CrownIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { isInitialAdmin } from "@/features/setup/utils";
import { getCurrentUser } from "@/features/user/data";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
import { MakeMeAdminButton } from "./make-me-admin-button";

export default async function AdminSetupPage() {
  // Read the role from the database — the session cookie cache can hold
  // a stale role.
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: "/admin-setup",
      }),
    );
  }

  if (user.role === "admin") {
    redirect("/control-panel");
  }

  if (!isInitialAdmin(user.email)) {
    notFound();
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
    title: t("adminSetup"),
  };
}
