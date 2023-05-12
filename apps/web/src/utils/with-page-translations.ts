import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetStaticProps,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const withPageTranslations = (): GetServerSideProps => {
  return async (ctx: GetServerSidePropsContext) => {
    const locale = ctx.locale ?? "en";
    const translations = await serverSideTranslations(locale);
    return {
      props: {
        ...translations,
      },
    };
  };
};

export const getStaticTranslations: GetStaticProps = async (ctx) => {
  const locale = ctx.locale ?? "en";
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};
