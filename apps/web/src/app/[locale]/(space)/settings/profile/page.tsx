import type { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/i18n/server";

import { getUser } from "@/data/get-user";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { TrashIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import {
  SettingsContent,
  SettingsSection,
} from "../components/settings-layout";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { ProfileEmailAddress } from "./profile-email-address";
import { ProfileSettings } from "./profile-settings";

export default async function Page() {
  const user = await getUser();
  return (
    <SettingsContent>
      <SettingsSection
        title={<Trans i18nKey="profile" defaults="Profile" />}
        description={
          <Trans
            i18nKey="profileDescription"
            defaults="Set your public profile information"
          />
        }
      >
        <ProfileSettings name={user.name} image={user.image} />
      </SettingsSection>
      <SettingsSection
        title={<Trans i18nKey="profileEmailAddress" defaults="Email Address" />}
        description={
          <Trans
            i18nKey="profileEmailAddressDescription"
            defaults="Your email address is used to log in to your account"
          />
        }
      >
        <ProfileEmailAddress />
      </SettingsSection>
      <hr />
      <SettingsSection
        title={<Trans i18nKey="dangerZone" defaults="Danger Zone" />}
        description={
          <Trans
            i18nKey="dangerZoneAccount"
            defaults="Delete your account permanently. This action cannot be undone."
          />
        }
      >
        <DeleteAccountDialog email={user.email}>
          <DialogTrigger asChild>
            <Button className="text-destructive">
              <TrashIcon className="size-4" />
              <Trans i18nKey="deleteAccount" defaults="Delete Account" />
            </Button>
          </DialogTrigger>
        </DeleteAccountDialog>
      </SettingsSection>
    </SettingsContent>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
