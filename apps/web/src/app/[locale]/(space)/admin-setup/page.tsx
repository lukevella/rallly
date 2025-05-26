import { PageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { isInitialAdmin, requireUser } from "@/auth/queries";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";
import { Button } from "@rallly/ui/button";
import { CrownIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MakeMeAdminButton } from "./make-me-admin-button";

export default async function AdminSetupPage() {
  const user = await requireUser();

  if (user.role === "admin") {
    // User is already an admin
    redirect("/control-panel");
  }

  if (!isInitialAdmin(user.email)) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon color="indigo">
            <CrownIcon />
          </PageIcon>
          <Trans i18nKey="adminSetup" defaults="Admin Setup" />
        </PageTitle>
      </PageHeader>
      <PageContent>
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
      </PageContent>
    </PageContainer>
  );
}
