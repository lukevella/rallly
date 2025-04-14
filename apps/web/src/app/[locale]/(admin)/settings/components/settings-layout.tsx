import { cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { InfoIcon } from "lucide-react";

export const SettingsContent = ({ children }: React.PropsWithChildren) => {
  return <div className="space-y-6">{children}</div>;
};

export const SettingsSection = (props: {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <section className="rounded-lg border p-4">
      <header className="mb-6">
        <h2 className="mb-2 text-base font-semibold leading-none">
          {props.title}
        </h2>
        <p className="text-muted-foreground text-sm">{props.description}</p>
      </header>
      <div>{props.children}</div>
    </section>
  );
};

export const SettingsGroup = ({ children }: React.PropsWithChildren) => {
  return <dl className="grid gap-3 md:gap-6">{children}</dl>;
};

export const SettingsItem = ({ children }: React.PropsWithChildren) => {
  return <div className="grid gap-1.5">{children}</div>;
};
export const SettingsItemTitle = ({
  children,
  hint,
}: React.PropsWithChildren<{ hint?: React.ReactNode }>) => {
  return (
    <div className="flex items-center gap-x-2">
      <dt className="text-sm font-medium text-gray-500">{children}</dt>
      {hint ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="inline-block size-4 text-gray-500" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm">
            {hint}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
};

export const SettingsItemValue = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return <dd className={cn("text-sm text-gray-900", className)}>{children}</dd>;
};
