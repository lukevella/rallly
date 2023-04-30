import { EmojiSadIcon } from "@rallly/icons";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

export interface ComponentProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const ErrorPage: React.FunctionComponent<ComponentProps> = ({
  icon: Icon = EmojiSadIcon,
  title,
  description,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="flex items-start">
        <div className="text-center">
          <Icon className="mb-4 inline-block w-24 text-slate-500" />
          <div className="text-primary-600 mb-2 text-3xl font-bold ">
            {title}
          </div>
          <p>{description}</p>
          <div className="flex justify-center space-x-3">
            <Link href="/" className="btn-primary">
              {t("errors_goToHome")}
            </Link>
            <Link
              href="https://support.rallly.co"
              passHref={true}
              className="btn-default"
            >
              {t("common_support")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
