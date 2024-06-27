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

  return (
    <div className="relative h-screen pt-[20vh]">
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 z-10 h-screen w-full stroke-gray-200 [mask-image:radial-gradient(800px_800px_at_center,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
              width={220}
              height={220}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 220V.5H220" fill="none" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            strokeWidth={0}
            fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
          />
        </svg>
      </div>

      <div className="relative z-20">{children}</div>
    </div>
  );
}
