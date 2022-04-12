import * as React from "react";
import PageLayout from "./page-layout";
import { Disclosure } from "@headlessui/react";
import Chat from "@/components/icons/chat.svg";
import Button from "@/components/button";
import { showCrispChat } from "./crisp-chat";
import { Trans, useTranslation } from "next-i18next";

const Support: React.VoidFunctionComponent = () => {
  const { t } = useTranslation("support");
  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-transparent via-white to-transparent">
        <div className="py-16 px-8 mx-auto max-w-7xl">
          <h1 className="text-5xl">Support</h1>
          <div className="lg:flex py-16">
            <div className="grow mb-8">
              <h2 className="text-3xl mb-4">Troubleshooting</h2>
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
                  <Trans t={t} i18nKey="wrongDaysShownQuestion" />
                </Disclosure.Button>
                <Disclosure.Panel className="text py-2 px-3">
                  <Trans
                    t={t}
                    i18nKey="wrongDaysShownAnswer"
                    components={{ b: <strong /> }}
                  />
                </Disclosure.Panel>
              </Disclosure>
              <h2 className="text-3xl mb-4">General</h2>
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
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
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
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
                        <a href="https://github.com/lukevella/Rallly/discussions" />
                      ),
                    }}
                  />
                </Disclosure.Panel>
              </Disclosure>
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
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
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
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
              <h2 className="text-3xl mb-4 mt-8">Privacy & Security</h2>
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
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
              <h2 className="text-3xl mb-4 mt-8">Self-hosting</h2>
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
                  {t("selfHostQuestion")}
                </Disclosure.Button>
                <Disclosure.Panel className="text py-2 px-3">
                  <Trans
                    t={t}
                    i18nKey="selfHostAnswer"
                    components={{
                      a: <a href="https://github.com/lukevella/Rallly" />,
                    }}
                  />
                </Disclosure.Panel>
              </Disclosure>
              <Disclosure as="div" className="bg-slate-50 p-2 rounded-lg mb-4">
                <Disclosure.Button className="font-medium text-lg py-2 px-3 rounded-lg active:bg-slate-200 block w-full text-left font-slate hover:text-indigo-500 hover:bg-slate-100 cursor-pointer">
                  {t("canYouHelpMeSetUpRalllyQuestion")}
                </Disclosure.Button>
                <Disclosure.Panel className="text py-2 px-3">
                  <Trans
                    t={t}
                    i18nKey="canYouHelpMeSetUpRalllyAnswer"
                    components={{
                      a: (
                        <a href="https://github.com/lukevella/Rallly/discussions" />
                      ),
                    }}
                  />
                </Disclosure.Panel>
              </Disclosure>
            </div>
            <div className="lg:ml-16 shrink-0 lg:w-96">
              <div className="p-8 bg-white rounded-xl shadow-md">
                <div className="flex lg:flex-col items-start max-w-3xl">
                  <Chat className="hidden sm:block w-20 text-indigo-500 shrink-0 mr-8 mb-8" />
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
      </div>
    </PageLayout>
  );
};

export default Support;
