import { CheckIcon } from "@rallly/icons";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "./lib/utils";

const billingPlanVariants = cva(
  "border  flex flex-col rounded-md shadow-sm overflow-hidden divide-y",
  {
    variants: {
      variant: {
        primary: "bg-white",
        default: "bg-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export const BillingPlan = ({
  variant = "default",
  children,
}: React.PropsWithChildren<VariantProps<typeof billingPlanVariants>>) => {
  return <div className={billingPlanVariants({ variant })}>{children}</div>;
};

export const BillingPlanHeader = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return <div className={cn("px-4 py-3", className)}>{children}</div>;
};

export const BillingPlanTitle = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <h1 className={cn("mb-2 text-xl font-bold tracking-tight", className)}>
      {children}
    </h1>
  );
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
  return <ul className="grow space-y-1 p-4 text-sm">{children}</ul>;
};

export const BillingPlanPerk = ({ children }: React.PropsWithChildren) => {
  return (
    <li className="flex items-center gap-x-2 ">
      <CheckIcon className="h-4 w-4 text-green-600" />
      <span>{children}</span>
    </li>
  );
};

export const BillingPlanFooter = ({ children }: React.PropsWithChildren) => {
  return <div className="p-4">{children}</div>;
};
