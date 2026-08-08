import { Button } from "@rallly/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@rallly/ui/field";
import { TriangleAlertIcon } from "lucide-react";
import { SettingIcon } from "@/components/setting-icon";
import { getScheduledDeletionDate } from "@/features/user/account-deletion/utils";
import { Trans } from "@/i18n/client";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime/format";
import { CancelAccountDeletionButton } from "./cancel-account-deletion-button";
import { DeleteAccountDialog } from "./delete-account-dialog";

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
    <Field orientation="responsive">
      <SettingIcon>
        <TriangleAlertIcon />
      </SettingIcon>
      <FieldContent>
        <FieldTitle>
          <Trans i18nKey="deleteAccount" defaults="Delete account" />
        </FieldTitle>
        <FieldDescription>
          <Trans
            i18nKey="pendingDeletionNotice"
            defaults="Your account and data will be permanently deleted on {deletionDate}."
            values={{ deletionDate }}
          />
        </FieldDescription>
      </FieldContent>
      <CancelAccountDeletionButton />
    </Field>
  );
}

export function DeleteAccountSetting({
  summary,
}: {
  summary?: React.ReactNode;
}) {
  return (
    <Field orientation="responsive">
      <SettingIcon>
        <TriangleAlertIcon />
      </SettingIcon>
      <FieldContent>
        <FieldTitle>
          <Trans i18nKey="deleteAccount" defaults="Delete account" />
        </FieldTitle>
        <FieldDescription>
          <Trans
            i18nKey="dangerZoneAccountDeletion"
            defaults="Delete your account and all data associated with it"
          />
        </FieldDescription>
      </FieldContent>
      <DeleteAccountDialog
        trigger={
          <Button className="text-destructive">
            <Trans i18nKey="deleteAccount" defaults="Delete account" />
          </Button>
        }
        summary={summary}
      />
    </Field>
  );
}
