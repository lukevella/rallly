import { PlusIcon } from "lucide-react";
import type * as React from "react";
import {
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionSplit,
  SectionTitle,
} from "@/components/section";

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

export function FaqSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SectionSplit>
      <SectionHeading>
        <SectionTitle>{title}</SectionTitle>
        <SectionDescription>{description}</SectionDescription>
      </SectionHeading>
      <SectionContent>
        <Faq>{children}</Faq>
      </SectionContent>
    </SectionSplit>
  );
}
