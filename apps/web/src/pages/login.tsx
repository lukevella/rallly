import { Loader2Icon } from "@rallly/icons";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { PageDialog } from "@/components/page-dialog";
import { useWhoAmI } from "@/contexts/whoami";

import { getStaticTranslations } from "../utils/with-page-translations";

const Redirect = () => {
  const router = useRouter();

  React.useEffect(() => {
    router.replace((router.query.redirect as string) ?? "/");
  });

  return (
    <PageDialog>
      <Loader2Icon className="h-10 w-10 animate-spin text-gray-400" />
    </PageDialog>
  );
};

const Page: NextPage<{ referer: string | null }> = () => {
  const { t } = useTranslation();
  const whoami = useWhoAmI();

  if (whoami?.isGuest === false) {
    return <Redirect />;
  }

  return (
    <>
      <Head>
        <title>{t("login")}</title>
      </Head>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
};

export default Page;

export const getStaticProps = getStaticTranslations;
