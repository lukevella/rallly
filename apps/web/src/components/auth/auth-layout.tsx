import Link from "next/link";
import { Trans } from "next-i18next";
import React from "react";

import { Logo } from "@/components/logo";
import { IfCloudHosted } from "@/contexts/environment";

export const AuthLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="h-full p-3 sm:p-8">
      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="bg-pattern border-t-primary-600 flex justify-center border-b border-t-4 bg-gray-500/5 p-4 text-center sm:p-8">
            <Logo />
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>
        <IfCloudHosted>
          <p className="mt-8 text-center">
            <Link
              href="/polls"
              className="text-muted-foreground hover:underline"
            >
              <Trans i18nKey="continueAsGuest" defaults="Continue as Guest" />
            </Link>
          </p>
        </IfCloudHosted>
      </div>
    </div>
  );
};
