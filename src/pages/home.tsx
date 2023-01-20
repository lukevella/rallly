import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Home from "@/components/home";

export default function Page() {
  return <Home />;
}

export const getServerSideProps: GetServerSideProps = async ({
  locale = "en",
}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "homepage"])),
    },
  };
};
