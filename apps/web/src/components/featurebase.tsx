import { trpc } from "@rallly/backend";
import { HelpCircleIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import Script from "next/script";
import React from "react";

import { Trans } from "@/components/trans";
import { isFeedbackEnabled } from "@/utils/constants";

const FeaturebaseContext = React.createContext(false);

export const Changelog = ({ className }: { className?: string }) => {
  const isFeaturebaseEnabled = React.useContext(FeaturebaseContext);
  React.useEffect(() => {
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }
    win.Featurebase(
      "initialize_changelog_widget",
      {
        organization: "rallly", // Replace this with your featurebase organization name
        placement: "bottom", // Choose between right, left, top, bottom placement
        theme: "light", // Choose between dark or light theme
      },
      console.error,
    );
  }, []);

  if (!isFeaturebaseEnabled) return null;

  return (
    <Button
      className={className}
      size="sm"
      variant="ghost"
      data-featurebase-changelog
    >
      <HelpCircleIcon className="h-4 w-4" />
      <span className="hidden sm:block">
        <Trans key="whatsNew" defaults="What's new?" />
      </span>
      <span
        id="fb-update-badge"
        className="bg-primary rounded-md px-1 py-px text-xs text-gray-100 empty:hidden"
      />
    </Button>
  );
};

export const FeaturebaseProvider = ({ children }: React.PropsWithChildren) => {
  const { data: user } = trpc.whoami.get.useQuery();

  React.useEffect(() => {
    if (user?.isGuest !== false) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }

    if (!isFeedbackEnabled) return;

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
  return (
    <FeaturebaseContext.Provider value={true}>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
      {children}
    </FeaturebaseContext.Provider>
  );
};
