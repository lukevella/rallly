import React from "react";

import { SettingsMenu } from "./menu-item";

export default async function ProfileLayout({
  children,
}: React.PropsWithChildren<{
  params: { locale: string };
}>) {
  return (
    <div>
      <div>
        <SettingsMenu />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
