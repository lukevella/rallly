import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@rallly/ui/alert";
import { ShieldAlertIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";
import { loadUpdateStatus } from "../loaders";

// Rendered on every control panel page: an operator must not have to open
// the home tile to learn that the running version has a known vulnerability.
export async function SecurityUpdateBanner() {
  const update = await loadUpdateStatus();

  if (!update) {
    return null;
  }

  const inChannel = update.status === "update-available" && update.security;
  const inNewMajor = update.newMajor?.security === true;

  if (!inChannel && !inNewMajor) {
    return null;
  }

  const { t, i18n } = await getTranslation();

  return (
    <div className="p-4 pb-0 lg:pt-12 lg:pb-0">
      <Alert variant="error">
        <ShieldAlertIcon />
        <AlertTitle>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="securityUpdateAvailable"
            defaults="Security update available"
          />
        </AlertTitle>
        <AlertDescription>
          {inChannel ? (
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="securityUpdateBannerDescription"
              defaults="Rallly {version} includes security fixes. Update as soon as possible."
              values={{ version: update.latest }}
            />
          ) : (
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="securityUpdateBannerNewMajorDescription"
              defaults="Rallly v{major} includes security fixes that were not released for the version you are running. Migrate as soon as possible."
              values={{ major: update.newMajor?.major }}
            />
          )}
        </AlertDescription>
        <AlertAction>
          <a
            href={inChannel ? update.url : update.newMajor?.migrationGuideUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-link-inherit"
          >
            {inChannel ? (
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="releaseNotes"
                defaults="Release notes"
              />
            ) : (
              <Trans
                t={t}
                i18n={i18n}
                ns="app"
                i18nKey="migrationGuide"
                defaults="Migration guide"
              />
            )}
          </a>
        </AlertAction>
      </Alert>
    </div>
  );
}
