import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@rallly/ui/field";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { SettingIcon } from "@/components/setting-icon";
import { env } from "@/env";
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

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "google" || provider === "microsoft") {
    return (
      <Image
        src={`/static/${provider}.svg`}
        width={20}
        height={20}
        alt=""
        unoptimized
      />
    );
  }

  return <UserIcon />;
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
          <ProviderIcon provider={account.provider} />
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
