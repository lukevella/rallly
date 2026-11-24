import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@rallly/ui/field";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { SettingIcon } from "@/components/setting-icon";
import { env } from "@/env";
import { SSOImage } from "@/features/auth/components/sso-provider";
import { loadSignInAccounts, loadUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { UnlinkSignInAccountButton } from "./unlink-sign-in-account-button";

function providerName(provider: string) {
  switch (provider) {
    case "google":
      return "Google";
    case "microsoft":
      return "Microsoft";
    case "oidc":
      return env.OIDC_NAME;
    default:
      return provider;
  }
}

export async function SignInAccounts() {
  const [user, accounts] = await Promise.all([
    loadUser(),
    loadSignInAccounts(),
  ]);

  if (accounts.length === 0) {
    return null;
  }

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="linkedAccounts" defaults="Linked accounts" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="linkedAccountsDescription"
            defaults="Accounts you can use to sign in to Rallly"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup variant="divided">
          {accounts.map((account) => {
            const name = providerName(account.provider);
            return (
              <Field key={account.id} orientation="responsive">
                <SettingIcon>
                  <SSOImage provider={account.provider} />
                </SettingIcon>
                <FieldContent>
                  <FieldTitle>{name}</FieldTitle>
                  <FieldDescription>
                    {account.email ?? (
                      <Trans
                        i18nKey="signInAccountSettingHint"
                        defaults="You can sign in with this account."
                      />
                    )}
                  </FieldDescription>
                </FieldContent>
                <UnlinkSignInAccountButton
                  accountId={account.id}
                  providerName={name}
                  email={user.email}
                />
              </Field>
            );
          })}
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
