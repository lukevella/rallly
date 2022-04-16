import { Disclosure } from "@headlessui/react";
import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import Button from "@/components/button";
import Chat from "@/components/icons/chat.svg";

import { showCrispChat } from "./crisp-chat";
import PageLayout from "./page-layout";

const Support: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("support");
  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-8 pt-16">
        <h1 className="text-5xl">Support</h1>
        <div className="py-16 lg:flex">
          <div className="mb-8 grow">
            <h2 className="mb-4 text-3xl">General</h2>
            <Disclosure
              as="div"
              className="mb-4 rounded-lg bg-white p-2 shadow-md"
            >
              <Disclosure.Button className="font-slate block w-full cursor-pointer rounded-md py-2 px-3 text-left text-lg font-medium hover:bg-slate-50 hover:text-indigo-500 active:bg-slate-100">
                <Trans t={t} i18nKey="howDoIShareQuestion" />
              </Disclosure.Button>
              <Disclosure.Panel className="text py-2 px-3">
                <Trans
                  t={t}
                  i18nKey="howDoIShareAnswer"
                  components={{ b: <strong /> }}
                />
              </Disclosure.Panel>
            </Disclosure>
            <Disclosure
              as="div"
              className="mb-4 rounded-lg bg-white p-2 shadow-md"
            >
              <Disclosure.Button className="font-slate block w-full cursor-pointer rounded-md py-2 px-3 text-left text-lg font-medium hover:bg-slate-50 hover:text-indigo-500 active:bg-slate-100">
                <Trans
                  t={t}
                  i18nKey="canRalllyDoQuestion"
                  components={{ em: <em /> }}
                />
              </Disclosure.Button>
              <Disclosure.Panel className="text py-2 px-3">
                <Trans
                  t={t}
                  i18nKey="canRalllyDoAnswer"
                  components={{
                    a: (
                      <a href="https://github.com/lukevella/rallly/discussions" />
                    ),
                  }}
                />
              </Disclosure.Panel>
            </Disclosure>
            <Disclosure
              as="div"
              className="mb-4 rounded-lg bg-white p-2 shadow-md"
            >
              <Disclosure.Button className="font-slate block w-full cursor-pointer rounded-md py-2 px-3 text-left text-lg font-medium hover:bg-slate-50 hover:text-indigo-500 active:bg-slate-100">
                {t("legacyPollsQuestion")}
              </Disclosure.Button>
              <Disclosure.Panel className="text py-2 px-3">
                <Trans
                  t={t}
                  i18nKey="legacyPollsAnswer"
                  components={{ a: <a href="mailto:support@rallly.co" /> }}
                />
              </Disclosure.Panel>
            </Disclosure>
            <Disclosure
              as="div"
              className="mb-4 rounded-lg bg-white p-2 shadow-md"
            >
              <Disclosure.Button className="font-slate block w-full cursor-pointer rounded-md py-2 px-3 text-left text-lg font-medium hover:bg-slate-50 hover:text-indigo-500 active:bg-slate-100">
                {t("contributeQuestion")}
              </Disclosure.Button>
              <Disclosure.Panel className="text py-2 px-3">
                <Trans
                  t={t}
                  i18nKey="contributeAnswer"
                  components={{
                    a: <a href="https://github.com/sponsors/lukevella" />,
                  }}
                />
              </Disclosure.Panel>
            </Disclosure>
            <h2 className="mb-4 mt-8 text-3xl">Privacy & Security</h2>
            <Disclosure
              as="div"
              className="mb-4 rounded-lg bg-white p-2 shadow-md"
            >
              <Disclosure.Button className="font-slate block w-full cursor-pointer rounded-md py-2 px-3 text-left text-lg font-medium hover:bg-slate-50 hover:text-indigo-500 active:bg-slate-100">
                {t("isMyDataSafeQuestion")}
              </Disclosure.Button>
              <Disclosure.Panel className="text py-2 px-3">
                <Trans
                  t={t}
                  i18nKey="isMyDataSafeAnswer"
                  components={{ a: <a href="mailto:support@rallly.co" /> }}
                />
              </Disclosure.Panel>
            </Disclosure>
            <h2 className="mb-4 mt-8 text-3xl">Self-hosting</h2>
            <Disclosure
              as="div"
              className="mb-4 rounded-lg bg-white p-2 shadow-md"
            >
              <Disclosure.Button className="font-slate block w-full cursor-pointer rounded-md py-2 px-3 text-left text-lg font-medium hover:bg-slate-50 hover:text-indigo-500 active:bg-slate-100">
                {t("selfHostQuestion")}
              </Disclosure.Button>
              <Disclosure.Panel className="text py-2 px-3">
                <Trans
                  t={t}
                  i18nKey="selfHostAnswer"
                  components={{
                    a: <a href="https://github.com/lukevella/rallly" />,
                  }}
                />
              </Disclosure.Panel>
            </Disclosure>
            <Disclosure
              as="div"
              className="mb-4 rounded-lg bg-white p-2 shadow-md"
            >
              <Disclosure.Button className="font-slate block w-full cursor-pointer rounded-md py-2 px-3 text-left text-lg font-medium hover:bg-slate-50 hover:text-indigo-500 active:bg-slate-100">
                {t("canYouHelpMeSetUpRalllyQuestion")}
              </Disclosure.Button>
              <Disclosure.Panel className="text py-2 px-3">
                <Trans
                  t={t}
                  i18nKey="canYouHelpMeSetUpRalllyAnswer"
                  components={{
                    a: (
                      <a href="https://github.com/lukevella/rallly/discussions" />
                    ),
                  }}
                />
              </Disclosure.Panel>
            </Disclosure>
          </div>
          <div className="shrink-0 lg:ml-16 lg:w-96">
            <div className="rounded-xl bg-white p-8 shadow-md">
              <div className="flex max-w-3xl items-start lg:flex-col">
                <Chat className="mr-8 mb-8 hidden w-20 shrink-0 text-indigo-500 sm:block" />
                <div>
                  <h2 className="mb-2">{t("supportContactTitle")}</h2>
                  <p className="text">
                    <Trans
                      t={t}
                      i18nKey="supportContactMessage"
                      components={{
                        a: <a href="mailto:support@rallly.co" />,
                      }}
                    />
                  </p>
                  <Button icon={<Chat />} onClick={showCrispChat}>
                    {t("chatWithSupport")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Support;
