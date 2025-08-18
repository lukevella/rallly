"use client";

import { Button } from "@rallly/ui/button";
import { FileSearchIcon } from "lucide-react";
import type * as React from "react";
import { LinkBase } from "@/i18n/client/link";
import { useTranslation } from "@/i18n/client/use-translation";

export interface ComponentProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

const ErrorPage: React.FunctionComponent<ComponentProps> = ({
  icon,
  title,
  description,
}) => {
  const { t } = useTranslation();
  return (
    <div className="inset-0 flex h-full w-full items-center justify-center lg:absolute">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          {icon || (
            <FileSearchIcon className="mb-4 inline-block size-24 text-gray-400" />
          )}
          <div className="mb-2 font-bold text-3xl text-primary-600">
            {title}
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="flex justify-center space-x-3">
          <Button variant="primary" asChild>
            <LinkBase href="/">{t("goToHome")}</LinkBase>
          </Button>
          <Button asChild>
            <a href="https://support.rallly.co">{t("support")}</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
