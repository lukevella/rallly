import { Button } from "@rallly/ui/button";
import { FrownIcon } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import * as React from "react";

export interface ComponentProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const ErrorPage: React.FunctionComponent<ComponentProps> = ({
  icon: Icon = FrownIcon,
  title,
  description,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <Icon className="mb-4 inline-block size-24 text-gray-400" />
          <div className="text-primary-600 mb-2 text-3xl font-bold ">
            {title}
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="flex justify-center space-x-3">
          <Button variant="primary" asChild>
            <Link href="/">{t("errors_goToHome")}</Link>
          </Button>
          <Button asChild>
            <Link
              href="https://support.rallly.co"
              passHref={true}
              className="btn-default"
            >
              {t("common_support")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
