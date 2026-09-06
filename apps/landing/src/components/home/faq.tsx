import { PlusIcon } from "lucide-react";
import type * as React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionSplit,
  SectionTitle,
} from "@/components/section";
import { getTranslation } from "@/i18n/server";

export function FaqItem({
  question,
  children,
}: {
  question: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-base text-gray-800 [&::-webkit-details-marker]:hidden">
        {question}
        <PlusIcon className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-45" />
      </summary>
      <p className="max-w-prose pb-5 text-gray-500 text-sm leading-relaxed sm:text-base">
        {children}
      </p>
    </details>
  );
}

export function Faq({ children }: { children: React.ReactNode }) {
  return <div className="divide-y">{children}</div>;
}

export async function FaqSection({
  locale,
  title,
  description,
  children,
}: {
  locale: string;
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t, i18n } = await getTranslation<"home">(locale, "home");
  return (
    <SectionSplit>
      <SectionHeading>
        <SectionTitle>{title}</SectionTitle>
        <SectionDescription>{description}</SectionDescription>
        <p className="max-w-prose text-pretty text-gray-500 text-sm sm:text-base">
          <Trans
            t={t}
            i18n={i18n}
            ns="home"
            i18nKey="faqSectionContact"
            defaults="Something we missed? <0>Let us know</0>. We're here to help."
            components={[
              <a
                key="support"
                className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                href="mailto:support@rallly.co"
              >
                Let us know
              </a>,
            ]}
          />
        </p>
      </SectionHeading>
      <SectionContent>
        <Faq>{children}</Faq>
      </SectionContent>
    </SectionSplit>
  );
}
