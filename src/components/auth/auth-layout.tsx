import React from "react";

import { Logo } from "../logo";

export const AuthLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="h-full bg-slate-500/10 p-8">
      <div className="flex h-full items-start justify-center">
        <div className="w-[480px] max-w-full overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="bg-pattern border-b border-t-4 border-t-primary-500 bg-slate-500/5 p-4 text-center sm:p-8">
            <Logo />
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
