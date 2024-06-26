import { redirect, RedirectType } from "next/navigation";

import { getServerSession } from "@/utils/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session?.user.email) {
    return redirect("/", RedirectType.replace);
  }

  return <div>{children}</div>;
}
