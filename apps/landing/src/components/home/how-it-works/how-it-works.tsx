import { ArrowRightIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeading,
  SectionTitle,
} from "@/components/section";
import { getTranslation } from "@/i18n/server";
import type { StepKey } from "./step-stage";
import { StepCue, StepStage } from "./step-stage";

// The meeting poll walkthrough, shared by the home page and the SEO landing
// pages. Owns its copy, unlike the rest of the landing components, so every
// page renders the same three steps.
export const HowItWorks = async ({ locale }: { locale: string }) => {
  const { t } = await getTranslation<"home">(locale, "home");
  const steps: {
    key: StepKey;
    title: React.ReactNode;
    description: React.ReactNode;
  }[] = [
    {
      key: "create",
      title: (
        <Trans
          t={t}
          ns="home"
          i18nKey="howItWorksStep1Title"
          defaults="Create a poll"
        />
      ),
      description: (
        <Trans
          t={t}
          ns="home"
          i18nKey="howItWorksStep1Description"
          defaults="Pick a few times that could work. Add a title and you're done. No account needed."
        />
      ),
    },
    {
      key: "share",
      title: (
        <Trans
          t={t}
          ns="home"
          i18nKey="howItWorksStep2Title"
          defaults="Share the link"
        />
      ),
      description: (
        <Trans
          t={t}
          ns="home"
          i18nKey="howItWorksStep2Description"
          defaults="Send it over email, Slack, or WhatsApp. Participants don't need to sign up."
        />
      ),
    },
    {
      key: "decide",
      title: (
        <Trans
          t={t}
          ns="home"
          i18nKey="howItWorksStep3Title"
          defaults="Vote and decide"
        />
      ),
      description: (
        <Trans
          t={t}
          ns="home"
          i18nKey="howItWorksStep3Description"
          defaults="Everyone marks the times that work for them, and the best option shows at a glance."
        />
      ),
    },
  ];

  return (
    <Section id="how-it-works" className="scroll-mt-20">
      <SectionHeading>
        <SectionTitle>
          <Trans
            t={t}
            ns="home"
            i18nKey="howItWorksTitle"
            defaults="How it works"
          />
        </SectionTitle>
        <SectionDescription>
          <Trans
            t={t}
            ns="home"
            i18nKey="howItWorksDescription"
            defaults="Scheduling a group meeting takes three steps and less than a minute."
          />
        </SectionDescription>
        <a
          className="inline-flex items-center gap-1.5 font-medium text-gray-800 text-sm hover:text-gray-600"
          href="https://support.rallly.co/workflow/create"
        >
          <Trans
            t={t}
            ns="home"
            i18nKey="howItWorksLearnMore"
            defaults="Learn more"
          />
          <ArrowRightIcon className="size-4" />
        </a>
      </SectionHeading>
      <SectionContent>
        {/* Below lg the three steps stay side by side and scroll horizontally,
            bleeding past the page gutters so the next card peeks in. */}
        <StepCue>
          <dl className="-mx-4 grid snap-x snap-mandatory scroll-px-4 grid-cols-[repeat(3,min(75vw,20rem))] grid-rows-[auto_auto] gap-x-4 gap-y-1 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid-cols-3 lg:overflow-x-visible lg:px-0">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className="row-span-2 grid snap-start grid-rows-subgrid rounded-2xl border bg-white p-1"
              >
                <div className="space-y-4 rounded-xl border bg-gray-100 p-4">
                  <div className="font-mono text-gray-400 text-xs uppercase tracking-wide">
                    <Trans
                      t={t}
                      ns="home"
                      i18nKey="howItWorksStepLabel"
                      defaults="Step {number}"
                      values={{ number: `0${index + 1}` }}
                    />
                  </div>
                  <StepStage
                    step={step.key}
                    index={index}
                    className="flex h-64 items-center justify-center"
                  />
                </div>
                <div className="p-3">
                  <dt className="font-medium text-gray-900">{step.title}</dt>
                  <dd className="mt-2 text-pretty text-base/6 text-gray-500 sm:text-sm/5">
                    {step.description}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </StepCue>
      </SectionContent>
    </Section>
  );
};
