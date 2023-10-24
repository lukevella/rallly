import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticTranslations: GetStaticProps = async (ctx) => {
  return {
    props: {
      ...(await getServerSideTranslations(ctx)),
    },
  };
};

export const getServerSideTranslations = async ({
  locale,
}: {
  locale?: string;
}) => {
  return await serverSideTranslations(locale ?? "en");
};
