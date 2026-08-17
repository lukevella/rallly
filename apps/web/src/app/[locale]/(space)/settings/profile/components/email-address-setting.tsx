import { Button } from "@rallly/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@rallly/ui/field";
import { MailIcon } from "lucide-react";
import { SettingIcon } from "@/components/setting-icon";
import { Trans } from "@/i18n/client";
import { ChangeEmailDialog } from "./change-email-dialog";

export function EmailAddressSetting({ email }: { email: string }) {
  return (
    <Field orientation="responsive">
      <SettingIcon>
        <MailIcon />
      </SettingIcon>
      <FieldContent>
        <FieldTitle>
          <Trans i18nKey="profileEmailAddress" defaults="Email address" />
        </FieldTitle>
        <FieldDescription>{email}</FieldDescription>
      </FieldContent>
      <ChangeEmailDialog
        currentEmail={email}
        trigger={
          <Button>
            <Trans i18nKey="changeEmail" defaults="Change email" />
          </Button>
        }
      />
    </Field>
  );
}
