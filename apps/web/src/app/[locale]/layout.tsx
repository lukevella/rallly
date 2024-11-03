import "tailwindcss/tailwind.css";
import "../../style.css";

import { PostHogProvider } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/toaster";
import type { Viewport } from "next";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import type { Session } from "next-auth";
import React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { Providers } from "@/app/providers";
import { getServerSession } from "@/auth";
import { GuestProvider } from "@/auth/client/guest-provider";
import { SessionProvider } from "@/auth/client/session-provider";
import { getGuestUser } from "@/auth/next";
import type { User } from "@/auth/schema";

const PostHogPageView = dynamic(() => import("@rallly/posthog/next"), {
  ssr: false,
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function Root({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let session: Session | null = null;
  let guestUser: User | null = null;

  try {
    session = await getServerSession();
    guestUser = await getGuestUser();
  } catch (error) {
    console.error(error);
  }

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <Toaster />
        <SessionProvider session={session}>
          <GuestProvider user={guestUser}>
            <PostHogProvider distinctId={session?.user?.id ?? guestUser?.id}>
              <PostHogPageView />
              <Providers>
                {children}
                <TimeZoneChangeDetector />
              </Providers>
            </PostHogProvider>
          </GuestProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
