import { signOut } from "next-auth/react";
import React from "react";

import { StandardLayout } from "@/components/layouts/standard-layout";
import { NextPageWithLayout } from "@/types";

const Page: NextPageWithLayout = () => {
  React.useEffect(() => {
    signOut({ callbackUrl: "/login" });
  });
  return null;
};

Page.getLayout = (page) => {
  return <StandardLayout hideNav={true}>{page}</StandardLayout>;
};

export default Page;
