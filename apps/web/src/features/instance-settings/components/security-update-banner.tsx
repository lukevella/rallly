import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@rallly/ui/alert";
import { ShieldAlertIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";
import { githubRepoUrl } from "@/lib/constants";
import { loadUpdateStatus } from "../loaders";
import type { UpdateAdvisory } from "../service";

const ADVISORIES_URL = `${githubRepoUrl}/security/advisories`;

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 } as const;

function highestSeverity(advisories: UpdateAdvisory[]) {
  return advisories.reduce<UpdateAdvisory["severity"]>((highest, advisory) => {
    if (!advisory.severity) return highest;
    if (!highest || SEVERITY_RANK[advisory.severity] > SEVERITY_RANK[highest]) {
      return advisory.severity;
    }
    return highest;
  }, null);
}

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

  const advisories = inChannel
    ? update.advisories
    : (update.newMajor?.advisories ?? []);
  const severity = t("advisorySeverity", {
    defaultValue:
      "{severity, select, critical {critical} high {high} medium {medium} low {low} other {unrated}}",
    severity: highestSeverity(advisories) ?? "other",
  });
  const advisoryUrl =
    advisories.length === 1 ? advisories[0]?.url : ADVISORIES_URL;

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
              defaults="Rallly {version} fixes {count, plural, one {a {severity} severity vulnerability} other {# vulnerabilities, the most severe rated {severity},}} affecting the version you are running. Update as soon as possible."
              values={{
                version: update.latest,
                count: advisories.length,
                severity,
              }}
            />
          ) : (
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="securityUpdateBannerNewMajorDescription"
              defaults="Rallly v{major} fixes {count, plural, one {a {severity} severity vulnerability} other {# vulnerabilities, the most severe rated {severity},}} affecting the version you are running, and the fix is not available for your major version. Migrate as soon as possible."
              values={{
                major: update.newMajor?.major,
                count: advisories.length,
                severity,
              }}
            />
          )}
        </AlertDescription>
        <AlertAction>
          <a
            href={advisoryUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-link-inherit"
          >
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="viewAdvisory"
              defaults="{count, plural, one {View advisory} other {View advisories}}"
              values={{ count: advisories.length }}
            />
          </a>
        </AlertAction>
      </Alert>
    </div>
  );
}
