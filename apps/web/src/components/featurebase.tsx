import { trpc } from "@rallly/backend";
import { HelpCircleIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import Script from "next/script";
import React from "react";

import Tooltip from "@/components/tooltip";
import { Trans } from "@/components/trans";
import { isFeedbackEnabled } from "@/utils/constants";

const FeaturebaseScript = () => (
  <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
);

export const Changelog = ({ className }: { className?: string }) => {
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function (...args: unknown[]) {
        (win.Featurebase.q = win.Featurebase.q || []).push(args);
      };
    }

    win.Featurebase("initialize_changelog_widget", {
      organization: "rallly", // Replace this with your featurebase organization name
      placement: "bottom", // Choose between right, left, top, bottom placement
      theme: "light", // Choose between dark or light theme
    });
  }, []);

  if (!isFeedbackEnabled) return null;

  return (
    <>
      <FeaturebaseScript />
      <Tooltip>
        <TooltipTrigger>
          <Button
            className={cn(
              "hidden sm:inline-flex [&>*]:pointer-events-none",
              className,
            )}
            size="sm"
            variant="ghost"
            data-featurebase-changelog
          >
            <HelpCircleIcon className="h-4 w-4" />
            <span
              id="fb-update-badge"
              className="bg-primary rounded-full px-2 py-px text-xs text-gray-100 empty:hidden"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Trans key="whatsNew" defaults="What's new?" />
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export const FeaturebaseIdentify = () => {
  const { data: user } = trpc.whoami.get.useQuery();

  React.useEffect(() => {
    if (user?.isGuest !== false || !isFeedbackEnabled) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }

    win.Featurebase(
      "identify",
      {
        organization: "rallly",

        // Required. Replace with your customers data.
        email: user.email,
        name: user.name,
        id: user.id,
      },
      (err: Error) => {
        // Callback function. Called when identify completed.
        if (err) {
          console.error(err);
        }
      },
    );
  }, [user]);

  return <FeaturebaseScript />;
};
