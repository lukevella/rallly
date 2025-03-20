"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@rallly/ui/carousel";
import { Icon } from "@rallly/ui/icon";
import {
  CalendarCheck2Icon,
  CheckIcon,
  CopyIcon,
  SettingsIcon,
  TimerIcon,
} from "lucide-react";
import React from "react";

import { Trans } from "@/components/trans";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
  titleKey:
    | "featureNameFinalize"
    | "featureNameDuplicate"
    | "featureNameAdvancedSettings"
    | "featureNameExtendedPollLifetime";
  descriptionKey:
    | "featureDescriptionFinalize"
    | "featureDescriptionDuplicate"
    | "featureDescriptionAdvancedSettings"
    | "featureDescriptionExtendedPollLifetime";
};

const features: Feature[] = [
  {
    title: "Finalize Poll",
    description:
      "Lock your poll and notify participants when you've made your final decision.",
    icon: <CalendarCheck2Icon />,
    titleKey: "featureNameFinalize",
    descriptionKey: "featureDescriptionFinalize",
  },
  {
    title: "Duplicate Poll",
    description:
      "Create a copy of an existing poll to save time when creating similar events.",
    icon: <CopyIcon />,
    titleKey: "featureNameDuplicate",
    descriptionKey: "featureDescriptionDuplicate",
  },
  {
    title: "Advanced Settings",
    description:
      "Access additional options like hiding participants, requiring registration, and more.",
    icon: <SettingsIcon />,
    titleKey: "featureNameAdvancedSettings",
    descriptionKey: "featureDescriptionAdvancedSettings",
  },
  {
    title: "Extended Poll Lifetime",
    description:
      "Keep your polls active for longer periods without worrying about automatic deletion.",
    icon: <TimerIcon />,
    titleKey: "featureNameExtendedPollLifetime",
    descriptionKey: "featureDescriptionExtendedPollLifetime",
  },
];

export function FeatureCarousel() {
  return (
    <Carousel
      opts={{
        align: "center",
        loop: true,
      }}
    >
      <CarouselContent>
        {features.map((feature, index) => (
          <CarouselItem key={index}>
            <div className="bg-card flex flex-col items-center rounded-lg border p-6 text-center">
              <div className="text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-full border">
                <Icon variant="primary">{feature.icon}</Icon>
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                <Trans i18nKey={feature.titleKey} defaults={feature.title} />
              </h3>
              <p className="text-muted-foreground text-sm">
                <Trans
                  i18nKey={feature.descriptionKey}
                  defaults={feature.description}
                />
              </p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-4 flex justify-center gap-2">
        <CarouselPrevious
          variant="ghost"
          className="static h-8 w-8 translate-y-0"
        />
        <CarouselNext
          variant="ghost"
          className="static h-8 w-8 translate-y-0"
        />
      </div>
    </Carousel>
  );
}
