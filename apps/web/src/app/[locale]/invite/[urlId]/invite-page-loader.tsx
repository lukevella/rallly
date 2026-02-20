"use client";
import dynamic from "next/dynamic";

const InvitePage = dynamic(
  () => import("./invite-page").then((mod) => mod.InvitePage),
  { ssr: false },
);

export function InvitePageLoader() {
  return <InvitePage />;
}
