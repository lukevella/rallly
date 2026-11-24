import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@rallly/ui/field";
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

  return accounts.map((account) => {
    const name = providerName(account.provider);
    return (
      <Field key={account.id} orientation="responsive">
        <SettingIcon>
          <SSOImage provider={account.provider} />
        </SettingIcon>
        <FieldContent>
          <FieldTitle>{name}</FieldTitle>
          <FieldDescription>
            <Trans
              i18nKey="signInAccountSettingHint"
              defaults="You can sign in with this account."
            />
          </FieldDescription>
        </FieldContent>
        <UnlinkSignInAccountButton
          accountId={account.id}
          providerName={name}
          email={user.email}
        />
      </Field>
    );
  });
}
