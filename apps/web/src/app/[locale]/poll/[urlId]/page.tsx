import { PollLayout } from "@/components/layouts/poll-layout";

import { AdminPage } from "./admin-page";

export default async function Page() {
  return (
    <PollLayout>
      <AdminPage />
    </PollLayout>
  );
}
