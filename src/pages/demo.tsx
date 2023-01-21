import { NextPage } from "next";
import { useRouter } from "next/router";
import { usePlausible } from "next-plausible";
import useTranslation from "next-translate/useTranslation";
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

export default Demo;
