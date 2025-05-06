"use client";
import { useLocalStorage } from "react-use";

import { Trans } from "@/components/trans";
import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { HeartIcon } from "lucide-react";
import Link from "next/link";

export function FeedbackAlert() {
  const [value, setValue] = useLocalStorage<string>("home_feedback_dismissed");
  const posthog = usePostHog();

  if (value) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start border text-sm bg-gray-50 border-gray-200 p-4 rounded-xl gap-4">
      <div className="hidden sm:block">
        <HeartIcon className="size-4 text-pink-600 opacity-75" />
      </div>
      <div className="flex-1">
        <h2 className="font-semibold leading-none">
          <Trans i18nKey="helpUsImprove" defaults="Help us improve" />
        </h2>
        <p className="opacity-75 mt-1.5">
          <Trans
            i18nKey="helpUsImproveDesc"
            defaults="Take a few minutes to share your feedback and help us shape the future of Rallly."
          />
        </p>
      </div>
      <div className="flex items-center flex-row-reverse sm:flex-row gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setValue("1");
            posthog.capture("feedback_dismissed");
          }}
        >
          <Trans i18nKey="dismissFeedback" defaults="Don't show again" />
        </Button>
        <Button variant="primary" asChild>
          <Link
            href="https://senja.io/p/rallly/r/uwwiXJ"
            type="button"
            id="feedback-survey-button"
          >
            <Trans i18nKey="giveFeedback" defaults="Give feedback" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
