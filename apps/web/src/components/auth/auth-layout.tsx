import Image from "next/image";
import React from "react";

export const AuthLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="h-full p-3 sm:p-8">
      <div className="flex h-full items-start justify-center">
        <div className="w-[480px] max-w-full overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="bg-pattern border-t-primary-600 border-b border-t-4 bg-gray-500/5 p-4 text-center sm:p-8">
            <Image
              src="/static/logo.svg"
              height={30}
              width={150}
              alt="Rallly"
              className="text-primary-600 inline-block h-7"
            />
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
