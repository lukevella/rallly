import React from "react";

import { Logo } from "@/components/logo";

export const AuthCard = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="bg-pattern border-t-primary-600 flex justify-center border-b border-t-4 bg-gray-500/5 p-4 text-center sm:p-8">
        <Logo />
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};

export const AuthFooter = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500">
      {children}
    </div>
  );
};
