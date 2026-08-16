import { Alert, AlertDescription } from "@rallly/ui/alert";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@rallly/ui/field";
import { CodeIcon, ContainerIcon, GemIcon, HardDriveIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { loadBrandingSettings } from "@/features/branding/loaders";
import { getTranslation } from "@/i18n/server";
import { isStorageEnabled } from "@/lib/storage/constants";
import { AppNameField } from "./app-name-field";
import { HideAttributionField } from "./hide-attribution-field";
import { LogoUploadField } from "./logo-upload-field";
import { PrimaryColorField } from "./primary-color-field";

async function ConfiguredByEnvironmentVariableAlert() {
  const { t, i18n } = await getTranslation();
  return (
    <Alert variant="note">
      <ContainerIcon />
      <AlertDescription>
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="configuredByEnvironmentVariable"
          defaults="This setting has been configured by environment variable."
        />
      </AlertDescription>
    </Alert>
  );
}

async function StorageNotConfiguredAlert() {
  const { t, i18n } = await getTranslation();
  return (
    <Alert>
      <HardDriveIcon />
      <AlertDescription className="flex gap-2">
        <p className="flex-1">
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="brandingStorageNotConfigured"
            defaults="Logo uploads require object storage, which has not been configured on this instance."
          />
        </p>
        <p>
          <a
            href="https://support.rallly.co/self-hosting/configuration#external-object-storage"
            target="_blank"
            className="underline"
            rel="noreferrer"
          >
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="learnMore"
              defaults="Learn more"
            />
          </a>
        </p>
      </AlertDescription>
    </Alert>
  );
}

async function SetEnvironmentVariableAlert({ variable }: { variable: string }) {
  const { t, i18n } = await getTranslation();
  return (
    <Alert>
      <CodeIcon />
      <AlertDescription>
        <p>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
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

export async function BrandingSettings() {
  const {
    hasWhiteLabelAddon,
    appName,
    primaryColor,
    primaryColorDark,
    hideAttribution,
    logoUrlLight,
    logoUrlDark,
    logoIconUrl,
    logoConfigured,
    envConfigured,
  } = await loadBrandingSettings();
  const { t, i18n } = await getTranslation();

  return (
    <>
      {!hasWhiteLabelAddon ? (
        <Alert variant="primary">
          <GemIcon />
          <AlertDescription className="flex gap-2">
            <p className="flex-1">
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="customBrandingAlertDescription"
                defaults="Custom branding is available to Enterprise license holders as a paid add-on."
              />
            </p>
            <p>
              <a
                href="https://support.rallly.co/self-hosting/white-labeling"
                target="_blank"
                className="underline"
                rel="noreferrer"
              >
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="app"
                  i18nKey="learnMore"
                  defaults="Learn more"
                />
              </a>
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
      <PageSectionGroup>
        <PageSection variant="card">
          <PageSectionHeader>
            <PageSectionTitle>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="general"
                defaults="General"
              />
            </PageSectionTitle>
            <PageSectionDescription>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="brandingGeneralDescription"
                defaults="Set the name of your instance"
              />
            </PageSectionDescription>
          </PageSectionHeader>
          <PageSectionContent>
            <FieldGroup variant="divided">
              <Field>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldLabel htmlFor="app-name">
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="appName"
                        defaults="App name"
                      />
                    </FieldLabel>
                  </FieldContent>
                  <AppNameField
                    defaultValue={appName}
                    disabled={!hasWhiteLabelAddon}
                  />
                </Field>
                {envConfigured.appName ? (
                  <ConfiguredByEnvironmentVariableAlert />
                ) : null}
              </Field>
            </FieldGroup>
          </PageSectionContent>
        </PageSection>
        <PageSection variant="card">
          <PageSectionHeader>
            <PageSectionTitle>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="colors"
                defaults="Colors"
              />
            </PageSectionTitle>
            <PageSectionDescription>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="colorsDescription"
                defaults="Primary colors used for theming"
              />
            </PageSectionDescription>
          </PageSectionHeader>
          <PageSectionContent>
            <FieldGroup variant="divided">
              <Field>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldTitle id="primary-color-label">
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="primaryColor"
                        defaults="Primary color"
                      />
                    </FieldTitle>
                  </FieldContent>
                  <PrimaryColorField
                    field="primaryColor"
                    defaultValue={primaryColor}
                    disabled={!hasWhiteLabelAddon}
                    aria-labelledby="primary-color-label"
                  />
                </Field>
                {envConfigured.primaryColor ? (
                  <ConfiguredByEnvironmentVariableAlert />
                ) : null}
              </Field>
              <Field>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldTitle id="primary-color-dark-label">
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="primaryColorDark"
                        defaults="Primary color (dark mode)"
                      />
                    </FieldTitle>
                  </FieldContent>
                  <PrimaryColorField
                    field="primaryColorDark"
                    defaultValue={primaryColorDark}
                    disabled={!hasWhiteLabelAddon}
                    aria-labelledby="primary-color-dark-label"
                  />
                </Field>
                {envConfigured.primaryColorDark ? (
                  <ConfiguredByEnvironmentVariableAlert />
                ) : null}
              </Field>
            </FieldGroup>
          </PageSectionContent>
        </PageSection>
        <PageSection variant="card">
          <PageSectionHeader>
            <PageSectionTitle>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="logos"
                defaults="Logos"
              />
            </PageSectionTitle>
            <PageSectionDescription>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="logosDescription"
                defaults="Logo images used throughout the application"
              />
            </PageSectionDescription>
          </PageSectionHeader>
          <PageSectionContent>
            {!isStorageEnabled ? <StorageNotConfiguredAlert /> : null}
            <FieldGroup variant="divided">
              <Field>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldTitle>
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="logo"
                        defaults="Logo"
                      />
                    </FieldTitle>
                  </FieldContent>
                  <LogoUploadField
                    logoType="logo"
                    previewUrl={logoUrlLight}
                    previewAlt={t("logo", { ns: "app", defaultValue: "Logo" })}
                    hasCustomLogo={logoConfigured.logo}
                    disabled={!hasWhiteLabelAddon}
                  />
                </Field>
                {envConfigured.logo ? (
                  <ConfiguredByEnvironmentVariableAlert />
                ) : !isStorageEnabled ? (
                  <SetEnvironmentVariableAlert variable="LOGO_URL" />
                ) : null}
              </Field>
              <Field>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldTitle>
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="logoDark"
                        defaults="Logo (dark mode)"
                      />
                    </FieldTitle>
                  </FieldContent>
                  <LogoUploadField
                    logoType="logoDark"
                    previewUrl={logoUrlDark}
                    previewAlt={t("logoDark", {
                      ns: "app",
                      defaultValue: "Logo (dark mode)",
                    })}
                    hasCustomLogo={logoConfigured.logoDark}
                    disabled={!hasWhiteLabelAddon}
                  />
                </Field>
                {envConfigured.logoDark ? (
                  <ConfiguredByEnvironmentVariableAlert />
                ) : !isStorageEnabled ? (
                  <SetEnvironmentVariableAlert variable="LOGO_URL_DARK" />
                ) : null}
              </Field>
              <Field>
                <Field orientation="responsive">
                  <FieldContent>
                    <FieldTitle>
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="logoIcon"
                        defaults="Logo icon"
                      />
                    </FieldTitle>
                  </FieldContent>
                  <LogoUploadField
                    logoType="logoIcon"
                    previewUrl={logoIconUrl}
                    previewAlt={t("logoIcon", {
                      ns: "app",
                      defaultValue: "Logo icon",
                    })}
                    hasCustomLogo={logoConfigured.logoIcon}
                    disabled={!hasWhiteLabelAddon}
                  />
                </Field>
                {envConfigured.logoIcon ? (
                  <ConfiguredByEnvironmentVariableAlert />
                ) : !isStorageEnabled ? (
                  <SetEnvironmentVariableAlert variable="LOGO_ICON_URL" />
                ) : null}
              </Field>
            </FieldGroup>
          </PageSectionContent>
        </PageSection>
        <PageSection variant="card">
          <PageSectionHeader>
            <PageSectionTitle>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="attribution"
                defaults="Attribution"
              />
            </PageSectionTitle>
            <PageSectionDescription>
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="attributionDescription"
                defaults="Control the visibility of the attribution text"
              />
            </PageSectionDescription>
          </PageSectionHeader>
          <PageSectionContent>
            <FieldGroup variant="divided">
              <Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="hide-attribution">
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="hideAttribution"
                        defaults="Hide attribution"
                      />
                    </FieldLabel>
                  </FieldContent>
                  <HideAttributionField
                    defaultValue={hideAttribution}
                    disabled={!hasWhiteLabelAddon}
                  />
                </Field>
                {envConfigured.hideAttribution ? (
                  <ConfiguredByEnvironmentVariableAlert />
                ) : null}
              </Field>
            </FieldGroup>
          </PageSectionContent>
        </PageSection>
      </PageSectionGroup>
    </>
  );
}
