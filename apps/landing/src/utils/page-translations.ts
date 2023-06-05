import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticTranslations: GetStaticProps = async (ctx) => {
  const locale = ctx.locale ?? "en";
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};
