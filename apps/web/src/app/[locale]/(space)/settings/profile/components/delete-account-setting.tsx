import { TriangleAlertIcon } from "lucide-react";
import {
  Setting,
  SettingControl,
  SettingDescription,
  SettingIcon,
  SettingTitle,
} from "@/components/setting";
import { getScheduledDeletionDate } from "@/features/user/account-deletion/utils";
import { Trans } from "@/i18n/client";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime/format";
import { CancelAccountDeletionButton } from "./cancel-account-deletion-button";

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
    <Setting>
      <SettingIcon>
        <TriangleAlertIcon />
      </SettingIcon>
      <SettingTitle>
        <Trans i18nKey="deleteAccount" defaults="Delete Account" />
      </SettingTitle>
      <SettingDescription>
        <Trans
          i18nKey="pendingDeletionNotice"
          defaults="Your account and data will be permanently deleted on {deletionDate}."
          values={{ deletionDate }}
        />
      </SettingDescription>
      <SettingControl>
        <CancelAccountDeletionButton />
      </SettingControl>
    </Setting>
  );
}

export function DeleteAccountSetting({
  children,
}: {
  children: React.ReactElement<{
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  }>;
}) {
  return (
    <Setting>
      <SettingIcon>
        <TriangleAlertIcon />
      </SettingIcon>
      <SettingTitle>
        <Trans i18nKey="deleteAccount" defaults="Delete Account" />
      </SettingTitle>
      <SettingDescription>
        <Trans
          i18nKey="dangerZoneAccountDeletion"
          defaults="Delete your account and all data associated with it"
        />
      </SettingDescription>
      <SettingControl>{children}</SettingControl>
    </Setting>
  );
}
