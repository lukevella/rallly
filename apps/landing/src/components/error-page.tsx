import { buttonVariants } from "@rallly/ui";
import { FileSearchIcon } from "lucide-react";
import type * as React from "react";
import { LinkBase } from "@/i18n/client/link";

export interface ComponentProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  homeLabel: string;
  supportLabel: string;
}

const ErrorPage: React.FunctionComponent<ComponentProps> = ({
  icon,
  title,
  description,
  homeLabel,
  supportLabel,
}) => {
  return (
    <div className="inset-0 flex h-full w-full items-center justify-center lg:absolute">
      <div className="space-y-8">
        <div className="space-y-4">
          {icon || (
            <FileSearchIcon className="mb-4 inline-block size-24 text-gray-400" />
          )}
          <div className="mb-2 font-semibold text-3xl text-primary">
            {title}
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="flex space-x-3">
          <LinkBase href="/" className={buttonVariants({ variant: "primary" })}>
            {homeLabel}
          </LinkBase>
          <a href="https://support.rallly.co" className={buttonVariants()}>
            {supportLabel}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
