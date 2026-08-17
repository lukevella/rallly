import { Button } from "@rallly/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@rallly/ui/field";
import { TriangleAlertIcon } from "lucide-react";
import { SettingIcon } from "@/components/setting-icon";
import { Trans } from "@/i18n/client";
import { DeleteAccountDialog } from "./delete-account-dialog";

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
