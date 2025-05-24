import { PageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { requireAdmin } from "@/auth/queries";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";
import { LicenseKeyForm } from "@/features/licensing/components/license-key-form";
import { RemoveLicenseButton } from "@/features/licensing/components/remove-license-button";
import { getLicense } from "@/features/licensing/queries";
import { getTranslation } from "@/i18n/server";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import { KeySquareIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";

async function loadData() {
  await requireAdmin();
  const license = await getLicense();
  return { license };
}

export default async function LicensePage() {
  const { license } = await loadData();
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon color="darkGray">
            <KeySquareIcon />
          </PageIcon>
          <Trans i18nKey="license" defaults="License" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        {license ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                <Trans i18nKey="licenseType" defaults="License Type" />
              </span>
              <div className="flex text-sm items-center gap-2">
                <span className="capitalize text-primary">{license.type}</span>
                <span className="text-muted-foreground">
                  (
                  <Trans
                    i18nKey="seatCount"
                    defaults="{count, plural, one {# seat} other {# seats}}"
                    values={{ count: license.seats }}
                  />
                  )
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                <Trans i18nKey="licenseKey" defaults="License Key" />
              </span>
              <span className="font-mono select-all text-sm">
                {license.licenseKey}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                <Trans i18nKey="licenseeName" defaults="Licensee Name" />
              </span>
              <span className="text-sm font-mono">
                {license.licenseeName ?? "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                <Trans i18nKey="licenseeEmail" defaults="Licensee Email" />
              </span>
              <span className="text-sm font-mono">
                {license.licenseeEmail ?? "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                <Trans i18nKey="purchaseDate" defaults="Purchase Date" />
              </span>
              <span className="text-sm font-mono">
                {dayjs(license.issuedAt).format("YYYY-MM-DD")}
              </span>
            </div>

            <RemoveLicenseButton licenseId={license.id} />
          </div>
        ) : (
          <EmptyState className="h-full">
            <EmptyStateIcon>
              <KeySquareIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>
              <Trans i18nKey="noLicenseKey" defaults="No license key found" />
            </EmptyStateTitle>
            <EmptyStateDescription>
              <Trans
                i18nKey="noLicenseKeyDescription"
                defaults="This instance doesn’t have a license key yet."
              />
            </EmptyStateDescription>
            <EmptyStateFooter className="flex gap-2">
              <Button asChild>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://support.rallly.co/self-hosting/pricing"
                >
                  <Icon>
                    <ShoppingBagIcon />
                  </Icon>
                  <Trans
                    i18nKey="purchaseLicense"
                    defaults="Purchase license"
                  />
                </a>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary">
                    <Icon>
                      <PlusIcon />
                    </Icon>
                    <Trans i18nKey="addLicenseKey" defaults="Add license key" />
                  </Button>
                </DialogTrigger>
                <DialogContent size="sm">
                  <DialogHeader>
                    <DialogTitle>
                      <Trans
                        i18nKey="addLicenseKey"
                        defaults="Add license key"
                      />
                    </DialogTitle>
                  </DialogHeader>
                  <LicenseKeyForm />
                </DialogContent>
              </Dialog>
            </EmptyStateFooter>
          </EmptyState>
        )}
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("license", {
      defaultValue: "License",
    }),
  };
}
