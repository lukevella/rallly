import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

import type { Params } from "@/app/[locale]/types";
import { UserLanguageSwitcher } from "@/app/components/user-language-switcher";
import { getServerSession } from "@/auth";
import { IfCloudHosted } from "@/contexts/environment";
import { getTranslation } from "@/i18n/server";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const session = await getServerSession();
  const { t } = await getTranslation(params.locale);
  if (session?.user.email) {
    return redirect("/", RedirectType.replace);
  }

  return (
    <div className="relative flex h-screen flex-col gap-8 p-4 sm:p-6">
      <div className="flex justify-between">
        <span className="flex basis-1/3 items-center">
          <Link href="/">
            <Image
              src="/images/logo-mark.svg"
              alt="Rallly"
              width={32}
              height={32}
            />
          </Link>
        </span>
        <span className="flex basis-1/3 items-center justify-center"></span>
        <span className="flex basis-1/3 items-center justify-end">
          <UserLanguageSwitcher />
        </span>
      </div>
      <div className="grow">
        <div className="flex h-full w-full justify-center sm:items-center">
          <div className="w-full space-y-8 sm:max-w-sm">{children}</div>
        </div>
      </div>
      <div className="text-muted-foreground flex flex-col items-center gap-6 text-sm">
        <div className="flex items-center gap-6">
          <IfCloudHosted>
            <a className="hover:underline" href="https://rallly.co/terms">
              <Trans t={t} ns="app" i18nKey="terms" defaults="Terms" />
            </a>
            <a className="hover:underline" href="https://rallly.co/privacy">
              <Trans
                t={t}
                ns="app"
                i18nKey="privacyPolicy"
                defaults="Privacy Policy"
              />
            </a>
          </IfCloudHosted>
          <a className="hover:underline" href="https://support.rallly.co">
            <Trans t={t} ns="app" i18nKey="support" defaults="Support" />
          </a>
        </div>
        <div>v{process.env.NEXT_PUBLIC_APP_VERSION}</div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: {
    template: "%s - Rallly",
    default: "Rallly",
  },
};
