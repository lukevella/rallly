import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Home from "@/components/home";

const Page = () => <Home />;

export default Page;

export const getServerSideProps: GetServerSideProps = async ({
  locale = "en",
}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "homepage"])),
    },
  };
};
