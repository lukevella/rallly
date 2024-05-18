"use client";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";

import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { VisibilityProvider } from "@/components/visibility";
import { PermissionsContext } from "@/contexts/permissions";
import { trpc } from "@/utils/trpc/client";

import Loader from "./loading";

const Prefetch = ({ children }: React.PropsWithChildren) => {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") as string;
  const params = useParams<{ urlId: string }>();
  const urlId = params?.urlId as string;
  const { data: permission } = trpc.auth.getUserPermission.useQuery(
    { token },
    {
      enabled: !!token,
    },
  );

  const { data: poll, error } = trpc.polls.get.useQuery(
    { urlId },
    {
      retry: false,
    },
  );

  const { data: participants } = trpc.polls.participants.list.useQuery({
    pollId: urlId,
  });

  const comments = trpc.polls.comments.list.useQuery({ pollId: urlId });

  if (error?.data?.code === "NOT_FOUND") {
    return <div>Not found</div>;
  }
  if (!poll || !participants || !comments.isFetched) {
    return <Loader />;
  }

  return (
    <PermissionsContext.Provider value={{ userId: permission?.userId ?? null }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Prefetch>
      <LegacyPollContextProvider>
        <VisibilityProvider>{children}</VisibilityProvider>
      </LegacyPollContextProvider>
    </Prefetch>
  );
}
