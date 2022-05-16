import { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { usePlausible } from "next-plausible";
import React from "react";
import { useMount } from "react-use";

import FullPageLoader from "../components/full-page-loader";
import { trpc } from "../utils/trpc";

const Demo: NextPage = () => {
  const { t } = useTranslation("app");

  const router = useRouter();
  const plausible = usePlausible();
  const createDemo = trpc.useMutation(["polls.demo.create"]);

  useMount(async () => {
    const urlId = await createDemo.mutateAsync();
    plausible("Create demo poll");
    router.replace(`/admin/${urlId}`);
  });

  return <FullPageLoader>{t("creatingDemo")}</FullPageLoader>;
};

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["app"])),
    },
  };
};

export default Demo;
