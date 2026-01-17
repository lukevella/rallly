import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rallly/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import {
  KeySquareIcon,
  PaletteIcon,
  PlusIcon,
  ShoppingBagIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { PageSection } from "@/app/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { requireAdmin } from "@/auth/data";
import {
  DescriptionList,
  DescriptionListTitle,
  DescriptionListValue,
} from "@/components/description-list";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";
import { LicenseKeyForm } from "@/features/licensing/components/license-key-form";
import { RefreshLicenseButton } from "@/features/licensing/components/refresh-license-button";
import { RemoveLicenseButton } from "@/features/licensing/components/remove-license-button";
import { loadInstanceLicense } from "@/features/licensing/data";
import { getTranslation } from "@/i18n/server";

async function loadData() {
  const [license] = await Promise.all([loadInstanceLicense(), requireAdmin()]);
  return { license };
}

export default async function LicensePage() {
  const { license } = await loadData();

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="license" defaults="License" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="licenseKeyDescription"
            defaults="Manage your instance license"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        {license ? (
          <>
            <PageSection variant="card">
              <div className="flex justify-between">
                <DescriptionList>
                  <DescriptionListTitle>
                    <Trans i18nKey="licenseType" defaults="License Type" />
                  </DescriptionListTitle>
                  <DescriptionListValue>
                    <span className="text-primary capitalize">
                      {license.type}
                    </span>
                    {license.seats ? (
                      <span className="ml-2 text-muted-foreground">
                        (
                        <Trans
                          i18nKey="seatCount"
                          defaults="{count, plural, one {# seat} other {# seats}}"
                          values={{ count: license.seats }}
                        />
                        )
                      </span>
                    ) : null}
                  </DescriptionListValue>
                  <DescriptionListTitle>
                    <Trans i18nKey="licenseKey" defaults="License Key" />
                  </DescriptionListTitle>
                  <DescriptionListValue>
                    <span className="select-all font-mono text-sm">
                      {license.licenseKey}
                    </span>
                  </DescriptionListValue>
                  <DescriptionListTitle>
                    <Trans i18nKey="licenseeName" defaults="Licensee Name" />
                  </DescriptionListTitle>
                  <DescriptionListValue>
                    {license.licenseeName ?? "-"}
                  </DescriptionListValue>
                  <DescriptionListTitle>
                    <Trans i18nKey="licenseeEmail" defaults="Licensee Email" />
                  </DescriptionListTitle>
                  <DescriptionListValue>
                    {license.licenseeEmail ?? "-"}
                  </DescriptionListValue>
                  <DescriptionListTitle>
                    <Trans i18nKey="purchaseDate" defaults="Purchase Date" />
                  </DescriptionListTitle>
                  <DescriptionListValue>
                    {dayjs(license.issuedAt).format("YYYY-MM-DD")}
                  </DescriptionListValue>
                </DescriptionList>
                <div className="flex gap-2">
                  <RefreshLicenseButton />
                  <RemoveLicenseButton />
                </div>
              </div>
            </PageSection>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <PaletteIcon className="size-4" />
                    <CardTitle>
                      <Trans
                        i18nKey="whiteLabelAddon"
                        defaults="White Label Add-on"
                      />
                    </CardTitle>
                  </div>
                  <div>
                    {license.whiteLabelAddon ? (
                      <Badge variant="green">
                        <Trans i18nKey="enabled" defaults="Enabled" />
                      </Badge>
                    ) : (
                      <Badge>
                        <Trans i18nKey="disabled" defaults="Disabled" />
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <Trans
                      i18nKey="whiteLabelAddonDescription"
                      defaults="This add-on allows you to brand Rallly with your own logo and colors."
                    />
                  </p>
                  <p className="mt-4 text-sm">
                    <a
                      href="https://support.rallly.co/self-hosting/white-labeling"
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      <Trans i18nKey="learnMore" defaults="Learn more" />
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
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
                defaults="This instance doesn't have a license key yet."
              />
            </EmptyStateDescription>
            <EmptyStateFooter className="flex gap-2">
              <Button asChild>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://support.rallly.co/self-hosting/licensing"
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
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("license", {
      defaultValue: "License",
    }),
  };
}
