import { Poll } from "@/components/poll";

import { GuestPollAlert } from "./guest-poll-alert";

export default async function Page() {
  return (
    <>
      <GuestPollAlert />
      <Poll />
    </>
  );
}
