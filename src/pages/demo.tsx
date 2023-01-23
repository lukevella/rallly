import { NextPage } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import posthog from "posthog-js";
import React from "react";
import { useMount } from "react-use";

import FullPageLoader from "../components/full-page-loader";
import { trpc } from "../utils/trpc";
import { withPageTranslations } from "../utils/with-page-translations";

const Demo: NextPage = () => {
  const { t } = useTranslation("app");

  const router = useRouter();
  const createDemo = trpc.useMutation(["polls.demo.create"]);

  useMount(async () => {
    const urlId = await createDemo.mutateAsync();
    posthog.capture("create demo poll");
    router.replace(`/admin/${urlId}`);
  });

  return <FullPageLoader>{t("creatingDemo")}</FullPageLoader>;
};

export const getServerSideProps = withPageTranslations(["common", "app"]);

export default Demo;
