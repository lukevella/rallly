import { getScheduledDeletionDate } from "@/features/user/account-deletion/utils";
import { Trans } from "@/i18n/client";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime/format";
import { CancelAccountDeletionButton } from "./cancel-account-deletion-button";

export async function PendingDeletionNotice({
  deletedAt,
}: {
  deletedAt: Date;
}) {
  const session = await getSession();
  const deletionDate = formatDateTime(getScheduledDeletionDate(deletedAt), {
    preset: "dateLong",
    locale: session?.user.locale ?? "en",
    timeZone: session?.user.timeZone,
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
