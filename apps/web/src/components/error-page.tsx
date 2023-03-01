import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { Button } from "@/components/button";
import Chat from "@/components/icons/chat.svg";
import EmojiSad from "@/components/icons/emoji-sad.svg";

import { showCrispChat } from "./crisp-chat";

export interface ComponentProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const ErrorPage: React.FunctionComponent<ComponentProps> = ({
  icon: Icon = EmojiSad,
  title,
  description,
}) => {
  const { t } = useTranslation("errors");
  return (
    <div className="mx-auto flex h-full max-w-full items-center justify-center px-4 py-8 lg:w-[1024px]">
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="flex items-start">
        <div className="text-center">
          <Icon className="mb-4 inline-block w-24 text-slate-400" />
          <div className="text-primary-500 mb-2 text-3xl font-bold ">
            {title}
          </div>
          <p>{description}</p>
          <div className="flex justify-center space-x-3">
            <Link href="/" passHref={true} className="btn-default">
              {t("goToHome")}
            </Link>
            <Button icon={<Chat />} onClick={showCrispChat}>
              {t("startChat")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
