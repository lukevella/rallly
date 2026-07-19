import { getScheduledDeletionDate } from "@/features/account-deletion/utils";
import { Trans } from "@/i18n/client";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime/format";
import { CancelAccountDeletionButton } from "./cancel-account-deletion-button";

// Reads deletedAt from the session (cookie cache) — no database call per
// render. Other devices pick the notice up when their session refreshes.
export async function PendingDeletionNotice() {
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
    <div className="space-y-4">
      <p className="text-sm">
        <Trans
          i18nKey="pendingDeletionNotice"
          defaults="Your account and data will be permanently deleted on {deletionDate}."
          values={{ deletionDate }}
        />
      </p>
      <CancelAccountDeletionButton />
    </div>
  );
}
