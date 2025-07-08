import { requireUserAbility } from "@/auth/queries";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
import { subject } from "@casl/ability";
import { Button } from "@rallly/ui/button";
import { CrownIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MakeMeAdminButton } from "./make-me-admin-button";

export default async function AdminSetupPage() {
  const { user, ability } = await requireUserAbility();

  if (ability.can("access", "ControlPanel")) {
    redirect("/control-panel");
  }

  const canMakeAdmin = ability.can("update", subject("User", user), "role");

  if (!canMakeAdmin) {
    notFound();
  }

  return (
    <div className="flex h-dvh items-center justify-center">
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
          <Button asChild>
            <Link href="/">
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Link>
          </Button>
          <MakeMeAdminButton />
        </EmptyStateFooter>
      </EmptyState>
    </div>
  );
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("adminSetup"),
  };
}
