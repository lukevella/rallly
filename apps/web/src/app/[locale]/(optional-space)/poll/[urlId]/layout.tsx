import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PollProvider } from "@/features/poll/client";
import { PollLayout } from "@/features/poll/components/poll-layout";
import { loadAdminPoll, loadPollAvailability } from "@/features/poll/loaders";

async function AdminPollLayout({
  params,
  children,
}: {
  params: Promise<{ urlId: string }>;
  children: React.ReactNode;
}) {
  const { urlId } = await params;
  const { poll, participants, comments } = await loadAdminPoll(urlId);

  return (
    <PollProvider
      poll={poll}
      participants={participants}
      comments={comments}
      viewerRole="admin"
    >
      <PollLayout>{children}</PollLayout>
    </PollProvider>
  );
}

export default function Layout({
  params,
  children,
}: {
  params: Promise<{ urlId: string }>;
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AdminPollLayout params={params}>{children}</AdminPollLayout>
    </Suspense>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; urlId: string }>;
}): Promise<Metadata> {
  const { urlId } = await props.params;
  const availability = await loadPollAvailability(urlId);

  if (!availability) {
    notFound();
  }

  return {
    title: availability.title,
  };
}
