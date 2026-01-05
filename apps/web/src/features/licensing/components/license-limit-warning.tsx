import Link from "next/link";
import { Trans } from "@/components/trans";
import { didExceedLicenseLimit } from "@/features/licensing/data";

export async function LicenseLimitWarning() {
  const exceeded = await didExceedLicenseLimit();

  if (!exceeded) {
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
