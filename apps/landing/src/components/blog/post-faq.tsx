import type React from "react";
import { Faq, faqPageSchema } from "@/components/home/faq";
import { JsonLd } from "@/components/json-ld";

export function PostFaq({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 border-y">
      <JsonLd data={faqPageSchema(children)} />
      <Faq>{children}</Faq>
    </div>
  );
}
