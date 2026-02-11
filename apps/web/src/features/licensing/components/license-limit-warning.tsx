import Link from "next/link";
import { DEFAULT_SEAT_LIMIT } from "@/features/licensing/constants";
import { loadInstanceLicense } from "@/features/licensing/data";
import { getUserCount } from "@/features/user/queries";
import { Trans } from "@/i18n/client";
import { isSelfHosted } from "@/utils/constants";

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

  return (
    <div className="m-1 rounded-md bg-muted p-2 text-center text-muted-foreground text-sm">
      <Trans
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
