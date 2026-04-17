"use client";
import dynamic from "next/dynamic";
import { PollBrandingFromContext } from "@/components/poll/poll-branding";

const InvitePage = dynamic(
  () => import("./invite-page").then((mod) => mod.InvitePage),
  { ssr: false },
);

export function InvitePageLoader() {
  return (
    <>
      <PollBrandingFromContext />
      <InvitePage />
    </>
  );
}
