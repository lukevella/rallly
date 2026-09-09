import { PlusIcon } from "lucide-react";
import * as React from "react";
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
  name,
  children,
}: {
  question: React.ReactNode;
  /**
   * Shared across a group so the browser keeps only one item open. Injected by
   * `Faq`; the exclusive behaviour is lost if an item is rendered outside one.
   */
  name?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="faq-item group" name={name}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-base text-gray-800 [&::-webkit-details-marker]:hidden">
        {question}
        <PlusIcon className="size-4 shrink-0 text-gray-400 transition-transform duration-200 ease-out-expo group-open:rotate-45 motion-reduce:transition-none" />
      </summary>
      <p className="max-w-prose pb-5 text-gray-500 text-sm leading-relaxed sm:text-base">
        {children}
      </p>
    </details>
  );
}

export function Faq({
  name = "faq",
  children,
}: {
  /** Only needs setting if a page renders more than one FAQ group. */
  name?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="divide-y">
      {React.Children.map(children, (child) =>
        React.isValidElement<{ name?: string }>(child)
          ? React.cloneElement(child, { name })
          : child,
      )}
    </div>
  );
}

export async function FaqSection({
  locale,
  title,
  children,
}: {
  locale: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t, i18n } = await getTranslation<"home">(locale, "home");
  return (
    <SectionSplit>
      <SectionHeading>
        <SectionTitle>{title}</SectionTitle>
        <SectionDescription>
          <Trans
            t={t}
            i18n={i18n}
            ns="home"
            i18nKey="faqSectionNotAnswered"
            defaults="Not answered here? <0>Email us</0>."
            components={[
              <a
                key="support"
                className="text-gray-800 underline underline-offset-2 hover:text-gray-600"
                href="mailto:support@rallly.co"
              >
                Email us
              </a>,
            ]}
          />
        </SectionDescription>
      </SectionHeading>
      <SectionContent>
        <Faq>{children}</Faq>
      </SectionContent>
    </SectionSplit>
  );
}
