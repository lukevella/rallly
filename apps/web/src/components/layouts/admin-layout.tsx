import { useRouter } from "next/router";
import React from "react";

import { StandardLayout } from "@/components/layouts/standard-layout";
import { useUser } from "@/components/user-provider";
import { NextPageWithLayout } from "@/types";
import { trpc } from "@/utils/trpc/client";

const AdminLayout = (props: React.PropsWithChildren) => {
  const router = useRouter();

  const [urlId] = React.useState(router.query.urlId as string);
  const { user } = useUser();
  const { data } = trpc.polls.get.useQuery({ urlId });
  if (!data) {
    return null;
  }

  if (data.userId !== user.id) {
    return <>{props.children}</>;
  }

  return <StandardLayout>{props.children}</StandardLayout>;
};

export const getAdminLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return <AdminLayout>{page}</AdminLayout>;
  };
