import { Alert, AlertDescription } from "@rallly/ui/alert";
import { CodeIcon, GemIcon } from "lucide-react";
import type { Metadata } from "next";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { requireAdmin } from "@/auth/data";
import { Trans } from "@/components/trans";
import { env } from "@/env";
import {
  getLogoIconUrl,
  getLogoUrl,
  getPrimaryColor,
  hasWhiteLabelAddon,
} from "@/features/branding/queries";
import { getTranslation } from "@/i18n/server";

async function loadData() {
  await requireAdmin();
  return {
    primaryColor: getPrimaryColor(),
    primaryColorDark: env.PRIMARY_COLOR_DARK,
    logoUrl: getLogoUrl(),
    hasWhiteLabelAddon: await hasWhiteLabelAddon(),
    logoIconUrl: getLogoIconUrl(),
  };
}

function SetEnvironmentVariableAlert({ variable }: { variable: string }) {
  return (
    <Alert>
      <CodeIcon />
      <AlertDescription>
        <p>
          <Trans
            i18nKey="setEnvironmentVariable"
            defaults="This value can be changed by setting the <env /> environment variable."
            components={{
              env: <code className="font-mono text-sm">{variable}</code>,
            }}
          />
        </p>
      </AlertDescription>
    </Alert>
  );
}

export default async function BrandingPage() {
  const {
    primaryColor,
    primaryColorDark,
    logoUrl,
    logoIconUrl,
    hasWhiteLabelAddon,
  } = await loadData();

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="branding" defaults="Branding" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="brandingDescription"
            defaults="View your instance branding configuration"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        {!hasWhiteLabelAddon ? (
          <Alert variant="primary">
            <GemIcon />
            <AlertDescription>
              <p>
                <Trans
                  i18nKey="customBrandingAlertDescription"
                  defaults="Custom branding is available to Enterprise license holders as a paid add-on."
                />
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
        <PageSectionGroup>
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="colors" defaults="Colors" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="colorsDescription"
                  defaults="Primary colors used for theming"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs">
                    <Trans i18nKey="primaryColor" defaults="Primary Color" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-8 rounded border"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="font-mono text-sm">{primaryColor}</span>
                  </div>
                  <SetEnvironmentVariableAlert variable="PRIMARY_COLOR" />
                </div>
                {primaryColorDark ? (
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-xs">
                      <Trans
                        i18nKey="primaryColorDark"
                        defaults="Primary Color (Dark Mode)"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-8 rounded border"
                        style={{ backgroundColor: primaryColorDark }}
                      />
                      <span className="font-mono text-sm">
                        {primaryColorDark}
                      </span>
                    </div>
                    <SetEnvironmentVariableAlert variable="PRIMARY_COLOR_DARK" />
                  </div>
                ) : null}
              </div>
            </PageSectionContent>
          </PageSection>
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="logos" defaults="Logos" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="logosDescription"
                  defaults="Logo images used throughout the application"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs">
                    <Trans i18nKey="logo" defaults="Logo" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex w-48 items-center justify-center overflow-hidden rounded border">
                      {/* biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image */}
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <SetEnvironmentVariableAlert variable="LOGO_URL" />
                </div>
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs">
                    <Trans i18nKey="logoIcon" defaults="Logo Icon" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded border">
                      {/* biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image */}
                      <img
                        src={logoIconUrl}
                        alt="Logo Icon"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <SetEnvironmentVariableAlert variable="LOGO_ICON_URL" />
                </div>
              </div>
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("branding", { defaultValue: "Branding" }),
  };
}
