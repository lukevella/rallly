import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import StandardLayout from "./standard-layout";
import Button from "@/components/button";
import Chat from "@/components/icons/chat.svg";
import EmojiSad from "@/components/icons/emoji-sad.svg";
import { showCrispChat } from "./crisp-chat";

export interface ComponentProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const ErrorPage: React.VoidFunctionComponent<ComponentProps> = ({
  icon: Icon = EmojiSad,
  title,
  description,
}) => {
  return (
    <StandardLayout>
      <div className="h-full bg-gray-50 px-4 py-8 flex items-center justify-center lg:w-[1024px] max-w-full">
        <Head>
          <title>{title}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="flex items-start">
          <div className="text-center">
            <Icon className="w-24 inline-block mb-4 text-slate-400" />
            <div className="text-3xl font-bold uppercase text-indigo-500 ">
              {title}
            </div>
            <p>{description}</p>
            <div className="flex space-x-3 justify-center">
              <Link href="/" passHref={true}>
                <a className="btn-default">Go to home</a>
              </Link>
              <Button icon={<Chat />} onClick={showCrispChat}>
                Start chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default ErrorPage;
