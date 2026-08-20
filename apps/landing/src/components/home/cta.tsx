import { cn } from "@rallly/ui";
import type * as React from "react";
import { CtaButton } from "@/components/home/cta-button";
import { FadeIn } from "@/components/home/fade-in";
import { handwritten } from "@/fonts/handwritten";

export function Cta({
  title,
  description,
  buttonLabel,
  hint,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  buttonLabel: React.ReactNode;
  hint: React.ReactNode;
}) {
  return (
    <FadeIn amount="all" captureOnEnter="landing:final_cta_view">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <h2 className="text-balance font-medium text-2xl text-gray-800 leading-tight tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-prose text-pretty text-base/6 text-gray-500 sm:text-balance sm:text-lg">
          {description}
        </p>
      </div>
      <div className="mt-6 flex flex-col items-start gap-4">
        <CtaButton size="lg" captureEvent="landing:final_cta_click">
          {buttonLabel}
        </CtaButton>
        <p
          className={cn(
            "whitespace-nowrap text-gray-600 text-xs",
            handwritten.className,
            "decoration underline decoration-2 decoration-gray-300 underline-offset-8",
          )}
        >
          {hint}
        </p>
      </div>
    </FadeIn>
  );
}
