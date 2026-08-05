import { Button } from "@rallly/ui/button";
import { TriangleAlertIcon } from "lucide-react";
import {
  SettingControl,
  SettingDescription,
  SettingIcon,
  SettingRow,
  SettingTitle,
} from "@/components/setting";
import { getScheduledDeletionDate } from "@/features/user/account-deletion/utils";
import { Trans } from "@/i18n/client";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime/format";
import { CancelAccountDeletionButton } from "./cancel-account-deletion-button";
import { DeleteAccountDialog } from "./delete-account-dialog";

const pendingDeletionTitleId = "pending-deletion-title";
const pendingDeletionDescriptionId = "pending-deletion-description";

export async function PendingDeletionSetting({
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
    <SettingRow>
      <SettingIcon>
        <TriangleAlertIcon />
      </SettingIcon>
      <SettingTitle id={pendingDeletionTitleId}>
        <Trans i18nKey="deleteAccount" defaults="Delete Account" />
      </SettingTitle>
      <SettingDescription id={pendingDeletionDescriptionId}>
        <Trans
          i18nKey="pendingDeletionNotice"
          defaults="Your account and data will be permanently deleted on {deletionDate}."
          values={{ deletionDate }}
        />
      </SettingDescription>
      <SettingControl>
        <CancelAccountDeletionButton
          aria-labelledby={pendingDeletionTitleId}
          aria-describedby={pendingDeletionDescriptionId}
        />
      </SettingControl>
    </SettingRow>
  );
}

const deleteAccountTitleId = "delete-account-title";
const deleteAccountDescriptionId = "delete-account-description";

export function DeleteAccountSetting({
  summary,
}: {
  summary?: React.ReactNode;
}) {
  return (
    <SettingRow>
      <SettingIcon>
        <TriangleAlertIcon />
      </SettingIcon>
      <SettingTitle id={deleteAccountTitleId}>
        <Trans i18nKey="deleteAccount" defaults="Delete Account" />
      </SettingTitle>
      <SettingDescription id={deleteAccountDescriptionId}>
        <Trans
          i18nKey="dangerZoneAccountDeletion"
          defaults="Delete your account and all data associated with it"
        />
      </SettingDescription>
      <SettingControl>
        <DeleteAccountDialog
          trigger={
            <Button
              className="text-destructive"
              aria-labelledby={deleteAccountTitleId}
              aria-describedby={deleteAccountDescriptionId}
            >
              <Trans i18nKey="deleteAccount" defaults="Delete Account" />
            </Button>
          }
          summary={summary}
        />
      </SettingControl>
    </SettingRow>
  );
}
