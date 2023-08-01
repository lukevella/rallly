import Script from "next/script";
import React from "react";

import { useUser } from "@/components/user-provider";

export const FeaturebaseProvider = ({ children }: React.PropsWithChildren) => {
  const { user } = useUser();

  React.useEffect(() => {
    if (user.isGuest) return;
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
  return (
    <>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
      {children}
    </>
  );
};
