import { cn } from "@rallly/ui";
import { GlobeIcon, MapPinIcon } from "lucide-react";

import { LogoLink } from "@/app/components/logo-link";

export function InviteCardGeneral({
  title,
  location,
  description,
}: {
  title?: React.ReactNode;
  location?: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <aside className="border-primary w-72 shrink-0 p-6">
      <LogoLink />
      <h1 className="my-2 text-lg font-bold">{title}</h1>
      {description ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      <ul className="mt-4 space-y-2.5">
        {location ? (
          <li className="text-muted-foreground flex items-center text-sm leading-relaxed">
            <MapPinIcon className="mr-2 inline-block h-4 w-4" />
            <span>{location}</span>
          </li>
        ) : null}
        <li className="text-muted-foreground flex items-center text-sm leading-relaxed">
          <GlobeIcon className="mr-2 inline-block h-4 w-4" />
          <span>Europe/London</span>
        </li>
      </ul>
    </aside>
  );
}

export function InviteCardForm({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("h-[400px] min-h-0 w-96 grow overflow-auto", className)}>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function InviteCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-h-full min-h-0 max-w-4xl rounded-lg border bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
