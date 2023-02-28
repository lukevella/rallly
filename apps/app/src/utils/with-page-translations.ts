import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const withPageTranslations = (
  namespaces: string[],
): GetServerSideProps => {
  return async (ctx: GetServerSidePropsContext) => {
    const locale = ctx.locale ?? "en";
    return {
      props: {
        ...(await serverSideTranslations(locale, namespaces)),
      },
    };
  };
};
