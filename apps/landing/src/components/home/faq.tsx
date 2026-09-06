import { PlusIcon } from "lucide-react";
import type * as React from "react";

export function FaqItem({
  question,
  children,
}: {
  question: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className="group [counter-increment:faq]">
      <summary className="flex cursor-pointer list-none items-start gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="w-8 shrink-0 pt-1 font-mono text-gray-400 text-xs tabular-nums before:content-[counter(faq,decimal-leading-zero)]"
        />
        <span className="flex-1 font-medium text-base text-gray-800">
          {question}
        </span>
        <PlusIcon className="mt-1 size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-45" />
      </summary>
      <p className="max-w-prose pb-5 pl-12 text-gray-500 text-sm leading-relaxed sm:text-base">
        {children}
      </p>
    </details>
  );
}

export function Faq({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y border-y [counter-reset:faq]">{children}</div>
  );
}
