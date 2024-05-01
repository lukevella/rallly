import { CheckCircle2Icon } from "lucide-react";

import { cn } from "./lib/utils";

export const BillingPlan = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <div
      className={cn(
        "space-y-4 rounded-md border bg-white px-5 py-4 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BillingPlanHeader = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return <div className={cn(className)}>{children}</div>;
};

export const BillingPlanTitle = ({ children }: React.PropsWithChildren) => {
  return <h3 className="font-semibold">{children}</h3>;
};

export const BillingPlanDescription = ({
  children,
}: React.PropsWithChildren) => {
  return <p className="text-muted-foreground text-sm">{children}</p>;
};

export const BillingPlanPrice = ({
  children,
  discount,
}: React.PropsWithChildren<{ discount?: React.ReactNode }>) => {
  return (
    <div>
      {discount ? (
        <>
          <span className="mr-2 text-xl font-bold line-through">
            {children}
          </span>
          <span className="text-3xl font-bold">{discount}</span>
        </>
      ) : (
        <span className="text-3xl font-bold">{children}</span>
      )}
    </div>
  );
};

export const BillingPlanPeriod = ({ children }: React.PropsWithChildren) => {
  return <div className="text-muted-foreground text-sm">{children}</div>;
};

export const BillingPlanPerks = ({ children }: React.PropsWithChildren) => {
  return <ul className="grid gap-1">{children}</ul>;
};

export const BillingPlanPerk = ({
  children,
  pro,
}: React.PropsWithChildren<{ pro?: boolean }>) => {
  return (
    <li className="flex items-start gap-x-2.5">
      <CheckCircle2Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          !pro ? "text-gray-500" : "text-primary",
        )}
      />
      <div className="text-muted-foreground text-sm">{children}</div>
    </li>
  );
};
