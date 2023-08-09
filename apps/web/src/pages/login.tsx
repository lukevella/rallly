import { Loader2Icon } from "@rallly/icons";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { LoginForm } from "@/components/auth/auth-forms";
import { AuthLayout } from "@/components/auth/auth-layout";
import { StandardLayout } from "@/components/layouts/standard-layout";
import { PageDialog } from "@/components/page-dialog";
import { useWhoAmI } from "@/contexts/whoami";
import { NextPageWithLayout } from "@/types";

import { getStaticTranslations } from "../utils/with-page-translations";

const Redirect = () => {
  const router = useRouter();
  const [redirect] = React.useState(router.query.redirect as string);

  React.useEffect(() => {
    router.replace(redirect ?? "/");
  }, [router, redirect]);

  return (
    <PageDialog>
      <Loader2Icon className="h-10 w-10 animate-spin text-gray-400" />
    </PageDialog>
  );
};

const Page: NextPageWithLayout<{ referer: string | null }> = () => {
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

Page.getLayout = (page) => {
  return <StandardLayout hideNav={true}>{page}</StandardLayout>;
};

export default Page;

export const getStaticProps = getStaticTranslations;
