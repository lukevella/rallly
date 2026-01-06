import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Switch } from "@rallly/ui/switch";
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
import {
  getLogoIconUrl,
  getLogoUrl,
  getPrimaryColor,
  shouldHideAttribution,
} from "@/features/branding/queries";
import { loadInstanceLicense } from "@/features/licensing/data";
import { getTranslation } from "@/i18n/server";

async function loadData() {
  const [license] = await Promise.all([loadInstanceLicense(), requireAdmin()]);
  const logoUrls = getLogoUrl();
  const primaryColors = getPrimaryColor();
  return {
    primaryColorLight: primaryColors.light,
    primaryColorDark: primaryColors.dark,
    logoUrlLight: logoUrls.light,
    logoUrlDark: logoUrls.dark,
    hasWhiteLabelAddon: !!license?.whiteLabelAddon,
    logoIconUrl: getLogoIconUrl(),
    hideAttribution: await shouldHideAttribution(),
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
    primaryColorLight,
    primaryColorDark,
    logoUrlLight,
    logoUrlDark,
    logoIconUrl,
    hasWhiteLabelAddon,
    hideAttribution,
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
                      style={{ backgroundColor: primaryColorLight }}
                    />
                    <span className="font-mono text-sm">
                      {primaryColorLight}
                    </span>
                  </div>
                  <SetEnvironmentVariableAlert variable="PRIMARY_COLOR" />
                </div>
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
                    <div className="flex w-48 items-center justify-center overflow-hidden rounded border bg-white">
                      {/* biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image */}
                      <img
                        src={logoUrlLight}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <SetEnvironmentVariableAlert variable="LOGO_URL" />
                </div>
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs">
                    <Trans i18nKey="logoDark" defaults="Logo (Dark Mode)" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex w-48 items-center justify-center overflow-hidden rounded border bg-gray-900">
                      {/* biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image */}
                      <img
                        src={logoUrlDark}
                        alt="Logo (Dark Mode)"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <SetEnvironmentVariableAlert variable="LOGO_URL_DARK" />
                </div>
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs">
                    <Trans i18nKey="logoIcon" defaults="Logo Icon" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded border bg-white">
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
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="attribution" defaults="Attribution" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="attributionDescription"
                  defaults="Control the visibility of the attribution text"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs">
                  <Trans
                    i18nKey="hideAttribution"
                    defaults="Hide Attribution"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={hideAttribution} disabled />
                </div>
                <SetEnvironmentVariableAlert variable="HIDE_ATTRIBUTION" />
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
