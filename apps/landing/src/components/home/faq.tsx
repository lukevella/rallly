import { PlusIcon } from "lucide-react";
import * as React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { JsonLd } from "@/components/json-ld";
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

type TransProps = {
  t: (key: string, options: Record<string, unknown>) => string;
  ns?: string;
  i18nKey: string;
  defaults?: string;
  values?: Record<string, unknown>;
};

/**
 * Reads the text a FAQ question or answer renders, so structured data always
 * matches the visible copy in the page's language.
 */
function toPlainText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(toPlainText).join("");
  }
  if (!React.isValidElement(node)) {
    return "";
  }
  if (node.type === Trans) {
    const { t, ns, i18nKey, defaults, values } = node.props as TransProps;
    return t(i18nKey, { ns, defaultValue: defaults, ...values }).replace(
      /<\/?[\w-]+\s*\/?>/g,
      "",
    );
  }
  return toPlainText((node.props as { children?: React.ReactNode }).children);
}

function faqPageSchema(children: React.ReactNode) {
  const mainEntity = React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<React.ComponentProps<typeof FaqItem>>(child)) {
      return [];
    }
    const name = toPlainText(child.props.question).replace(/\s+/g, " ").trim();
    const text = toPlainText(child.props.children).replace(/\s+/g, " ").trim();
    return name && text
      ? [
          {
            "@type": "Question",
            name,
            acceptedAnswer: { "@type": "Answer", text },
          },
        ]
      : [];
  });
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
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
      <JsonLd data={faqPageSchema(children)} />
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
