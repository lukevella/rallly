import { getScheduledDeletionDate } from "@/features/user/utils";
import { Trans } from "@/i18n/client";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime/format";
import { CancelAccountDeletionButton } from "./cancel-account-deletion-button";

// Reads deletedAt from the session (cookie cache) — no database call per
// render. Other devices pick the banner up when their session refreshes.
export async function AccountDeletionBanner() {
  const session = await getSession();
  const deletedAt = session?.user.deletedAt;

  if (!deletedAt) {
    return null;
  }

  const deletionDate = formatDateTime(getScheduledDeletionDate(deletedAt), {
    preset: "dateLong",
    locale: session.user.locale ?? "en",
    timeZone: session.user.timeZone,
  });

  return (
    <div className="m-1 rounded-md bg-muted p-2 text-center text-muted-foreground text-sm">
      <Trans
        i18nKey="accountDeletionBanner"
        defaults="Your account and data will be permanently deleted on {deletionDate}."
        values={{ deletionDate }}
      />{" "}
      <CancelAccountDeletionButton />
    </div>
  );
}
