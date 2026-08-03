import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { DEFAULT_SEAT_LIMIT } from "@/features/licensing/constants";
import { loadInstanceLicense } from "@/features/licensing/data";
import { getUserCount } from "@/features/user/data";
import { getTranslation } from "@/i18n/server";
import { isSelfHosted } from "@/lib/constants";

export async function LicenseLimitWarning() {
  if (!isSelfHosted) {
    return null;
  }

  const [userCount, license] = await Promise.all([
    getUserCount(),
    loadInstanceLicense(),
  ]);

  const userLimit = license?.seats ?? DEFAULT_SEAT_LIMIT;

  if (userCount <= userLimit) {
    return null;
  }

  const { t, i18n } = await getTranslation();

  return (
    <div className="m-1 rounded-md bg-muted p-2 text-center text-muted-foreground text-sm">
      <Trans
        t={t}
        i18n={i18n}
        ns="app"
        i18nKey="licenseLimitWarning"
        defaults="You have exceeded the limits of your license. Please <a>upgrade</a>."
        components={{
          a: (
            <Link
              prefetch={false}
              href="https://support.rallly.co/self-hosting/licensing"
              target="_blank"
              className="text-link"
              rel="noopener noreferrer"
            />
          ),
        }}
      />
    </div>
  );
}
