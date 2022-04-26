import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getServerSideProps: GetServerSideProps = async ({
  locale = "en",
  query,
}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["app"])),
      ...query,
    },
  };
};

// We disable SSR because the data on this page relies on sessionStore
export default dynamic(() => import("@/components/create-poll"), {
  ssr: false,
});
