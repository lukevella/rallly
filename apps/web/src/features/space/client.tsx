"use client";

import { usePostHog } from "@rallly/posthog/client";
import React from "react";
import type { SpaceDTO } from "@/features/space/types";

const SpaceContext = React.createContext<{
  data: SpaceDTO;
}>({
  data: {
    id: "",
    name: "",
    ownerId: "system",
    role: "member",
    tier: "hobby",
  },
});

export const useSpace = () => {
  return React.useContext(SpaceContext);
};

export const SpaceProvider = ({
  data,
  children,
}: {
  data: SpaceDTO;
  children: React.ReactNode;
}) => {
  const value = React.useMemo(
    () => ({
      data,
    }),
    [data],
  );

  const posthog = usePostHog();

  React.useEffect(() => {
    posthog?.group("space", data.id, {
      name: data.name,
      tier: data.tier,
    });
  }, [posthog, data.id, data.name, data.tier]);

  return (
    <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
  );
};
